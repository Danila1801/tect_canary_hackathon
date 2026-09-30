import { scan } from "@/canary/analyze";
import { json, requireUser } from "@/canary/auth";
import { rateLimit } from "@/canary/ratelimit";
import { getDocs, setAnalysis } from "@/canary/store";

export const maxDuration = 120;

let running = false;

export async function POST(req: Request) {
  // A full scan makes ~30 model calls: admins only, rarely, one at a time.
  const user = requireUser(req, { roles: ["admin"], mutation: true });
  if (user instanceof Response) return user;
  if (process.env.ALLOW_LIVE_SCAN !== "true") return json({ error: "Live scans are disabled on this deployment" }, 403);

  const limit = rateLimit(`scan:${user.id}`, 3, 10 * 60_000);
  if (!limit.ok) return json({ error: "Scan limit reached" }, 429, { "Retry-After": String(limit.retryAfter) });
  if (running) return json({ error: "A scan is already running" }, 409);

  running = true;
  try {
    const analysis = await scan(getDocs());
    setAnalysis(analysis);
    return json({ stats: analysis.stats, health: analysis.health });
  } catch {
    return json({ error: "Scan failed" }, 502);
  } finally {
    running = false;
  }
}
