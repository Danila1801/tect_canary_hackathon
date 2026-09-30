<img src="public/logo.svg" alt="Canary logo" width="120">

# Canary

**Knowledge that knows when it's wrong.**

Built at the Tectonic Hackathon 2026 for the SD Worx challenge: *"How might we turn fragmented organisational
knowledge into a trusted shared resource?"*

Demo video: *link in the Builderbase submission* · Pitch material: [`presentation/`](presentation/) · Team page:
[`TEAM.md`](TEAM.md)

## The moment we fix

A client calls a payroll consultant: *"Can our recruiters still ask candidates what they earn?"*

The consultant searches. The company's own recruitment playbook says: *always ask*. But since 7 June 2026 that's
not allowed any more, because of the EU Pay Transparency Directive. The playbook was never updated. A normal AI
assistant finds it and repeats the wrong answer, confidently.

The information exists. What's missing is **knowing which answer you can trust, and why.**

SD Worx already has a search assistant over its documents, and a tool that watches the law change (Legal Watch).
Canary is the missing link between the two: **when the law changes, which of our own documents just became wrong,
and who needs to fix them?**

## What Canary does

- **Detect**: finds statements that a legal change made wrong. It also finds documents that contradict each other,
  documents with no owner, documents meant for another country, and knowledge that only lives in chats and emails.
- **Trust**: every answer gets a clear label: *verified*, *unverified*, *sources disagree* or *no trusted source*.
  It shows the exact sentences behind the answer and what it ignored, and why. Every document gets a trust score
  you can read line by line.
