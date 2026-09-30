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

test("checking a limit does not count; only recorded failures do", async () => {
  const { isLimited, recordHit } = await import("../src/canary/ratelimit.ts");
  const key = `fail-${Math.random()}`;
  for (let i = 0; i < 10; i++) assert.equal(isLimited(key, 3, 60_000).ok, true);
  for (let i = 0; i < 3; i++) recordHit(key, 60_000);
  const refused = isLimited(key, 3, 60_000);
  assert.equal(refused.ok, false);
  assert.ok(refused.retryAfter > 0);
});

test("a flood of distinct keys cannot grow the limiter without bound", () => {
  const prefix = `flood-${Math.random()}`;
  for (let i = 0; i < 30_000; i++) rateLimit(`${prefix}-${i}`, 1, 60_000);
  // The oldest keys were evicted, so the first one starts a fresh window again.
  assert.equal(rateLimit(`${prefix}-0`, 1, 60_000).ok, true);
  // The newest key is still tracked.
  assert.equal(rateLimit(`${prefix}-29999`, 1, 60_000).ok, false);
});
