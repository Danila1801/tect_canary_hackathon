# Builderbase description (copy and paste)

Canary: knowledge that knows when it's wrong.

A client asks: "Can our recruiters still ask candidates what they earn?" The company's own playbook says yes. Since
the EU Pay Transparency Directive (deadline 7 June 2026), that's no longer allowed. A normal AI assistant finds the
playbook and repeats the wrong answer, confidently.

ORIGINALITY
SD Worx already has Find (an assistant over 100,000+ internal documents) and Legal Watch (external law changes).
Canary is the missing link: when the law changes, which of our own documents just became wrong, and who fixes them?
It also checks a consultant's reply before it reaches a client, which is the last moment a wrong answer is still
cheap to fix.

APPLICABILITY TO THE CHALLENGE (Find, Trust, Share; Trust, Capture, Detect, Connect)
- Ask: every answer is labelled verified, unverified, sources disagree or no trusted source, with the exact
  sentences behind it, what was ignored and why, and who to talk to.
- Verify: paste a draft reply. Every claim comes back wrong, disputed, unsourced or supported, with a safe version
  to send.
- Handover: a day-one briefing for a consultant taking over a portfolio. It shows what changed by law, what's
  disputed, what only lives in someone's head, and who to ask.
- Detect: statements outdated by a legal change, internal contradictions, documents with no owner or for another
  country, and knowledge that only lives in chats (turned into a draft article for the expert to approve).
- Trust: every source gets a score from a visible formula. Connect: questions the documents can't answer go to the
  right expert and are logged as knowledge gaps.

Demo (17 synthetic sources: policies, FAQs, wiki, contract template, emails, Teams threads, tickets): one real legal
change is traced through every source. It finds 5 wrong statements in 3 documents, 2 internal conflicts (one
already caused a ticket: overtime missing for 37 employees), 2 topics that only exist in one expert's chats, and 1
Teams message with a hidden prompt injection, which is quarantined before any AI reads it.

TECHNICAL ABILITY
Rule: the AI finds, the code decides. Model: Qwen3-235B-A22B-Instruct-2507 (open weights) on Nebius Token Factory.
It's about €0.002 per check; GLM-5.3-Flash timed out in our comparison. Every fact must be quoted word for word from
its source, and code re-checks every citation and every verdict. Measured with our eval script against planted
ground truth:
- Scan, 3 runs: 7/7 planted problems found, 100% precision, 0 false alarms, 40/40 facts traced to an exact sentence.
- Q&A: 16/16 answers with the right status, 0/16 citing an outdated or poisoned source.
- Verify: all 6 wrong statements caught, 14/18 verdicts correct, 0/18 bad citations.
31 automated tests. Next.js 16 + TypeScript, UI designed with Lovable, no AI SDK (plain fetch).

SECURITY
Per-user sign-in with signed, revocable sessions; roles checked on the server; only a document's owner or an admin
can approve a fix (no IDOR); CSRF origin checks; rate limits and request-size limits; prompt-injection quarantine for
sources and questions; strict security headers; no secrets in the repo. Details in SECURITY.md. Aikido standard
scan: 0 issues. The Aikido AI Code Audit has been queued since 20:19.

All documents, people and clients are synthetic. The law is real.
