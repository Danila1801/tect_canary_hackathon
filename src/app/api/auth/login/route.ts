import { checkPassword, json, sameOrigin, sessionCookie } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Cross-origin request refused" }, 403);

  let body: { user?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const userId = typeof body.user === "string" ? body.user.slice(0, 32) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";

  // Brute-force protection per client and per account.
  const byClient = rateLimit(`login:${clientKey(req)}`, 10, 15 * 60_000);
  const byAccount = rateLimit(`login-user:${userId}`, 5, 15 * 60_000);
  if (!byClient.ok || !byAccount.ok) {
    return json({ error: "Too many attempts, try again later" }, 429, {
      "Retry-After": String(Math.max(byClient.retryAfter, byAccount.retryAfter)),
    });
  }

  const user = checkPassword(userId, password);
  if (!user) return json({ error: "Wrong user or password" }, 401);
  return json({ user }, 200, { "Set-Cookie": sessionCookie(user) });
}
