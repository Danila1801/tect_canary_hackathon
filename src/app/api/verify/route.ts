import { json, requireUser } from "@/canary/auth";
import { clientKey, rateLimit } from "@/canary/ratelimit";
import { getAnalysis, getDocs } from "@/canary/store";
import { verify } from "@/canary/verify";

export async function POST(req: Request) {
  const user = requireUser(req, { mutation: true });
  if (user instanceof Response) return user;

  const byUser = rateLimit(`verify:${user.id}`, 10, 60_000);
  const byClient = rateLimit(`verify-ip:${clientKey(req)}`, 20, 60_000);
  if (!byUser.ok || !byClient.ok) {
    return json({ error: "Too many checks, slow down" }, 429, { "Retry-After": String(Math.max(byUser.retryAfter, byClient.retryAfter)) });
  }

  let body: { draft?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  // Keep line breaks, drop other control characters.
  const draft = typeof body.draft === "string" ? body.draft.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ").trim() : "";
  if (draft.length < 20 || draft.length > 2000) {
    return json({ error: "The draft must be between 20 and 2000 characters" }, 400);
  }

  try {
    return json(await verify(draft, getAnalysis(), getDocs()));
  } catch {
    return json({ error: "The checker is unavailable right now" }, 502);
  }
}
