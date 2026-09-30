# Likely judge questions, and what to say

Keep answers short. Start with the one-line answer, then give the example if they want more.

---

**"How is this different from a normal AI chatbot?"**
A chatbot finds *an* answer. Canary tells you whether you can **trust** it, and fixes the documents before anyone
asks. It sits on top of the search assistant SD Worx already has. It doesn't replace it.

**"What if the AI makes a mistake?"**
The AI only suggests. Every fact must match a sentence in the document word for word, or it's thrown away. Every
source in an answer is checked again by code. Outdated or poisoned documents can never be cited. A human approves
every fix.

**"When two documents disagree, who decides which is right?"**
Never Canary. It shows both sides and flags the older one as "probably out of date". Then it sends the conflict to
the document's owner. If there's no owner, it goes to the owner of the newer document. The server makes sure only
that person, or an admin, can close it.

**"Does it work with 100,000 documents?"**
Yes, with one change: the facts go into a search index and are compared per topic instead of all at once. The rules
stay the same. When a new law comes in, only the topics it touches are re-checked. Today one scan of 17 documents
takes about 30 seconds.

**"How does it connect to Legal Watch?"**
A Legal Watch alert is just another document, with a date from which the law applies. Any internal statement that
contradicts it, and wasn't reviewed after that date, becomes "outdated by law". It goes to its owner with a
suggested rewrite.

**"What about privacy? This is salary stuff."**
Canary reads knowledge documents, not payroll data. Every request checks who you are and what you're allowed to do.
The AI provider is configurable, so it can run on a European or self-hosted model.

**"Why not just ask owners to review their documents once a year?"**
They do. The playbook in our demo still said "always ask for their current salary" three months after the law
changed. A yearly review can't react to a law that changes mid-year. Canary warns the one person who needs to act,
on the day it matters.

**"What's the business value?"**
One wrong deadline in the demo already caused a ticket: overtime missing for 37 employees, plus a paid correction
run. SD Worx runs payroll for more than 5 million people. Every wrong answer that reaches a client costs money and
trust.

**"Is it secure?"**
Aikido audited it (screenshots in the submission). Personal logins, sessions that really end on sign-out, only
owners can approve their own documents, attack protection and rate limits. A Teams message with hidden
instructions for the AI gets quarantined before any AI reads it.

**"Is the data real?"**
No. All 17 documents are made up for the demo. The law is real: the EU Pay Transparency Directive had to be in
national law by 7 June 2026.
