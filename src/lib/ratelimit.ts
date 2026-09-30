// Fixed-window rate limiter, in memory. Enough for a single instance; a shared store (Redis) would
// replace this in production.
const windows = new Map<string, { start: number; count: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now - w.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    if (windows.size > 5000) {
      for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }
  if (w.count >= limit) return { ok: false, retryAfter: Math.ceil((w.start + windowMs - now) / 1000) };
  w.count++;
  return { ok: true, retryAfter: 0 };
}

export function clientKey(req: Request): string {
  // x-real-ip is set by the hosting proxy; the first x-forwarded-for hop is client-controlled.
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "local";
}
