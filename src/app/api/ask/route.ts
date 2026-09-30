import { ask } from "@/canary/ask";
import { json, readJson, requireUser } from "@/canary/auth";
import { clientKey, rateLimit } from "@/canary/ratelimit";
import { getAnalysis, getDocs, logGap } from "@/canary/store";

export async function POST(req: Request) {
  const user = requireUser(req, { mutation: true });
  if (user instanceof Response) return user;

  // Every question costs model tokens: limit per user and per client.
  const byUser = rateLimit(`ask:${user.id}`, 20, 60_000);
  const byClient = rateLimit(`ask-ip:${clientKey(req)}`, 40, 60_000);
  if (!byUser.ok || !byClient.ok) {
    return json({ error: "Too many questions, slow down" }, 429, { "Retry-After": String(Math.max(byUser.retryAfter, byClient.retryAfter)) });
  }

  const body = await readJson(req, 4_096);
  if (body instanceof Response) return body;
  const question = typeof body.question === "string" ? body.question.replace(/[\u0000-\u001F\u007F]/g, " ").trim() : "";
  if (question.length < 5 || question.length > 400) {
    return json({ error: "Question must be between 5 and 400 characters" }, 400);
  }

  try {
    const result = await ask(question, getAnalysis(), getDocs());
    if (result.status === "no_source") {
      logGap({ question, topic: result.topic, routed_to: result.escalate?.name ?? null, asked_by: user.name, at: new Date().toISOString() });
    }
    return json(result);
  } catch {
    // Never leak provider errors or stack traces to the client.
    return json({ error: "The assistant is unavailable right now" }, 502);
  }
}
