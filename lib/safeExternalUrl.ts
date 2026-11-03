export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  const rawUrl = value.trim();
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return null;
    }
    return rawUrl;
  } catch {
    return null;
  }
}
