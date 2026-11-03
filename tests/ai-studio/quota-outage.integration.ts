import {
  checkDistributedRateLimit,
  QuotaStoreUnavailableError,
  reserveDailyQuota,
  reserveDailyResearchFetch,
} from "../../lib/ai-studio/rateLimiter";

async function main() {
  const distributed = await checkDistributedRateLimit(
    "integration-outage",
    "draft_convert",
    { maxRequests: 1, windowMs: 60_000 },
  );
  if (distributed.allowed || !distributed.isServiceUnavailable) {
    throw new Error("Distributed limiter did not fail closed during MongoDB outage.");
  }

  for (const reserve of [
    () => reserveDailyQuota("draft_generation", 1),
    () => reserveDailyResearchFetch(1),
  ]) {
    try {
      await reserve();
      throw new Error("Daily quota reservation succeeded while MongoDB was unavailable.");
    } catch (error) {
      if (!(error instanceof QuotaStoreUnavailableError)) throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
