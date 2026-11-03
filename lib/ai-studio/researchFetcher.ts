import crypto from "crypto";
import { randomUUID } from "node:crypto";
import https from "node:https";
import dbConnect from "@/lib/db";
import AIResearchSource from "@/models/AIResearchSource";
import AIResearchItem from "@/models/AIResearchItem";
import { resolveAndPinSafeIp, sanitizeItemLink, PinnedDestination } from "./urlValidator";
import { sanitizeUntrustedText } from "./promptSanitizer";
import {
  QuotaStoreUnavailableError,
  reserveDailyResearchFetch,
} from "./rateLimiter";

export interface ParsedFeedItem {
  title: string;
  url: string;
  authorOrPublisher?: string;
  publishedAt?: Date;
  summary: string;
  contentHash: string;
}

/**
 * Sanitizes raw HTML or text from RSS feeds to prevent XSS and strip hidden injection blocks.
 */
export function sanitizeExternalText(rawText: string): string {
  if (!rawText) return "";

  // 1. Remove comments <!-- ... -->
  let text = rawText.replace(/<!--[\s\S]*?-->/g, " ");

  // 2. Remove script and style tags
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");

  // 3. Strip all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // 4. Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 5. Clean control characters and normalize whitespace
  return sanitizeUntrustedText(text, 600);
}

/**
 * Generates an SHA-256 hash of title + url for cryptographic deduplication.
 */
