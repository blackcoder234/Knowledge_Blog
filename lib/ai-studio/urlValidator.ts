import dns from "dns/promises";
import ipaddr from "ipaddr.js";

/**
 * Validates external URLs against non-global IPv4/IPv6 ranges and pins the
 * validated destination to prevent DNS rebinding between lookup and connection.
 */

// Blocked internal hostnames
export const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "instance-data",
  "169.254.169.254",
];

export function isPrivateIpv4(ip: string): boolean {
  try {
    return ipaddr.IPv4.parse(ip).range() !== "unicast";
  } catch {
    return true;
  }
}

export function isPrivateIp(ip: string): boolean {
  try {
    const address = ipaddr.parse(ip.trim());
    if (address instanceof ipaddr.IPv6 && address.isIPv4MappedAddress()) {
      return true;
    }
    return address.range() !== "unicast";
  } catch {
    return true;
  }
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isIpLiteral =
    ipaddr.IPv4.isValid(normalized) || ipaddr.IPv6.isValid(normalized);
  return (
    BLOCKED_HOSTNAMES.includes(normalized) ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".localhost") ||
    (isIpLiteral && isPrivateIp(normalized))
  );
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

export interface PinnedDestination {
  valid: boolean;
  error?: string;
  url?: string;
  hostname?: string;
  port?: number;
  pathname?: string;
  search?: string;
  pinnedIp?: string;
  family?: 4 | 6;
  ca?: string | Buffer | Array<string | Buffer>;
}

export type HostLookupResult = { address: string; family: number };
export type HostResolver = (hostname: string) => Promise<HostLookupResult[]>;

async function lookupWithTimeout(
  hostname: string,
  timeoutMs = 3000,
  resolver: HostResolver = (host) => dns.lookup(host, { all: true }),
) {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      resolver(hostname),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("DNS lookup timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Resolves DNS for a destination URL, validates all resolved IP addresses against SSRF filters,
 * and extracts a validated pinned IP address for connection-time pinning.
 */
export async function resolveAndPinSafeIp(
  rawUrl: string,
  options: { resolver?: HostResolver; timeoutMs?: number } = {},
): Promise<PinnedDestination> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL is required and must be a string." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: `Insecure protocol "${parsed.protocol}". Only HTTPS feeds are permitted.`,
    };
  }
  if (parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
    return {
      valid: false,
      error: "Credentials and non-standard ports are not permitted for research feeds.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isBlockedHostname(hostname)) {
    return {
      valid: false,
      error: `Access to internal host "${hostname}" is prohibited.`,
    };
  }

  try {
    const lookup = await lookupWithTimeout(
      hostname,
      options.timeoutMs ?? 3000,
      options.resolver,
    );
    if (!lookup || lookup.length === 0) {
      return { valid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const entry of lookup) {
      const ip = entry.address;
      if (isPrivateIp(ip)) {
        return {
          valid: false,
          error: `Host "${hostname}" resolved to restricted IP address (${ip}). Request blocked.`,
        };
      }
    }

    const pinnedIp = lookup[0].address;
    const family: 4 | 6 = pinnedIp.includes(":") ? 6 : 4;
    const port = parsed.port ? parseInt(parsed.port, 10) : 443;

    return {
      valid: true,
      url: parsed.toString(),
      hostname,
      port,
      pathname: parsed.pathname || "/",
      search: parsed.search || "",
      pinnedIp,
      family,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `DNS lookup failed for "${hostname}": ${err.message || "Unknown error"}`,
    };
  }
}

export async function validateResearchSourceUrl(rawUrl: string): Promise<ValidationResult> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL is required and must be a string." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  // 1. Enforce HTTPS only (industry-standard for external feeds)
  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: `Insecure protocol "${parsed.protocol}". Only HTTPS feeds are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject blocked internal hostnames
  if (isBlockedHostname(hostname)) {
    return {
      valid: false,
      error: `Access to internal host "${hostname}" is prohibited.`,
    };
  }

  // Check if hostname itself is directly an IP literal
  // 3. Resolve DNS to ensure destination IP is not private or loopback
  try {
    if (parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
      return {
        valid: false,
        error: "Credentials and non-standard ports are not permitted for research feeds.",
      };
    }

    const lookup = await lookupWithTimeout(hostname);
    if (!lookup || lookup.length === 0) {
      return { valid: false, error: `Could not resolve hostname "${hostname}".` };
    }

    for (const entry of lookup) {
      const ip = entry.address;
      if (isPrivateIp(ip)) {
        return {
          valid: false,
          error: `Resolved to restricted private or loopback IP address (${ip}). Request blocked.`,
        };
      }
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `DNS lookup failed for "${hostname}": ${err.message || "Unknown error"}`,
    };
  }

  return {
    valid: true,
    normalizedUrl: parsed.toString(),
  };
}

/**
 * Validates links parsed inside feed items to ensure they are valid HTTPS/HTTP URLs
 * and do not use dangerous schemes like javascript:, data:, or file:.
 */
export function sanitizeItemLink(link: string): string | null {
  if (!link || typeof link !== "string") return null;
  try {
    const parsed = new URL(link.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    if (isBlockedHostname(host)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
