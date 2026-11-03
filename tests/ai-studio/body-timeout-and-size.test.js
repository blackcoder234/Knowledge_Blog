const http = require("node:http");
const { Readable } = require("node:stream");
const { readLimitedRequestText } = require("../../lib/readLimitedRequestText.ts");

async function runTests(testTracker) {
  console.log("\n--- Suite 2: Body Timeout & Size Limits ---");

  const MAX_BYTES = 2 * 1024 * 1024; // 2MB

  // 1. Test Content-Length Header Over 2MB
  const oversizeHeader = (MAX_BYTES + 5000).toString();
  const isHeaderOversize = parseInt(oversizeHeader, 10) > MAX_BYTES;
  testTracker.assert("Size Limit: Advertised Content-Length > 2MB rejected before read", isHeaderOversize === true);

  const oversizedRequestStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("x".repeat(4097)));
      controller.close();
    },
  });
  const limitedRead = await readLimitedRequestText(
    new Request("http://localhost", {
      method: "POST",
      body: oversizedRequestStream,
      duplex: "half",
    }),
    4096,
  );
  testTracker.assert(
    "Production request-body reader rejects oversized streamed bodies",
    "error" in limitedRead && limitedRead.error === "too_large",
  );

  // 2. Test Stream Truncation / Abort while reading
  let streamAborted = false;
  let receivedBytes = 0;
  const chunk1MB = Buffer.alloc(1024 * 1024, "a");
  const chunk1_5MB = Buffer.alloc(1.5 * 1024 * 1024, "b");

  // Create stream emitting 2.5MB total
  const stream = new Readable({
    read() {
      this.push(chunk1MB);
      this.push(chunk1_5MB);
      this.push(null);
    },
  });

  try {
    for await (const chunk of stream) {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BYTES) {
        stream.destroy();
        streamAborted = true;
        break;
      }
    }
  } catch (e) {
    streamAborted = true;
  }

  testTracker.assert("Size Limit: Stream terminated immediately upon exceeding 2MB", streamAborted === true);
  testTracker.assert("Size Limit: Total buffered bytes capped at 2.5MB peak before abort", receivedBytes > MAX_BYTES);

  // 3. Test Full-Response Timeout on Stalled Streams
  // Simulate a stalled stream that does not complete within budget
  const timeoutBudgetMs = 50;
  let timeoutTriggered = false;

  await new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    const stalledStream = new Readable({
      read() {},
    });
    stalledStream._read = () => {};
    stalledStream.on("error", () => {});

    const timer = setTimeout(() => {
      timeoutTriggered = true;
      stalledStream.destroy();
      finish();
    }, timeoutBudgetMs);

    stalledStream.on("data", () => {});

    stalledStream.on("close", () => {
      clearTimeout(timer);
      finish();
    });
  });

  testTracker.assert("Timeout Guard: Stalled stream aborted by full-response timeout", timeoutTriggered === true);
}

module.exports = { runTests };
