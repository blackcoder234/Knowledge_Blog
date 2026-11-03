import { isIP } from "node:net";

function getHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;

  const headerSource = headers as {
    get?: (key: string) => string | null;
  };
  if (typeof headerSource.get === "function") {
    return headerSource.get(name)?.trim() || undefined;
  }

  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[name.toLowerCase()];
  return typeof value === "string" ? value.trim() : undefined;
}

export function getTrustedClientIp(headers: unknown): string | null {
  const realIp = getHeader(headers, "x-real-ip");
  if (realIp && isIP(realIp)) return realIp.toLowerCase();

  if (process.env.NODE_ENV !== "production") {
    const forwardedFor = getHeader(headers, "x-forwarded-for");
    const firstAddress = forwardedFor?.split(",")[0]?.trim();
    if (firstAddress && isIP(firstAddress)) return firstAddress.toLowerCase();
  }

  return null;
}
