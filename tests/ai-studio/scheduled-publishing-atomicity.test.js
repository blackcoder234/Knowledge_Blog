async function runTests(testTracker) {
  console.log("\n--- Suite 4: Scheduled Automation Disabled ---");

  const { GET: publishScheduledGet } = require("../../app/api/cron/publish-scheduled/route");
  const {
    GET: aiResearchSyncGet,
    POST: aiResearchSyncPost,
  } = require("../../app/api/cron/ai-research-sync/route");

  const handlers = [
    ["Scheduled publishing GET", publishScheduledGet],
    ["AI research sync GET", aiResearchSyncGet],
    ["AI research sync POST", aiResearchSyncPost],
  ];

  const originalCronSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "disabled_job_test_secret";

  try {
    for (const [name, handler] of handlers) {
      const response = await handler(
        new Request(`http://localhost:3000/api/cron/${name}`, {
          headers: { authorization: "Bearer disabled_job_test_secret" },
        }),
      );
      const body = await response.json();

      testTracker.assert(`${name} permanently disabled with HTTP 410`, response.status === 410);
      testTracker.assert(`${name} returns an explicit disabled message`, body.success === false);
    }
  } finally {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  }
}

module.exports = { runTests };
