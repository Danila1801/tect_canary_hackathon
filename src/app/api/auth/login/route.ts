import { checkPassword, json, readJson, sameOrigin, sessionCookie, USERS } from "@/canary/auth";
import { clientKey, isLimited, rateLimit, recordHit } from "@/canary/ratelimit";

const WINDOW = 15 * 60_000;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Cross-origin request refused" }, 403);

  const body = await readJson(req, 2_048);
  if (body instanceof Response) return body;
  const userId = typeof body.user === "string" ? body.user.slice(0, 32) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";

  // Brute-force protection counts wrong passwords only, so normal sign-ins never lock anyone out.
  // Unknown user ids share one bucket: made-up names cannot create unlimited limiter keys.
  const client = clientKey(req);
  const account = USERS.some((u) => u.id === userId) ? userId : "unknown";
  const keys = [
    { key: `login-fail:${client}`, limit: 20 },
    { key: `login-fail:${client}:${account}`, limit: 5 },
    { key: `login-fail-user:${account}`, limit: 50 },
  ];
  // A generous cap on all attempts bounds session creation too.
  const attempts = rateLimit(`login:${client}`, 60, WINDOW);
  const blocked = keys.map((k) => isLimited(k.key, k.limit, WINDOW)).filter((r) => !r.ok);
  if (!attempts.ok || blocked.length) {
    const retryAfter = Math.max(attempts.retryAfter, ...blocked.map((r) => r.retryAfter));
    return json({ error: "Too many attempts, try again later" }, 429, { "Retry-After": String(retryAfter) });
  }

  const user = checkPassword(userId, password);
  if (!user) {
    for (const k of keys) recordHit(k.key, WINDOW);
    return json({ error: "Wrong user or password" }, 401);
  }
  return json({ user }, 200, { "Set-Cookie": sessionCookie(user) });
}
