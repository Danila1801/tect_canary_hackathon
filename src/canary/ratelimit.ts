// Fixed-window rate limiter, in memory. Enough for a single instance; a shared store (Redis) would
// replace this in production.
const windows = new Map<string, { start: number; count: number }>();

// Hard cap so a flood of distinct keys cannot grow memory without bound.
const MAX_KEYS = 10_000;

function prune(now: number, windowMs: number): void {
  if (windows.size <= MAX_KEYS) return;
  for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
  // Still full of live windows: drop the oldest (Map keeps insertion order), in one batch so the
  // full scan runs rarely rather than on every new key.
  for (const k of windows.keys()) {
    if (windows.size <= MAX_KEYS * 0.8) break;
    windows.delete(k);
  }
}

function current(key: string, windowMs: number, now: number): { start: number; count: number } | null {
  const w = windows.get(key);
  return w && now - w.start < windowMs ? w : null;
}

// Counts this request and says whether it is allowed.
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const w = current(key, windowMs, now);
  if (!w) {
    windows.delete(key);
    windows.set(key, { start: now, count: 1 });
    prune(now, windowMs);
    return { ok: true, retryAfter: 0 };
  }
  if (w.count >= limit) return { ok: false, retryAfter: Math.ceil((w.start + windowMs - now) / 1000) };
  w.count++;
  return { ok: true, retryAfter: 0 };
}

// Checks a limit without counting. Pair with recordHit to count only failures (e.g. wrong passwords),
// so normal use never locks anyone out.
export function isLimited(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const w = current(key, windowMs, now);
  if (!w || w.count < limit) return { ok: true, retryAfter: 0 };
  return { ok: false, retryAfter: Math.ceil((w.start + windowMs - now) / 1000) };
}

export function recordHit(key: string, windowMs: number): void {
  const now = Date.now();
  const w = current(key, windowMs, now);
  if (w) {
    w.count++;
    return;
  }
  windows.delete(key);
  windows.set(key, { start: now, count: 1 });
  prune(now, windowMs);
}

export function clientKey(req: Request): string {
  // Client IP headers can be forged unless a trusted proxy (e.g. Vercel) overwrites them. Without
  // TRUST_PROXY=true every request shares one bucket, so spoofing a header cannot dodge a limit.
  if (process.env.TRUST_PROXY !== "true") return "direct";
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
}
