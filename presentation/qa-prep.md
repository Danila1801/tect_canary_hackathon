# Q&A prep: questions judges will likely ask

**"How is this different from a RAG chatbot / from ASKME?"**
A chatbot finds an answer. Canary tells you whether you can rely on it. It does this before anyone asks, across all
sources: which statements a legal change made wrong, which sources contradict each other, which have no owner. It
works as a layer on top of the assistant SD Worx already has, not as a replacement.

**"What if the LLM is wrong?"**
The model only proposes. Every claim must be found word for word in its source, or it is dropped (40/40 grounded
in the demo). Every citation in an answer is re-checked in code, and outdated or quarantined sources can never be
cited. A different number for the same rule is flagged by code even if the model misses it. A human approves
every fix.

**"In a conflict, who decides which source is right?"**
Never Canary. It shows both sides and marks the older one as "probably stale". It then routes the conflict to the
owner. If there is no owner, it goes to the owner of the newer source. Only the owner or a knowledge admin can
resolve it, and the server enforces that.

**"Does it scale to 100,000 documents?"**
The rules layer is already cheap and deterministic. At scale, claims go into a vector index and are compared per
topic cluster instead of all at once. Scans are incremental: a new Legal Watch alert only re-checks the topics it
touches. The demo scan: 17 sources, ~33 model calls, ~25 s, with an open model on Nebius.

**"How does it connect to Legal Watch?"**
A Legal Watch alert is just another source, of type `legal-update` with an effective date. Any internal statement
that contradicts it and was last reviewed before that date becomes "outdated by law" and goes to its owner with a
suggested rewrite.

**"What about privacy? Salary data?"**
Canary works on knowledge documents, not on payroll data. Sessions are signed and revocable, every API call checks
the role, and nothing leaves the server except the answer. The LLM endpoint is configurable, so it can run on a
European or self-hosted model.

**"Why not just ask owners to review their documents every year?"**
They do, and the 2023 playbook still said "always ask for current salary" three months after the law changed. A
yearly review can't react to a change that lands mid-year. Canary tells the one owner who needs to act, on the day
it matters.

**"What's the business value?"**
One conflicting deadline caused a ticket: overtime missed for 37 employees, and a correction run. SD Worx runs
payroll for 5M+ people with ~500 consultants in its agentic payroll model in Belgium alone. Every wrong answer that
reaches a client costs a correction and trust.

**"Security?"**
Aikido audit before and after (screenshots in the submission). Signed and revocable sessions, owner-only approvals
(no IDOR), CSRF origin checks, rate limits, strict CSP. A poisoned Teams message is quarantined before any model
reads it.

**"Is the data real?"**
No. All 17 sources are synthetic, written for the demo. The legal trigger is real: the EU Pay Transparency
Directive (2023/970) had to be transposed by 7 June 2026.
