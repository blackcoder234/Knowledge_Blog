import { NextResponse } from "next/server";
import { getRequestClientKey } from "@/lib/requestClientKey";
import { readLimitedRequestText } from "@/lib/readLimitedRequestText";
import { checkRateLimit } from "@/lib/ai-studio/rateLimiter";
import { sanitizeCspReportPayload } from "@/lib/contentSecurityPolicy";

const MAX_REPORT_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const clientKey = getRequestClientKey(request);
  if (!clientKey) {
    return new NextResponse(null, { status: 204 });
  }
  const rateLimit = checkRateLimit(clientKey, "csp_reports");
  if (!rateLimit.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (
    contentType &&
    contentType !== "application/csp-report" &&
    contentType !== "application/reports+json" &&
    contentType !== "application/json"
  ) {
    return NextResponse.json({ error: "Unsupported report format" }, { status: 415 });
  }

  const bodyResult = await readLimitedRequestText(request, MAX_REPORT_BODY_BYTES);
  if ("error" in bodyResult) {
    return NextResponse.json(
      { error: bodyResult.error === "too_large" ? "Report too large" : "Report required" },
      { status: bodyResult.error === "too_large" ? 413 : 400 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyResult.text);
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const violations = sanitizeCspReportPayload(payload);
  if (!violations) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  for (const violation of violations) {
    console.warn("CSP report-only violation", violation);
  }

  return new NextResponse(null, { status: 204 });
}
