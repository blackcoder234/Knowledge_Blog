export type LimitedRequestBodyResult =
  | { text: string }
  | { error: "missing" | "too_large" };

export async function readLimitedRequestText(
  request: Request,
  maxBytes: number,
): Promise<LimitedRequestBodyResult> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { error: "too_large" };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: "missing" };

  const decoder = new TextDecoder();
  let text = "";
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxBytes) {
      await reader.cancel();
      return { error: "too_large" };
    }
    text += decoder.decode(value, { stream: true });
  }

  return { text: text + decoder.decode() };
}
