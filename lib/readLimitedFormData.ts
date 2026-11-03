export type LimitedFormDataResult =
  | { formData: FormData }
  | { error: "missing" | "too_large" | "invalid_multipart" };

export async function readLimitedFormData(
  request: Request,
  maxBytes: number,
): Promise<LimitedFormDataResult> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !/^multipart\/form-data\s*;/i.test(contentType)) {
    return { error: "invalid_multipart" };
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { error: "too_large" };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: "missing" };

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    byteLength += value.byteLength;
    if (byteLength > maxBytes) {
      await reader.cancel();
      return { error: "too_large" };
    }
    chunks.push(value);
  }

  try {
    const bytes = Buffer.concat(chunks, byteLength);
    const formData = await new Response(bytes, {
      headers: { "Content-Type": contentType },
    }).formData();
    return { formData };
  } catch {
    return { error: "invalid_multipart" };
  }
}
