import assert from "node:assert/strict";
import { test } from "node:test";

process.env.SESSION_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.CANARY_PASSWORD_ANN = "ann-test-password-123";
process.env.CANARY_PASSWORD_MARC = "marc-test-password-123";

const auth = await import("../src/canary/auth.ts");

function requestWith(cookieHeader: string, extra: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/analysis", { headers: { cookie: cookieHeader, host: "localhost:3000", ...extra } });
}

function cookieOf(setCookie: string): string {
  return setCookie.split(";")[0];
}

test("correct password signs in, wrong or unknown does not", () => {
  assert.equal(auth.checkPassword("ann", "ann-test-password-123")?.id, "ann");
  assert.equal(auth.checkPassword("ann", "marc-test-password-123"), null);
  assert.equal(auth.checkPassword("nobody", "ann-test-password-123"), null);
  assert.equal(auth.checkPassword("sofie", ""), null);
});

test("a session cookie identifies its user", () => {
  const ann = auth.checkPassword("ann", "ann-test-password-123")!;
  const cookie = cookieOf(auth.sessionCookie(ann));
  assert.equal(auth.getUser(requestWith(cookie))?.id, "ann");
});

test("a tampered cookie is rejected", () => {
  const ann = auth.checkPassword("ann", "ann-test-password-123")!;
  const [name, value] = cookieOf(auth.sessionCookie(ann)).split("=");
  const [payload, sig] = value.split(".");
  const forgedPayload = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), sub: "sofie" }),
  ).toString("base64url");
  assert.equal(auth.getUser(requestWith(`${name}=${forgedPayload}.${sig}`)), null);
});

test("logout revokes the session server-side", () => {
  const ann = auth.checkPassword("ann", "ann-test-password-123")!;
  const cookie = cookieOf(auth.sessionCookie(ann));
  auth.endSession(requestWith(cookie));
  assert.equal(auth.getUser(requestWith(cookie)), null);
});

test("role checks and cross-origin checks", () => {
  const ann = auth.checkPassword("ann", "ann-test-password-123")!;
  const cookie = cookieOf(auth.sessionCookie(ann));
  const forbidden = auth.requireUser(requestWith(cookie), { roles: ["admin"] });
  assert.ok(forbidden instanceof Response && forbidden.status === 403);
  const crossOrigin = auth.requireUser(requestWith(cookie, { origin: "https://evil.example" }), { mutation: true });
  assert.ok(crossOrigin instanceof Response && crossOrigin.status === 403);
  const ok = auth.requireUser(requestWith(cookie, { origin: "http://localhost:3000" }), { mutation: true });
  assert.ok(!(ok instanceof Response) && ok.id === "ann");
  const anonymous = auth.requireUser(requestWith(""));
  assert.ok(anonymous instanceof Response && anonymous.status === 401);
});

test("issue owners map to account ids, not display names from the client", () => {
  assert.equal(auth.userIdForOwner("Marc Dubois"), "marc");
  assert.equal(auth.userIdForOwner("Lotte Janssens"), null);
});

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/ask", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });
}

test("readJson accepts a small JSON object", async () => {
  const body = await auth.readJson(post(JSON.stringify({ question: "hello" })));
  assert.ok(!(body instanceof Response));
  assert.equal(body.question, "hello");
});

test("readJson refuses oversized bodies before buffering them", async () => {
  const big = await auth.readJson(post(JSON.stringify({ question: "x".repeat(50_000) })), 4_096);
  assert.ok(big instanceof Response && big.status === 413);
  // A lying Content-Length is refused up front.
  const declared = await auth.readJson(post("{}", { "content-length": "999999" }), 4_096);
  assert.ok(declared instanceof Response && declared.status === 413);
});

test("readJson refuses invalid JSON and non-objects", async () => {
  for (const raw of ["not json", "[1,2]", "null", "42"]) {
    const r = await auth.readJson(post(raw));
    assert.ok(r instanceof Response && r.status === 400, raw);
  }
});

test("repeated sign-ins keep at most 10 live sessions per account", () => {
  const marc = auth.checkPassword("marc", "marc-test-password-123")!;
  const cookies = Array.from({ length: 12 }, () => cookieOf(auth.sessionCookie(marc)));
  assert.equal(auth.getUser(requestWith(cookies[0])), null);
  assert.equal(auth.getUser(requestWith(cookies[1])), null);
  assert.equal(auth.getUser(requestWith(cookies[2]))?.id, "marc");
  assert.equal(auth.getUser(requestWith(cookies[11]))?.id, "marc");
});
