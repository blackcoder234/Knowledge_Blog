import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";

export const GUEST_LIKE_COOKIE = "knowledge_guest_like";

function sign(visitorId: string, secret: string): string {
  return createHmac("sha256", secret).update(visitorId).digest("hex");
}

export function getGuestLikeIdentity(
  request: Request,
): { visitorId: string; visitorHash: string; cookieValue?: string } | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_LIKE_COOKIE}=`))
    ?.slice(GUEST_LIKE_COOKIE.length + 1);
  const [visitorId, suppliedSignature] = cookie?.split(".") ?? [];

  if (
    visitorId &&
    /^[a-f0-9]{64}$/.test(visitorId) &&
    suppliedSignature &&
    /^[a-f0-9]{64}$/.test(suppliedSignature)
  ) {
    const expected = Buffer.from(sign(visitorId, secret), "hex");
    const supplied = Buffer.from(suppliedSignature, "hex");
    if (timingSafeEqual(expected, supplied)) {
      return {
        visitorId,
        visitorHash: createHash("sha256").update(visitorId).digest("hex"),
      };
    }
  }

  const newVisitorId = randomBytes(32).toString("hex");
  return {
    visitorId: newVisitorId,
    visitorHash: createHash("sha256").update(newVisitorId).digest("hex"),
    cookieValue: `${newVisitorId}.${sign(newVisitorId, secret)}`,
  };
}
