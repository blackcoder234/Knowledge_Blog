import crypto from "node:crypto";
import { getTrustedClientIp } from "@/lib/trustedClientIp";

export function getRequestClientKey(
  request: Request,
  fallbackIdentity?: string | null,
): string | null {
  const clientAddress = getTrustedClientIp(request.headers);
  if (clientAddress) {
    return crypto.createHash("sha256").update(`ip:${clientAddress}`).digest("hex");
  }
  if (fallbackIdentity && typeof fallbackIdentity === "string") {
    const normalized = fallbackIdentity.trim().toLowerCase();
    if (normalized) {
      return crypto.createHash("sha256").update(`id:${normalized}`).digest("hex");
    }
  }
  return null;
}
