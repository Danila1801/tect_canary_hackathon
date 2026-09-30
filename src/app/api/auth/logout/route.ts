import { clearedCookie, endSession, json, sameOrigin } from "@/lib/auth";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Cross-origin request refused" }, 403);
  endSession(req);
  return json({ ok: true }, 200, { "Set-Cookie": clearedCookie() });
}
