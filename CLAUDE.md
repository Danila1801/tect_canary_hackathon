# CLAUDE.md

## Git

- Do not force push.
- Create a new commit. Do not amend a commit.
- Never commit `.env.local`, keys or passwords. `.env.example` lists every variable, empty.

## Conventions

- TypeScript, strict. Next.js 16 (App Router), React 19, Tailwind 4. No other runtime dependencies.
- `src/canary/` imports each other with explicit `.ts` extensions so `scripts/` and `tests/` run on
  plain Node 24 (type stripping) without a build step. Only erasable TypeScript there: no enums,
  no parameter properties.
- The model finds, code decides: anything the model returns is validated in code before it is
  shown (grounding, citations, status). Never let a model output decide a verdict on its own.
- `npm run check` (typecheck, lint, tests) must pass before a push.

## Project

Canary finds knowledge that became wrong (legal changes), contradicts itself, has no owner,
belongs to another country or lives only in chats, and routes it to the right person. LLM calls go
to an OpenAI-compatible endpoint (Nebius Token Factory by default): `LLM_BASE_URL`, `LLM_API_KEY`,
`LLM_MODEL` in `.env.local`.

- `src/canary/corpus.ts`: loads `data/corpus/*.md` (frontmatter: owner, country, authority, dates).
- `src/canary/security.ts`: prompt-injection screen for sources and questions. Two hits quarantine
  a source before any model sees it.
- `src/canary/analyze.ts`: the scan. Claim extraction, `isGrounded` quote check, per-topic
  comparison, numeric backstop, rules (outdated by law, conflict, other country, undocumented),
  trust formula, experts, suggested fixes.
- `src/canary/ask.ts`: Q&A over grounded claims. Citations are re-checked in code; outdated and
  quarantined sources can never be cited; status is downgraded when evidence is informal only.
- `src/canary/auth.ts`: personas, signed session cookies with a server-side registry, role checks,
  same-origin check. `ratelimit.ts`: fixed-window limits.
- `src/canary/store.ts`: in-memory state (analysis, resolutions, gaps), seeded from `data/*.json`.
- `src/app/api/*`: route handlers, each one calls `requireUser` first.
- `src/app/canary-app.tsx`: the whole UI (Ask, Detect, Trust, Connect). Frontend work goes here.
- `scripts/scan.ts`: rebuilds `data/analysis.json` and `data/corpus.json`.
- `scripts/eval.ts`: scores the scan and the Q&A against `data/expected.json`.
- `presentation/`: pitch script, Q&A prep, submission text.

## Team, 30 Sep 2026

- Backend (`src/canary/`, `src/app/api/`, `scripts/`, `tests/`): Danil
- Frontend (`src/app/canary-app.tsx`, `globals.css`): frontend teammate
- Pitch and video (`presentation/`): presentation teammate

@AGENTS.md