export function computeContentHash(url: string, title: string): string {
  const normalized = `${url.trim().toLowerCase()}|${title.trim().toLowerCase()}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Lightweight, compliant parser for RSS 2.0 and Atom XML feeds with link validation.
 */
export function parseRssOrAtomXml(xmlText: string, defaultPublisher: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const maxItems = 100;

  // Match RSS <item> tags
  const rssItemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (rssItemMatches.length > 0) {
    for (const itemXml of rssItemMatches.slice(0, maxItems)) {
      const titleMatch = itemXml.match(/<title(?:\s+[^>]*)?>([\s\S]*?)<\/title>/i);
      const linkMatch =
        itemXml.match(/<link(?:\s+[^>]*)?>([\s\S]*?)<\/link>/i) ||
        itemXml.match(/<guid[^>]*isPermaLink="true"[^>]*>([\s\S]*?)<\/guid>/i);
      const descMatch =
        itemXml.match(/<description(?:\s+[^>]*)?>([\s\S]*?)<\/description>/i) ||
        itemXml.match(/<content:encoded(?:\s+[^>]*)?>([\s\S]*?)<\/content:encoded>/i);
      const pubDateMatch = itemXml.match(/<pubDate(?:\s+[^>]*)?>([\s\S]*?)<\/pubDate>/i);
      const authorMatch =
        itemXml.match(/<dc:creator(?:\s+[^>]*)?>([\s\S]*?)<\/dc:creator>/i) ||
        itemXml.match(/<author(?:\s+[^>]*)?>([\s\S]*?)<\/author>/i);

      const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") : "";
      const rawLink = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
      const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") : "";
      const rawAuthor = authorMatch ? authorMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : defaultPublisher;

      const cleanTitle = sanitizeExternalText(rawTitle);
      const cleanDesc = sanitizeExternalText(rawDesc);
      const safeLink = sanitizeItemLink(rawLink);

      if (cleanTitle && safeLink) {
        let pubDate: Date | undefined;
        if (pubDateMatch && pubDateMatch[1]) {
          const parsed = new Date(pubDateMatch[1]);
          if (!isNaN(parsed.getTime())) pubDate = parsed;
        }

        items.push({
          title: cleanTitle,
          url: safeLink,
          authorOrPublisher: sanitizeUntrustedText(rawAuthor || defaultPublisher, 80),
          publishedAt: pubDate,
          summary: cleanDesc.slice(0, 500),
          contentHash: computeContentHash(safeLink, cleanTitle),
        });
      }
    }
    return items;
  }

  // Match Atom <entry> tags
  const atomEntryMatches = xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const entryXml of atomEntryMatches.slice(0, maxItems)) {
    const titleMatch = entryXml.match(/<title(?:\s+[^>]*)?>([\s\S]*?)<\/title>/i);
    const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
    const summaryMatch =
      entryXml.match(/<summary(?:\s+[^>]*)?>([\s\S]*?)<\/summary>/i) ||
      entryXml.match(/<content(?:\s+[^>]*)?>([\s\S]*?)<\/content>/i);
    const updatedMatch =
      entryXml.match(/<updated(?:\s+[^>]*)?>([\s\S]*?)<\/updated>/i) ||
      entryXml.match(/<published(?:\s+[^>]*)?>([\s\S]*?)<\/published>/i);
    const authorMatch = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/i);

    const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") : "";
    const rawLink = linkMatch ? linkMatch[1] : "";
    const rawDesc = summaryMatch ? summaryMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") : "";
    const cleanTitle = sanitizeExternalText(rawTitle);
    const cleanDesc = sanitizeExternalText(rawDesc);
    const safeLink = sanitizeItemLink(rawLink);
    const author = authorMatch ? sanitizeUntrustedText(authorMatch[1], 80) : defaultPublisher;

    if (cleanTitle && safeLink) {
      let pubDate: Date | undefined;
      if (updatedMatch && updatedMatch[1]) {
        const parsed = new Date(updatedMatch[1]);
        if (!isNaN(parsed.getTime())) pubDate = parsed;
      }

      items.push({
        title: cleanTitle,
        url: safeLink,
        authorOrPublisher: author,
        publishedAt: pubDate,
        summary: cleanDesc.slice(0, 500),
        contentHash: computeContentHash(safeLink, cleanTitle),
      });
    }
  }

  return items;
}

/**
 * Validates that an incoming Content-Type header corresponds to legitimate RSS, Atom, or XML.
 */
export function validateFeedContentType(contentType: string, initialBodyChunk?: string): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();

  // Explicitly reject HTML pages (e.g. login pages, Cloudflare challenge, 404 HTML)
  if (ct.includes("text/html") || ct.includes("application/xhtml+xml")) {
    return false;
  }

  // Reject binary or media content
  if (
    ct.startsWith("image/") ||
    ct.startsWith("audio/") ||
    ct.startsWith("video/") ||
    ct.includes("application/pdf") ||
    ct.includes("application/zip") ||
    ct.includes("application/json")
  ) {
    return false;
  }

  // Standard XML / Feed types
  if (
    ct.includes("application/rss+xml") ||
    ct.includes("application/atom+xml") ||
    ct.includes("application/xml") ||
    ct.includes("text/xml") ||
    ct.includes("application/rdf+xml")
  ) {
    return true;
  }

  // Permissive fallback for publishers serving XML as text/plain or octet-stream
  if (ct.includes("text/plain") || ct.includes("application/octet-stream")) {
    if (initialBodyChunk) {
      const trimmed = initialBodyChunk.trim().toLowerCase();
      return (
        trimmed.startsWith("<?xml") ||
        trimmed.startsWith("<rss") ||
        trimmed.startsWith("<feed") ||
        trimmed.startsWith("<rdf:rdf")
      );
    }
    return true;
  }

  return false;
}

export interface SingleFetchHopResult {
  isRedirect: boolean;
  redirectLocation?: string;
  bodyText?: string;
}

/**
 * Executes a single HTTPS request using connection-time DNS pinning.
 * Preserves TLS SNI hostname check and CA validation while strictly routing socket
 * traffic to the pre-validated pinned IP address.
 */
export async function executePinnedHttpsRequest(
  dest: PinnedDestination,
  remainingTimeoutMs: number,
  maxBytes: number,
  options?: { ca?: string | Buffer | Array<string | Buffer> }
): Promise<SingleFetchHopResult> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    let finished = false;

    const cleanup = () => {
      finished = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const req = https.request(
      {
        host: dest.hostname,
        port: dest.port,
        path: `${dest.pathname}${dest.search}`,
        method: "GET",
        ca: options?.ca || dest.ca,
        // Connection-time DNS Pinning: forces socket to connect to validated pinned IP
        // while preserving TLS SNI and certificate validation against dest.hostname
        lookup: (hostname, options, cb) => {
          if (options && options.all) {
            cb(null, [{ address: dest.pinnedIp!, family: dest.family! }]);
          } else {
            cb(null, dest.pinnedIp!, dest.family!);
          }
        },
        headers: {
          "User-Agent": "KnowledgeLog-EditorialStudio/1.0 (+https://knowledgelog.in)",
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, text/plain;q=0.5",
        },
      },
      (res) => {
        const statusCode = res.statusCode || 0;

        // 1. Handle Redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(statusCode)) {
          cleanup();
          res.resume(); // Discard redirect body
          const location = res.headers.location;
          if (!location) {
            return reject(new Error(`Redirect response (HTTP ${statusCode}) missing Location header.`));
          }
          return resolve({ isRedirect: true, redirectLocation: location });
        }

        // 2. Reject non-200 responses
        if (statusCode < 200 || statusCode >= 300) {
          cleanup();
          res.resume();
          return reject(new Error(`Feed server returned HTTP ${statusCode}: ${res.statusMessage || "Error"}`));
        }

        // 3. Content-Type Check
        const contentType = res.headers["content-type"] || "";
        if (!validateFeedContentType(contentType)) {
          cleanup();
          res.resume();
          return reject(
            new Error(
              `Unsupported feed Content-Type "${contentType}". Only RSS, Atom, or XML content types are supported.`
            )
          );
        }

        // 4. Content-Length Check
        const contentLength = res.headers["content-length"];
        if (contentLength && parseInt(contentLength, 10) > maxBytes) {
          cleanup();
          res.resume();
          return reject(new Error(`Feed payload exceeds maximum allowable size (${maxBytes / (1024 * 1024)}MB).`));
        }

        // 5. Stream Body with byte capping and full-response timeout active
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        res.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > maxBytes) {
            cleanup();
            res.destroy();
            req.destroy();
            return reject(
              new Error(`Feed payload exceeded maximum size limit of ${maxBytes / (1024 * 1024)}MB while streaming.`)
            );
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          cleanup();
          const buffer = Buffer.concat(chunks);
          const bodyText = buffer.toString("utf-8");

          // Second-pass Content-Type validation for text/plain feeds
          if (!validateFeedContentType(contentType, bodyText.slice(0, 300))) {
            return reject(
              new Error("Feed body does not contain valid XML or RSS/Atom declarations.")
            );
          }

          resolve({ isRedirect: false, bodyText });
        });

        res.on("error", (streamErr) => {
          cleanup();
          reject(streamErr);
        });
      }
    );

    // Enforce full-response timeout across connection AND body consumption
    timer = setTimeout(() => {
      if (!finished) {
        cleanup();
        req.destroy(new Error(`Request timed out after ${remainingTimeoutMs}ms during full body transfer.`));
      }
    }, remainingTimeoutMs);

    req.on("error", (reqErr) => {
      cleanup();
      reject(reqErr);
    });

    req.end();
  });
}

/**
 * Safely fetches an external feed with:
 * 1. Connection-time DNS pinning (defeats DNS rebinding TOCTOU).
 * 2. TLS SNI preservation and certificate validation.
 * 3. Enforced manual redirect loop (max 3 hops), re-validating every redirect destination.
 * 4. Full-response timeout active over the entire fetch and streaming transfer.
 * 5. Strict 2MB stream byte limit.
 * 6. Explicit RSS/Atom Content-Type enforcement.
 */
export async function fetchFeedSafely(initialUrl: string): Promise<string> {
  let currentUrl = initialUrl;
  const maxRedirects = 3;
  const visited = new Set<string>();
  const MAX_BYTES = 2 * 1024 * 1024; // 2MB
  const OVERALL_TIMEOUT_MS = 10000; // 10s strict total budget
  const startTime = Date.now();

  for (let hop = 0; hop <= maxRedirects; hop++) {
    visited.add(currentUrl);

    const elapsed = Date.now() - startTime;
    const remainingMs = OVERALL_TIMEOUT_MS - elapsed;
    if (remainingMs <= 100) {
      throw new Error(`Overall fetch operation timed out after ${OVERALL_TIMEOUT_MS}ms.`);
    }

    // Step 1: DNS resolution and IP security check
    const pinResult = await resolveAndPinSafeIp(currentUrl);
    if (!pinResult.valid) {
      throw new Error(`SSRF guard blocked destination "${currentUrl}": ${pinResult.error}`);
    }

    // Step 2: Connection-time pinned HTTPS request
    const hopResult = await executePinnedHttpsRequest(pinResult, remainingMs, MAX_BYTES);

    if (hopResult.isRedirect) {
      if (hop === maxRedirects) {
        throw new Error(`Exceeded maximum allowable redirects (${maxRedirects}).`);
      }
      const nextUrl = new URL(hopResult.redirectLocation!, currentUrl).toString();
      if (visited.has(nextUrl)) {
        throw new Error(`Redirect loop detected: "${nextUrl}" was already visited.`);
      }
      currentUrl = nextUrl;
      continue;
    }

    if (hopResult.bodyText !== undefined) {
      return hopResult.bodyText;
    }
  }

  throw new Error("Failed to fetch feed after resolving redirects.");
}

/**
 * Fetches and ingests a single approved research source feed with SSRF and size safeguards.
 */
export async function syncResearchSource(
  sourceId: string,
  options: { dailyFetchLimit?: number } = {},
): Promise<{
  sourceName: string;
  fetchedCount: number;
  newItemsCount: number;
  error?: string;
  quotaReached?: boolean;
  quotaCurrent?: number;
}> {
  await dbConnect();

  const lockId = randomUUID();
  const now = new Date();
  const source = await AIResearchSource.findOneAndUpdate(
    {
      _id: sourceId,
      active: true,
      approvalStatus: "approved",
      $or: [
        { fetchLockUntil: { $exists: false } },
        { fetchLockUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        fetchLockId: lockId,
        fetchLockUntil: new Date(now.getTime() + 15 * 60 * 1000),
      },
    },
    { returnDocument: "after" },
  );
  if (!source) {
    const existing = await AIResearchSource.findById(sourceId).select("name active approvalStatus");
    if (!existing) throw new Error("Research source not found");
    return {
      sourceName: existing.name,
      fetchedCount: 0,
      newItemsCount: 0,
      error: "Research source is inactive, unapproved, or already being synchronized.",
    };
  }

  let leaseOwned = true;
  let heartbeatInFlight = false;
  const heartbeat = setInterval(async () => {
    if (heartbeatInFlight || !leaseOwned) return;
    heartbeatInFlight = true;
    try {
      const renewed = await AIResearchSource.findOneAndUpdate(
        { _id: source._id, fetchLockId: lockId },
        { $set: { fetchLockUntil: new Date(Date.now() + 15 * 60 * 1000) } },
        { returnDocument: "after", projection: { _id: 1 } },
      );
      leaseOwned = Boolean(renewed);
    } catch (error) {
      leaseOwned = false;
      console.error("Could not renew research source lease; treating fetch as expired:", error);
    } finally {
      heartbeatInFlight = false;
    }
  }, 60 * 1000);
  heartbeat.unref?.();

  try {
    if (options.dailyFetchLimit !== undefined) {
      // Quota counts a claimed sync attempt, including attempts that fail during DNS or HTTP.
      // Do not refund it: failed refunds can race and bypass the shared daily limit.
      const reservation = await reserveDailyResearchFetch(options.dailyFetchLimit);
      if (!reservation.allowed) {
        return {
          sourceName: source.name,
          fetchedCount: 0,
          newItemsCount: 0,
          error: "Daily research fetch quota reached.",
          quotaReached: true,
          quotaCurrent: reservation.current,
        };
      }
    }

    const xmlText = await fetchFeedSafely(source.url);
    if (!leaseOwned) {
      throw new Error("Research source lease was lost during fetch.");
    }
    const parsedItems = parseRssOrAtomXml(xmlText, source.publisher || source.name);

    let newCount = 0;
    for (const item of parsedItems) {
      if (!leaseOwned) {
        throw new Error("Research source lease was lost while ingesting feed items.");
      }
      const existing = await AIResearchItem.findOne({ contentHash: item.contentHash });
      if (!existing) {
        try {
          await AIResearchItem.create({
            sourceId: source._id,
            title: item.title,
            url: item.url,
            authorOrPublisher: item.authorOrPublisher,
            publishedAt: item.publishedAt,
            contentHash: item.contentHash,
            summary: item.summary,
            status: "raw",
          });
          newCount++;
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
        }
      }
    }

    if (!leaseOwned) {
      throw new Error("Research source lease was lost before fetch completion.");
    }
    const markedFetched = await AIResearchSource.updateOne(
      { _id: source._id, fetchLockId: lockId },
      {
        $set: { lastFetchedAt: new Date() },
        $unset: { lastError: 1 },
      },
    );
    if (markedFetched.matchedCount !== 1) {
      throw new Error("Research source lease was lost before recording fetch completion.");
    }

    return {
      sourceName: source.name,
      fetchedCount: parsedItems.length,
      newItemsCount: newCount,
    };
  } catch (err: any) {
    if (err instanceof QuotaStoreUnavailableError) throw err;
    console.error(`Error syncing research source ${source.name}:`, err);
    if (leaseOwned) {
      await AIResearchSource.updateOne(
        { _id: source._id, fetchLockId: lockId },
        { $set: { lastError: err.message || "Failed to fetch or parse feed" } },
      );
    }

    return {
      sourceName: source.name,
      fetchedCount: 0,
      newItemsCount: 0,
      error: err.message || "Fetch error",
    };
  } finally {
    clearInterval(heartbeat);
    try {
      await AIResearchSource.updateOne(
        { _id: source._id, fetchLockId: lockId },
        { $unset: { fetchLockId: 1, fetchLockUntil: 1 } },
      );
    } catch (releaseError) {
      console.error("Could not release research source lock; it will expire automatically:", releaseError);
    }
  }
}
