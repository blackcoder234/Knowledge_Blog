import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_SECURITY_POLICY_REPORT_ONLY,
  sanitizeCspReportPayload,
} from "../lib/contentSecurityPolicy";

test("report-only policy preserves required site sources without allowing inline scripts", () => {
  assert.match(CONTENT_SECURITY_POLICY_REPORT_ONLY, /report-uri \/api\/csp-report/);
  assert.match(CONTENT_SECURITY_POLICY_REPORT_ONLY, /https:\/\/www\.youtube\.com/);
  assert.match(CONTENT_SECURITY_POLICY_REPORT_ONLY, /https:\/\/va\.vercel-scripts\.com/);
  assert.match(CONTENT_SECURITY_POLICY_REPORT_ONLY, /style-src 'self' 'unsafe-inline'/);

  const scriptPolicy = CONTENT_SECURITY_POLICY_REPORT_ONLY
    .split("; ")
    .find((directive) => directive.startsWith("script-src "));
  assert.ok(scriptPolicy);
  assert.doesNotMatch(scriptPolicy, /'unsafe-inline'/);
});

test("sanitizes legacy CSP reports and removes query strings and samples", () => {
  const reports = sanitizeCspReportPayload({
    "csp-report": {
      "document-uri": "https://www.knowledgelog.blog/blog/post?token=secret",
      "violated-directive": "script-src-elem",
      "blocked-uri": "https://unknown.example/script.js?secret=1",
      "script-sample": "must not be logged",
    },
  });

  assert.deepEqual(reports, [{
    documentUri: "https://www.knowledgelog.blog/blog/post",
    violatedDirective: "script-src-elem",
    effectiveDirective: undefined,
    blockedUri: "https://unknown.example/script.js",
    sourceFile: undefined,
    lineNumber: undefined,
    columnNumber: undefined,
  }]);
});

test("accepts Reporting API batches and rejects malformed or oversized batches", () => {
  assert.deepEqual(
    sanitizeCspReportPayload([
      {
        type: "csp-violation",
        url: "https://www.knowledgelog.blog/article#section",
        body: { effectiveDirective: "img-src", blockedURL: "https://bad.example/image" },
      },
    ]),
    [{
      documentUri: "https://www.knowledgelog.blog/article",
      violatedDirective: undefined,
      effectiveDirective: "img-src",
      blockedUri: "https://bad.example/image",
      sourceFile: undefined,
      lineNumber: undefined,
      columnNumber: undefined,
    }],
  );
  assert.equal(sanitizeCspReportPayload({}), null);
  assert.equal(sanitizeCspReportPayload(Array(11).fill({ body: { blockedURL: "inline" } })), null);
});
