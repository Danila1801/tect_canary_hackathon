# Security

Canary reads a company's knowledge base, asks a language model about it and lets people approve
fixes. This page says what we protect, how, what we fixed on 30 Sep 2026, and what is still open.

## Threat model

Who we defend against:

- **Anyone on the internet** who finds the URL: must not read the analysis, burn model tokens or
  knock the sign-in over.
- **A signed-in colleague** who tries to act outside their role: approve someone else's fix, run a
  scan, or impersonate another persona.
- **A malicious website** the user visits while signed in (CSRF).
- **A poisoned source document or question** that tries to steer the model (prompt injection).

## What is protected, and how

| Area | How |
|---|---|
| Authentication | Passwords only in environment variables (`CANARY_PASSWORD_<ID>`, 12+ characters), compared in constant time. Unknown users take the same code path, so timing does not reveal which accounts exist. |
| Sessions | HMAC-signed cookie (`HttpOnly`, `SameSite=Strict`, `Secure` in production, 8 h). The session id must also be in a server-side registry, so logout really ends it and a copied cookie dies with it. At most 10 live sessions per account. No `SESSION_SECRET` (32+ chars), no sessions: it fails closed. |
| Authorization | Every API route calls `requireUser` first. Roles: consultant, owner, admin. Only an admin can run a live scan (and only when `ALLOW_LIVE_SCAN=true`). |
| Owner-only approvals (IDOR) | The client sends only an issue id. The server looks up the issue, maps its owner to an account id and compares ids. Changing the id in the request gets you nothing. An owner's decision is final; only an admin can overturn it. |
| CSRF | `SameSite=Strict` plus an `Origin` = `Host` check on every state-changing request, including login and logout. |
| Rate limits | Login: wrong passwords per client, per client + account, and per account. Ask: 20/min per user. Verify: 10/min per user. Scan: 3 per 10 min, one at a time. Client IP headers are ignored unless `TRUST_PROXY=true`, so a forged header cannot dodge a limit. |
| Request size | JSON bodies are read with a hard byte cap (2 to 16 KB per route) before parsing. |
| Prompt injection | Sources and questions are screened in code (`src/canary/security.ts`). Two hits quarantine a source before any model sees it. Quarantined and outdated sources can never be cited. Every citation and quote the model returns is re-checked against the source text in code: the model finds, code decides. |
| Headers | Content-Security-Policy, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS, COOP, no `X-Powered-By`. |
| Errors | Provider errors and stack traces never reach the client. |
| Secrets | Only in `.env.local` (git-ignored) or the host's environment. `.env.example` lists every variable, empty. |

## Found and fixed on 30 Sep 2026

We audited `auth.ts`, `ratelimit.ts`, `store.ts` and every API route for business-logic flaws,
IDOR, authentication and authorization. Tests for each fix are in `tests/auth.test.ts` and
`tests/ratelimit.test.ts`.

1. **Sign-in lockout for everyone.** The login limit counted successful sign-ins, and without a
   trusted proxy all clients share one bucket. Ten sign-ins in 15 minutes, by anyone, locked the
   whole app out. Now only wrong passwords count, with a separate generous cap on all attempts.
2. **Unbounded memory from made-up user names.** Each login with a new, invented user id created a
   new limiter key. Unknown ids now share one bucket, and the limiter has a hard cap on keys.
3. **Unbounded request bodies.** `req.json()` buffers any size, including on the public login
   route. All routes now read JSON through a byte-capped reader and return 413 when it is too big.
4. **A re-scan erased owners' decisions.** Running a scan cleared every approval and dismissal, so
   an issue an owner had closed silently reopened and could be decided again, bypassing the
   "decision is final" rule. Decisions now survive a re-scan for every issue that still exists.
5. **Unbounded session registry.** Each sign-in added a session that lived for 8 hours. Now at most
   10 per account; the oldest one ends.

## Known limits

- **In-memory state.** Sessions, rate limits, approvals and the gap log live in one process. A
  restart logs everyone out and forgets decisions. Production needs a database and Redis.
- **Single instance.** With several instances, limits and sessions would not be shared.
- **Demo personas.** Three fixed accounts with shared passwords, no SSO, no MFA, no password reset.
- **Account lockout is a trade-off.** Five wrong passwords lock that account for 15 minutes from
  that client. Without `TRUST_PROXY=true` (set it on Vercel) every client counts as one.
- **Owners are matched by display name** from the source's frontmatter. Whoever controls a
  document's `owner:` field decides who may approve its fixes.
- **CSP allows inline scripts**, which Next.js needs for hydration without a nonce setup.
- **No audit history.** An admin overturning a decision replaces it; the original is not kept.
