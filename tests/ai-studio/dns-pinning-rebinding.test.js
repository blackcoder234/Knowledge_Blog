const assert = require("node:assert");
const https = require("node:https");
const {
  isPrivateIp,
  isBlockedHostname,
  resolveAndPinSafeIp,
} = require("../../lib/ai-studio/urlValidator.ts");

async function runTests(testTracker) {
  console.log("\n--- Suite 1: DNS Pinning, Rebinding & SSRF Edge Cases ---");

  // 1. Private IPv4
  testTracker.assert("DNS: 127.0.0.1 loopback blocked", isPrivateIp("127.0.0.1") === true);
  testTracker.assert("DNS: 10.0.0.1 Class A blocked", isPrivateIp("10.0.0.1") === true);
  testTracker.assert("DNS: 172.16.0.1 Class B blocked", isPrivateIp("172.16.0.1") === true);
  testTracker.assert("DNS: 192.168.1.1 Class C blocked", isPrivateIp("192.168.1.1") === true);
  testTracker.assert("DNS: 169.254.169.254 Cloud metadata blocked", isPrivateIp("169.254.169.254") === true);
  testTracker.assert("DNS: 0.0.0.0 Current network blocked", isPrivateIp("0.0.0.0") === true);
  testTracker.assert("DNS: 100.64.0.1 carrier-grade NAT blocked", isPrivateIp("100.64.0.1") === true);
  testTracker.assert("DNS: 192.0.2.1 documentation range blocked", isPrivateIp("192.0.2.1") === true);
  testTracker.assert("DNS: 198.18.0.1 benchmarking range blocked", isPrivateIp("198.18.0.1") === true);
  testTracker.assert("DNS: 192.0.0.1 IANA special-purpose range blocked", isPrivateIp("192.0.0.1") === true);
  testTracker.assert("DNS: 192.88.99.1 deprecated relay range blocked", isPrivateIp("192.88.99.1") === true);
  testTracker.assert("DNS: 198.19.0.1 benchmarking range blocked", isPrivateIp("198.19.0.1") === true);
  testTracker.assert("DNS: 240.0.0.1 reserved range blocked", isPrivateIp("240.0.0.1") === true);
  testTracker.assert("DNS: 198.51.100.1 documentation range blocked", isPrivateIp("198.51.100.1") === true);
  testTracker.assert("DNS: 203.0.113.1 documentation range blocked", isPrivateIp("203.0.113.1") === true);
  testTracker.assert("DNS: 255.255.255.255 broadcast blocked", isPrivateIp("255.255.255.255") === true);

  // 2. IPv6 Loopback, Link-Local, Unique-Local
  testTracker.assert("DNS: ::1 IPv6 loopback blocked", isPrivateIp("::1") === true);
  testTracker.assert("DNS: fe80::1 IPv6 link-local blocked", isPrivateIp("fe80::1") === true);
  testTracker.assert("DNS: fc00::1 IPv6 unique local blocked", isPrivateIp("fc00::1") === true);
  testTracker.assert("DNS: fd12:3456:789a::1 IPv6 unique local blocked", isPrivateIp("fd12:3456:789a::1") === true);
  testTracker.assert("DNS: ff02::1 IPv6 multicast blocked", isPrivateIp("ff02::1") === true);
  testTracker.assert("DNS: 2001:db8::1 IPv6 documentation range blocked", isPrivateIp("2001:db8::1") === true);
  testTracker.assert("DNS: 2001:2::1 benchmarking range blocked", isPrivateIp("2001:2::1") === true);
  testTracker.assert("DNS: 2001:10::1 deprecated ORCHID range blocked", isPrivateIp("2001:10::1") === true);
  testTracker.assert("DNS: 2002::1 6to4 range blocked", isPrivateIp("2002::1") === true);
  testTracker.assert("DNS: 64:ff9b::a00:1 translated private IPv4 range blocked", isPrivateIp("64:ff9b::a00:1") === true);
  testTracker.assert("DNS: 2001:4860:4860::8888 public IPv6 allowed", isPrivateIp("2001:4860:4860::8888") === false);

  // 3. IPv4-Mapped IPv6
  testTracker.assert("DNS: ::ffff:127.0.0.1 Mapped loopback blocked", isPrivateIp("::ffff:127.0.0.1") === true);
  testTracker.assert("DNS: ::ffff:169.254.169.254 Mapped metadata blocked", isPrivateIp("::ffff:169.254.169.254") === true);
  testTracker.assert("DNS: ::ffff:10.0.0.5 Mapped Class A blocked", isPrivateIp("::ffff:10.0.0.5") === true);
  testTracker.assert("DNS: ::ffff:7f00:1 Mapped hex loopback blocked", isPrivateIp("::ffff:7f00:1") === true);

  // 4. Public IPs allowed
  testTracker.assert("DNS: 8.8.8.8 Public IP allowed", isPrivateIp("8.8.8.8") === false);
  testTracker.assert("DNS: 104.26.10.228 Public IP allowed", isPrivateIp("104.26.10.228") === false);

  // 5. Blocked hostnames & suffixes
  testTracker.assert("Host: localhost blocked", isBlockedHostname("localhost") === true);
  testTracker.assert("Host: metadata.google.internal blocked", isBlockedHostname("metadata.google.internal") === true);
  testTracker.assert("Host: dev.local suffix blocked", isBlockedHostname("dev.local") === true);
  testTracker.assert("Host: backend.internal suffix blocked", isBlockedHostname("backend.internal") === true);
  testTracker.assert("Host: hnrss.org public allowed", isBlockedHostname("hnrss.org") === false);

  const mixedAnswers = await resolveAndPinSafeIp("https://mixed-answer.example/feed", {
    resolver: async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "10.0.0.9", family: 4 },
    ],
  });
  testTracker.assert("DNS: Mixed public/private answers reject the entire hostname", mixedAnswers.valid === false);

  const dnsFailure = await resolveAndPinSafeIp("https://dns-failure.example/feed", {
    resolver: async () => { throw new Error("simulated DNS failure"); },
  });
  testTracker.assert("DNS: Resolver failure rejects the destination", dnsFailure.valid === false);

  const dnsTimeout = await resolveAndPinSafeIp("https://dns-timeout.example/feed", {
    resolver: () => new Promise(() => {}),
    timeoutMs: 10,
  });
  testTracker.assert("DNS: Resolver timeout rejects the destination", dnsTimeout.valid === false);

  let currentDnsAnswer = "8.8.8.8";
  let resolverCalls = 0;
  const rebindableResolver = async () => {
    resolverCalls++;
    return [{ address: currentDnsAnswer, family: 4 }];
  };
  const pinnedBeforeRebind = await resolveAndPinSafeIp("https://rebind.example/feed", {
    resolver: rebindableResolver,
  });
  currentDnsAnswer = "127.0.0.1";
  testTracker.assert(
    "DNS Rebinding: Validated destination retains its first public pinned IP",
    pinnedBeforeRebind.valid && pinnedBeforeRebind.pinnedIp === "8.8.8.8" && resolverCalls === 1,
  );
  testTracker.assert(
    "DNS Rebinding: Subsequent private answer is rejected on fresh validation",
    (await resolveAndPinSafeIp("https://rebind.example/feed", { resolver: rebindableResolver })).valid === false,
  );

  testTracker.assert("URL: non-HTTPS rejected before DNS resolution", (await resolveAndPinSafeIp("http://example.com")).valid === false);
  testTracker.assert("URL: non-standard HTTPS port rejected", (await resolveAndPinSafeIp("https://example.com:8443")).valid === false);
  testTracker.assert("URL: embedded credentials rejected", (await resolveAndPinSafeIp("https://user:pass@example.com")).valid === false);

  // 6. Local Deterministic HTTPS Server & Real Transport Verification
  // Uses fixtures/test-server.pfx (SAN: test-secure-source.local) and fixtures/test-ca.pem
  const fs = require("node:fs");
  const path = require("node:path");
  const { executePinnedHttpsRequest } = require("../../lib/ai-studio/researchFetcher");

  const serverPfx = fs.readFileSync(path.join(__dirname, "fixtures/test-server.pfx"));
  const mismatchPfx = fs.readFileSync(path.join(__dirname, "fixtures/test-mismatch.pfx"));
  const caPem = fs.readFileSync(path.join(__dirname, "fixtures/test-ca.pem"));

  // Start Deterministic Valid HTTPS Server
  const validServer = https.createServer({ pfx: serverPfx, passphrase: "testpass" }, (req, res) => {
    res.writeHead(200, { "Content-Type": "application/rss+xml" });
    res.end('<?xml version="1.0"?><rss><channel><title>Secure Test Feed</title></channel></rss>');
  });

  // Start Deterministic Mismatch HTTPS Server
  const mismatchServer = https.createServer({ pfx: mismatchPfx, passphrase: "testpass" }, (req, res) => {
    res.writeHead(200, { "Content-Type": "application/rss+xml" });
    res.end('<?xml version="1.0"?><rss><channel><title>Mismatch Feed</title></channel></rss>');
  });
  const redirectServer = https.createServer({ pfx: serverPfx, passphrase: "testpass" }, (req, res) => {
    res.writeHead(302, { Location: "https://127.0.0.1/private-feed" });
    res.end();
  });

  await new Promise((resolve) => validServer.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => mismatchServer.listen(0, "127.0.0.1", resolve));
  await new Promise((resolve) => redirectServer.listen(0, "127.0.0.1", resolve));

  const validPort = validServer.address().port;
  const mismatchPort = mismatchServer.address().port;
  const redirectPort = redirectServer.address().port;

  try {
    // A. Valid Connection using Real executePinnedHttpsRequest with Test CA
    const validDest = {
      valid: true,
      hostname: "test-secure-source.local",
      port: validPort,
      pathname: "/feed.xml",
      search: "",
      pinnedIp: "127.0.0.1",
      family: 4,
      ca: caPem,
    };

    const validHop = await executePinnedHttpsRequest(validDest, 5000, 2 * 1024 * 1024);
    testTracker.assert("DNS Pinning: Real transport routes to pinned IP (127.0.0.1)", validHop.bodyText.includes("Secure Test Feed"));
    testTracker.assert("DNS Pinning: TLS Certificate SNI matches hostname", validHop.isRedirect === false);

    // B. Mismatched Hostname Rejection (Defense Against Hostname Spoofing)
    let altnameError = null;
    try {
      const mismatchDest = {
        valid: true,
        hostname: "test-secure-source.local", // Hostname doesn't match mismatch-source.local cert
        port: mismatchPort,
        pathname: "/feed.xml",
        search: "",
        pinnedIp: "127.0.0.1",
        family: 4,
        ca: caPem,
      };
      await executePinnedHttpsRequest(mismatchDest, 5000, 2 * 1024 * 1024);
    } catch (err) {
      altnameError = err;
    }
    testTracker.assert(
      "TLS Guard: Rejects mismatched certificate (ERR_TLS_CERT_ALTNAME_INVALID)",
      altnameError && (altnameError.code === "ERR_TLS_CERT_ALTNAME_INVALID" || altnameError.message.includes("altname"))
    );

    const redirectHop = await executePinnedHttpsRequest({
      valid: true,
      hostname: "test-secure-source.local",
      port: redirectPort,
      pathname: "/redirect",
      search: "",
      pinnedIp: "127.0.0.1",
      family: 4,
      ca: caPem,
    }, 5000, 2 * 1024 * 1024);
    const redirectTarget = new URL(redirectHop.redirectLocation, "https://test-secure-source.local");
    const privateRedirect = await resolveAndPinSafeIp(redirectTarget.toString());
    testTracker.assert(
      "Redirect Guard: HTTPS redirect to a private address is rejected",
      redirectHop.isRedirect && privateRedirect.valid === false,
    );
  } finally {
    validServer.close();
    mismatchServer.close();
    redirectServer.close();
  }
}

module.exports = { runTests };
