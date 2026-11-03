export const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com 'report-sample'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "media-src 'self' blob: data: https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "report-uri /api/csp-report",
].join("; ");

export interface SanitizedCspViolation {
  documentUri?: string;
  violatedDirective?: string;
  effectiveDirective?: string;
  blockedUri?: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().slice(0, 2048);
    }
  }
  return undefined;
}

function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return `${url.origin}${url.pathname}`.slice(0, 512);
    }
  } catch {
    // CSP values such as "inline", "eval", and "data" are not URLs.
  }

  return value.split(/[?#]/, 1)[0].replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
}

function sanitizeViolation(value: unknown): SanitizedCspViolation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const violatedDirective = readString(record, "violated-directive", "violatedDirective");
  const effectiveDirective = readString(record, "effective-directive", "effectiveDirective");
  const blockedUri = readString(record, "blocked-uri", "blockedURL", "blockedUri");
  const sourceFile = readString(record, "source-file", "sourceFile");
  const documentUri = readString(record, "document-uri", "documentURL", "documentUri", "url");
  const lineNumber = record["line-number"] ?? record.lineNumber;
  const columnNumber = record["column-number"] ?? record.columnNumber;

  if (!violatedDirective && !effectiveDirective && !blockedUri) return null;

  return {
    documentUri: sanitizeUrl(documentUri),
    violatedDirective,
    effectiveDirective,
    blockedUri: sanitizeUrl(blockedUri),
    sourceFile: sanitizeUrl(sourceFile),
    lineNumber: typeof lineNumber === "number" && Number.isFinite(lineNumber)
      ? lineNumber
      : undefined,
    columnNumber: typeof columnNumber === "number" && Number.isFinite(columnNumber)
      ? columnNumber
      : undefined,
  };
}

export function sanitizeCspReportPayload(
  payload: unknown,
): SanitizedCspViolation[] | null {
  if (!payload || typeof payload !== "object") return null;

  if (Array.isArray(payload)) {
    if (payload.length === 0 || payload.length > 10) return null;
    const reports = payload
      .map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
        const report = entry as Record<string, unknown>;
        const violation = sanitizeViolation(report.body);
        if (violation && !violation.documentUri) {
          violation.documentUri = sanitizeUrl(readString(report, "url"));
        }
        return violation;
      })
      .filter((report): report is SanitizedCspViolation => report !== null);
    return reports.length > 0 ? reports : null;
  }

  const record = payload as Record<string, unknown>;
  const legacyReport = sanitizeViolation(record["csp-report"]);
  if (legacyReport) return [legacyReport];

  return null;
}
