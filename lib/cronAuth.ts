import crypto from "node:crypto";

function timingSafeMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function isCronAuthorized(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) return false;
  const authorization = request.headers.get("authorization") || "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  return Boolean(match && timingSafeMatch(match[1], secret));
}
