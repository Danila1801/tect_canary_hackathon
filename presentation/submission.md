# Submission text

## Builderbase: project description (paste as-is)

**Canary: knowledge that knows when it's wrong.**

SD Worx already has Find (an assistant over 100,000+ documents) and Legal Watch (external law changes). Canary is the
missing link between them. When the law changes, it traces the change through every internal source (policies,
FAQs, wikis, contract templates, mails, Teams threads, tickets) and shows which statements just became wrong. It
also flags which sources contradict each other, which have no owner or belong to another country, and which
knowledge lives only in one expert's chats.

Every answer comes with a status (verified, unverified, sources disagree, no trusted source), the exact sentences
behind it, what was ignored and why, and the person to call when documents are not enough. Design rule: the model
finds, code decides. Every claim is traced word for word to its source, and every citation is re-checked by code
before it is shown. Security: signed sessions, owner-only approvals (no IDOR), CSRF and rate limits, and
prompt-injection quarantine.

Demo on synthetic data: one real legal trigger (the EU Pay Transparency Directive, transposition deadline 7 June
2026) finds 5 wrong statements in 3 documents across 17 sources.