- **Verify**: paste the reply you're about to send to a client. Canary checks every claim in it: *supported*,
  *wrong* (a current source says otherwise), *disputed* (sources disagree, here's who to ask) or *no source*. Then it
  gives you a safe version to send instead.
- **Handover**: a consultant who takes over a portfolio gets a day-one briefing per topic: what changed by law
  (and which old guidance to drop), where sources disagree, what only lives in someone's head, and what's solid.
  With who to ask for each. No extra AI call: it's built from facts already traced to their source.
- **Capture**: when an expert has answered the same question in three different chats, Canary turns those
  answers into a draft article. The expert only has to approve it.
- **Connect**: when documents aren't enough, Canary tells you who to talk to and sends them the question with its
  context. Questions nobody can answer are logged as knowledge gaps.

## Does it work?

We planted 7 known problems in 17 synthetic documents: 3 documents made wrong by the law, 2 conflicts, 1 topic that
only lives in chats, and 1 poisoned message. We also marked 5 documents that must *never* be flagged. Then we ran
the full scan 3 times (`npm run eval`).

| run | found (recall) | correct (precision) | false alarms | facts traced to an exact sentence |
|---|---|---|---|---|
| 1 | 7/7 | 100% | 0 | 40/40 |
| 2 | 7/7 | 100% | 0 | 40/40 |
| 3 | 7/7 | 100% | 0 | 41/41 |

We also asked 8 questions twice each (16 answers):

| right status | cited the source it should | cited an outdated or poisoned source |
|---|---|---|
| 16/16 | 16/16 | 0/16 |

**Verify.** We wrote 4 synthetic draft replies with 9 factual statements between them: the salary-history ban,
the 3rd vs 5th working day cut-off, Dimona timing, the pay-information right and a bike allowance nothing covers.
Each draft went through Verify twice (18 statements):

| statements | right verdict | cited an outdated or poisoned source |
|---|---|---|
| 18 | 14/18 | 0/18 |

By verdict: contradicted 6/6, disputed 2/2, no source 2/2, supported 4/8.

- **Every wrong statement was caught**: the salary-history and "no right to pay information" claims were flagged in
  both runs, and the bike allowance nothing covers was never confirmed.
- The first run scored 12/18. Twice the model called "5th working day" *wrong* (siding with the newer wiki) where
  the sources actually disagree. A code rule now forces *disputed* whenever the cited sources are in a known
  conflict: Canary never picks a side. Four true sentences were also skipped. Now a slightly reworded statement is
  mapped back to the sentence in the draft instead of being dropped.
- The 4 remaining misses are two small true sentences ("late input goes to the next payroll", "we file the Dimona
  once the employee is in mysdworx"). They come back *no source*, because the scan never extracted those details as
  facts. They are coverage gaps that ask a human to check, not wrong answers.
- 0 outdated or poisoned citations is guaranteed by code, not by the model: Verify throws those citations away
  before it shows anything.

Honest notes:

- The very first eval run found a false conflict: it compared "25%" with "3 days" because both are numbers. We
  fixed it so numbers are only compared in the same unit. After the fix: 0 false alarms.
- AI models are not perfectly consistent. One early scan missed the "3rd vs 5th working day" conflict. A simple
  code check now catches different numbers for the same rule every time.
- This is a small synthetic dataset built to contain known problems. It shows the method works. It does not prove
  accuracy on real company data.

Setup: model `Qwen/Qwen3-235B-A22B-Instruct-2507` on Nebius Token Factory. One scan is about 33 model calls and
20–35 seconds.

## How it works

```
documents → safety check → AI pulls out facts → code checks each fact against the source text
                ↓                                           ↓
          quarantine                          compare facts per topic (AI + number check)
                                                            ↓
                          fixed rules decide: outdated by law? conflict? other country? only in chats?
                                                            ↓
                              trust scores, experts and suggested fixes → app and Q&A
```

Our one design rule: **the AI finds, the code decides.**

1. A fact only counts if its quote can be found word for word in the document.
2. Whether a disagreement means "outdated by law" or "internal conflict" is decided by clear rules: dates, document
   type and country. The AI doesn't decide it.
3. After the AI writes an answer, code checks every source it cited. Outdated, poisoned or made-up quotes are
   removed. If only chats and emails support the answer, it's labelled *unverified*.
4. When sources disagree, Canary never picks a winner. The owner of the document decides.

## How we kept it secure

The Aikido audit screenshots are in the submission. In plain words:

- **Signing in**: every person has their own password, and passwords are compared safely. Sessions are signed so
  they can't be forged, and signing out really ends the session on the server.
- **Permissions**: the server checks every request. Only the owner of a document (or an admin) can approve a fix
  to it, and changing an ID in a request doesn't get you around that. Only admins can run a new scan.
- **Attacks from other websites**: blocked by strict cookie settings and an origin check on every change.
- **Abuse**: sign-in attempts, questions and scans are rate-limited. Inputs have length limits, and errors never
  leak internal details.
- **Poisoned documents**: a message with hidden instructions for the AI ("ignore previous instructions…") is
  caught by fixed rules and quarantined *before* any AI reads it. It can never be cited. Questions are checked
  the same way.
- **Browser protection**: strict security headers (CSP, no framing, HSTS).
- **No secrets in the repo.** `.env.example` lists what you need, with empty values. The AI key only lives on the
  server.
- **Few dependencies**: only Next.js, React and Tailwind. No AI SDK, just plain `fetch`.

## Run it

You need Node 24 or newer.

```
npm install
npm run setup                # creates .env.local with a session secret and passwords; add the AI key
npm run dev                  # open http://localhost:3000
```

Useful commands:

| command | what it does |
|---|---|
| `npm run check` | type check, lint and the 22 tests |
| `npm run scan` | re-analyse all documents in `data/corpus/` |
| `npm run eval` | score the scan and the Q&A against the known answers |

On macOS or Linux, `make dev`, `make check`, `make scan` and `make eval` do the same.

Sign in as **Ann Peeters** (payroll consultant), **Marc Dubois** (content owner) or **Sofie Claes** (knowledge
admin). Any OpenAI-compatible AI endpoint works. The app starts from the saved analysis in `data/analysis.json`,
so it runs without a new scan.

## What's in this repo

```
data/corpus/        17 made-up documents: policies, FAQs, wiki, contract template, emails, Teams chats, tickets, a legal alert
data/expected.json  the known answers used to score Canary
data/analysis.json  the saved scan the app starts from
src/canary/         the engine: loading, safety check, analysis, Q&A, sign-in, rate limits
src/app/            the web app (ui/CanaryApp.tsx, design from Lovable) and its API (api/*)
scripts/            scan.ts and eval.ts
tests/              22 automated tests
presentation/       demo script, likely judge questions, submission text
TEAM.md             who does what, and the checklist until we submit
```

## What's not done yet

- The documents are files in a folder. Connecting to SharePoint, Confluence, Teams, Outlook and Zendesk is the
  next step.
- With 17 documents, every fact fits in one prompt. With 100,000 documents, facts would go into a search index
  and be compared per topic. The rules stay the same.
- Sessions, approvals and gaps are kept in memory, so a restart clears them. A real version needs a database.
- "Send with context" is simulated. In a real version it would be a Teams message or a ticket.
- Canary doesn't give legal advice. The legal alert in the demo summarises the EU directive. Country-specific
  details would come from the legal team.
- All documents, people and clients in `data/corpus/` are made up for this demo.
