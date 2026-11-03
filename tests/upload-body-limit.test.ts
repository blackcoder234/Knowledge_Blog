import assert from "node:assert/strict";
import { test } from "node:test";
import { readLimitedFormData } from "../lib/readLimitedFormData";

async function multipartRequest(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);

  const generated = new Request("https://example.test/api/upload", {
    method: "POST",
    body: formData,
  });
  const bytes = await generated.arrayBuffer();
  return {
    contentType: generated.headers.get("content-type")!,
    bytes,
  };
}

test("rejects a streamed multipart payload over limit despite a false Content-Length", async () => {
  const multipart = await multipartRequest({ file: "x".repeat(4096) });
  const request = new Request("https://example.test/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": multipart.contentType,
      "Content-Length": "1",
    },
    body: multipart.bytes,
  });

  const result = await readLimitedFormData(request, 1024);
  assert.deepEqual(result, { error: "too_large" });
});

test("parses valid multipart data within the configured total-body limit", async () => {
  const multipart = await multipartRequest({ folder: "posts", note: "image upload" });
  const request = new Request("https://example.test/api/upload", {
    method: "POST",
    headers: { "Content-Type": multipart.contentType },
    body: multipart.bytes,
  });

  const result = await readLimitedFormData(request, multipart.bytes.byteLength);
  assert.ok("formData" in result);
  assert.equal(result.formData.get("folder"), "posts");
  assert.equal(result.formData.get("note"), "image upload");
});

test("rejects non-multipart and malformed multipart requests", async () => {
  const nonMultipart = await readLimitedFormData(
    new Request("https://example.test/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    1024,
  );
  assert.deepEqual(nonMultipart, { error: "invalid_multipart" });

  const malformed = await readLimitedFormData(
    new Request("https://example.test/api/upload", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=expected" },
      body: "not a multipart payload",
    }),
    1024,
  );
  assert.deepEqual(malformed, { error: "invalid_multipart" });
});

test("cancels the request stream as soon as the cumulative limit is exceeded", async () => {
  let cancelled = false;
  const request = new Request("https://example.test/api/upload", {
    method: "POST",
    headers: { "Content-Type": "multipart/form-data; boundary=test" },
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(8));
      },
      cancel() {
        cancelled = true;
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  const result = await readLimitedFormData(request, 10);
  assert.deepEqual(result, { error: "too_large" });
  assert.equal(cancelled, true);
});
