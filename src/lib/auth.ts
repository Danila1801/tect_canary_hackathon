import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type Role = "consultant" | "owner" | "admin";

export interface User {
  id: string;
  name: string;
  team: string;
  role: Role;
}

// Demo personas. Passwords live only in environment variables (CANARY_PASSWORD_<ID>), never in code.
export const USERS: User[] = [
  { id: "ann", name: "Ann Peeters", team: "Payroll Consultants BE (PC 200)", role: "consultant" },
  { id: "marc", name: "Marc Dubois", team: "HR Advisory BE", role: "owner" },
  { id: "sofie", name: "Sofie Claes", team: "Legal Expertise Centre BE", role: "admin" },
];

const COOKIE = "canary_session";
const TTL_SECONDS = 8 * 3600;

function secret(): Buffer {
  const s = process.env.SESSION_SECRET;
  // Fail closed: without a strong secret there are no sessions at all.
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return Buffer.from(s);
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

// Constant-time comparison of arbitrary-length strings.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(userId: string, password: string): User | null {
  const user = USERS.find((u) => u.id === userId);
  const expected = user ? process.env[`CANARY_PASSWORD_${user.id.toUpperCase()}`] : undefined;
  // Compare even for unknown users so timing does not reveal which accounts exist.
  const match = safeEqual(password, expected ?? "\u0000no-such-user");
  if (!user || !expected || expected.length < 12 || !match) return null;
  return user;
}

export function sessionCookie(user: User): string {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })).toString(
    "base64url",
  );
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL_SECONDS}${secure}`;
}

export function clearedCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function getUser(req: Request): User | null {
  const match = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)canary_session=([^;]+)/);
  if (!match) return null;
  const [payload, sig] = match[1].split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof exp !== "number" || exp < Date.now() / 1000) return null;
    return USERS.find((u) => u.id === sub) ?? null;
  } catch {
    return null;
  }
}

// CSRF defence on top of SameSite=Strict: state-changing requests must come from our own origin.
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

export function requireUser(req: Request, opts: { roles?: Role[]; mutation?: boolean } = {}): User | Response {
  if (opts.mutation && !sameOrigin(req)) return json({ error: "Cross-origin request refused" }, 403);
  const user = getUser(req);
  if (!user) return json({ error: "Not signed in" }, 401);
  if (opts.roles && !opts.roles.includes(user.role)) return json({ error: "Forbidden for your role" }, 403);
  return user;
}
