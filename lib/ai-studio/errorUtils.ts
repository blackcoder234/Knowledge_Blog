import { NextResponse } from "next/server";

/**
 * Redacts secrets, API keys, tokens, URIs, and local file paths from server logs.
 */
export function redactSensitiveData(message: string): string {
  if (!message || typeof message !== "string") return "";
  return message
    .replace(/(?:key|token|secret|password|bearer|authorization)=["']?[^&"'\s]+["']?/gi, "$1=[REDACTED]")
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GEMINI_KEY]")
    .replace(/sk-[0-9A-Za-z]{32,}/g, "[REDACTED_OPENAI_KEY]")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[REDACTED_MONGODB_URI]")
    .replace(/[a-zA-Z]:\\[^ \n\r\t:'"]+/g, "[REDACTED_PATH]")
    .replace(/\/home\/[^ \n\r\t:'"]+/g, "[REDACTED_PATH]");
}

/**
 * Returns a standardized, sanitized client error response while recording
 * redacted technical diagnostics to server logs.
 */
export function safeErrorResponse(
  error: any,
  userFriendlyMessage: string,
  statusCode = 500,
  errorCode = "INTERNAL_SERVER_ERROR"
) {
  const rawMsg = error?.stack || error?.message || String(error);
  const redactedLog = redactSensitiveData(rawMsg);
  console.error(`[AI_STUDIO_${errorCode}]:`, redactedLog);

  return NextResponse.json(
    {
      success: false,
      error: userFriendlyMessage,
      code: errorCode,
    },
    { status: statusCode }
  );
}

