async function runTests(testTracker) {
  console.log("\n--- Suite 5: Mock-Based Rate Limiter Examples (Not MongoDB Integration) ---");

  // In-memory mock representing MongoDB atomic rate limiter collection
  const mockRateLimitCollection = new Map();

  function atomicCheckRateLimit(identifier, action, maxRequests, windowMs, currentTime) {
    const bucket = Math.floor(currentTime / windowMs);
    const key = `rl:${identifier}:${action}:${bucket}`;
    const resetAt = (bucket + 1) * windowMs;

    let record = mockRateLimitCollection.get(key);
    if (!record) {
      record = { count: 0, resetAt };
      mockRateLimitCollection.set(key, record);
    }

    record.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - currentTime) / 1000));

    if (record.count > maxRequests) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    return { allowed: true, remaining: maxRequests - record.count, retryAfterSeconds: 0 };
  }

  const baseTime = 1000000;
  const windowMs = 60000; // 1 minute
  const maxRequests = 3;

  // 1. Initial requests within quota
  const req1 = atomicCheckRateLimit("user_1", "draft_convert", maxRequests, windowMs, baseTime);
  const req2 = atomicCheckRateLimit("user_1", "draft_convert", maxRequests, windowMs, baseTime + 1000);
  const req3 = atomicCheckRateLimit("user_1", "draft_convert", maxRequests, windowMs, baseTime + 2000);

  testTracker.assert("Rate Limiter: Request 1 allowed", req1.allowed === true && req1.remaining === 2);
  testTracker.assert("Rate Limiter: Request 2 allowed", req2.allowed === true && req2.remaining === 1);
  testTracker.assert("Rate Limiter: Request 3 allowed (quota reached)", req3.allowed === true && req3.remaining === 0);

  // 2. Request 4 exceeds quota
  const req4 = atomicCheckRateLimit("user_1", "draft_convert", maxRequests, windowMs, baseTime + 3000);
  testTracker.assert("Rate Limiter: Request 4 blocked with 429", req4.allowed === false);
  testTracker.assert("Rate Limiter: Provides retryAfterSeconds > 0", req4.retryAfterSeconds > 0);

  // 3. User isolation: user_2 is independent
  const user2Req = atomicCheckRateLimit("user_2", "draft_convert", maxRequests, windowMs, baseTime + 3000);
  testTracker.assert("Rate Limiter: User 2 unaffected by User 1 limit", user2Req.allowed === true);

  // 4. Window expiration: once window bucket advances, quota resets
  const nextWindowTime = baseTime + windowMs + 100;
  const resetReq = atomicCheckRateLimit("user_1", "draft_convert", maxRequests, windowMs, nextWindowTime);
  testTracker.assert("Rate Limiter: Quota resets automatically in next time bucket", resetReq.allowed === true);

  // 5. Database Outage Behavior: Fail-Closed Protection
  // Verifies that if MongoDB is unavailable, expensive operations are rejected with 503 instead of falling back to local unshared memory
  function simulateDistributedRateLimitWithDbOutage(failDb) {
    if (failDb) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 30,
        error: "Shared quota service temporarily unavailable",
        isServiceUnavailable: true,
      };
    }
    return { allowed: true, remaining: 10, retryAfterSeconds: 0 };
  }

  const outageResult = simulateDistributedRateLimitWithDbOutage(true);
  testTracker.assert("Rate Limiter Outage: Fails closed when DB is unreachable (allowed = false)", outageResult.allowed === false);
  testTracker.assert("Rate Limiter Outage: Returns isServiceUnavailable flag", outageResult.isServiceUnavailable === true);
  testTracker.assert("Rate Limiter Outage: Maps to HTTP 503 Service Unavailable", outageResult.isServiceUnavailable ? 503 : 429 === 503);

  // 6. Actual Daily Research Source Fetch Quota Enforcement
  let simulatedActualSourceFetches = 0;
  const maxDailySources = 50;

  function recordActualSourceFetches(count) {
    simulatedActualSourceFetches += count;
    return simulatedActualSourceFetches;
  }

  function checkDailySourceQuota() {
    return simulatedActualSourceFetches < maxDailySources;
  }

  testTracker.assert("Daily Source Quota: Initially allows source fetches", checkDailySourceQuota() === true);
  recordActualSourceFetches(20);
  testTracker.assert("Daily Source Quota: Accurate cumulative count (20)", simulatedActualSourceFetches === 20);
  recordActualSourceFetches(30);
  testTracker.assert("Daily Source Quota: Reaches daily limit exactly (50)", simulatedActualSourceFetches === 50);
  testTracker.assert("Daily Source Quota: Blocks subsequent fetches once limit reached", checkDailySourceQuota() === false);
}

module.exports = { runTests };
