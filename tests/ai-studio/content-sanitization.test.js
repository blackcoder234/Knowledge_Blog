const {
  sanitizeArticleHtml,
  serializeJsonForHtml,
} = require("../../lib/sanitizeHtml.ts");
const { safeExternalUrl } = require("../../lib/safeExternalUrl.ts");

async function runTests(testTracker) {
  console.log("\n--- Suite 8: Stored Content Sanitization ---");

  const sanitized = sanitizeArticleHtml(
    '<p onclick="alert(1)">Article</p><script>alert(2)</script><img src="x" onerror="alert(3)"><a href="javascript:alert(4)" target="_blank">bad link</a>',
  );
  testTracker.assert("Sanitizer retains article text", sanitized.includes("<p>Article</p>"));
  testTracker.assert("Sanitizer removes script elements", !/<script\b/i.test(sanitized));
  testTracker.assert("Sanitizer removes inline event handlers", !/on(?:click|error)=/i.test(sanitized));
  testTracker.assert("Sanitizer removes javascript URLs", !/javascript:/i.test(sanitized));
  testTracker.assert(
    "Profile links reject javascript URLs",
    safeExternalUrl("javascript:alert(1)") === null,
  );
  testTracker.assert(
    "Profile links reject protocol-relative URLs",
    safeExternalUrl("//attacker.example") === null,
  );
  testTracker.assert(
    "Profile links retain HTTPS URLs",
    safeExternalUrl("https://example.com/profile") === "https://example.com/profile",
  );

  const safeJson = serializeJsonForHtml({
    headline: "</script><script>alert(1)</script>",
  });
  testTracker.assert("JSON-LD serialization escapes script-breaking markup", !safeJson.includes("<"));
}

module.exports = { runTests };
