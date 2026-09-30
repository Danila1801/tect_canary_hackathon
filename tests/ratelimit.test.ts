import assert from "node:assert/strict";
import { test } from "node:test";
import { clientKey, rateLimit } from "../src/canary/ratelimit.ts";

test("requests over the limit are refused until the window ends", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(rateLimit(key, 3, 60_000).ok, true);
  const refused = rateLimit(key, 3, 60_000);
  assert.equal(refused.ok, false);
  assert.ok(refused.retryAfter > 0);
});

test("spoofed IP headers are ignored unless a trusted proxy is configured", () => {
  delete process.env.TRUST_PROXY;
  const a = new Request("http://localhost/", { headers: { "x-real-ip": "1.1.1.1" } });
  const b = new Request("http://localhost/", { headers: { "x-real-ip": "2.2.2.2" } });
  assert.equal(clientKey(a), clientKey(b));
});
