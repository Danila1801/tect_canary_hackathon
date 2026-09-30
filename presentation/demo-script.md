# Demo video script (under 3 minutes)

## Before you record

1. Start the app (`npm run dev`) and open http://localhost:3000.
2. Sign in as **Ann Peeters**. The password is in `.env.local` (line `CANARY_PASSWORD_ANN`); Danil sends it privately.
3. Set the browser zoom to 80–90% so a whole answer fits on screen.
4. Record with **Win + Shift + R** (Snipping Tool, record a region) or **Win + Alt + R** (Game Bar, records the
   current window). On a Mac: **Cmd + Shift + 5**.
5. Upload to YouTube as **Unlisted** and paste the link in Builderbase.

Tip: record the screen first, then the voice over it. Speak slowly. 2:40 is perfect.

## The script

**0:00, Ask tab, empty. The hook.**
> "A client asks Ann: *can our recruiters still ask candidates what they earn?* The company's own playbook says:
> always ask. But since the 7th of June, that's no longer allowed. A normal AI assistant finds the playbook and
> repeats the wrong answer, confidently."

**0:20, still Ask. The idea.**
> "SD Worx already has a search assistant and a tool that tracks new laws. What's missing is the link: when the law
> changes, which of our own documents just became wrong, and who fixes them? That's Canary."

**0:30, click the example "Can recruiters ask current salary?"**
> "Verified answer: no. And here's *why* Ann can rely on it: the exact sentence from the legal update, trust 96,
> and a colleague's email that agrees. Here's what Canary *ignored*: the outdated playbook, and a Teams message where
> someone hid instructions for the AI. It never reached the model. And Marc, who owns the playbook, gets a heads-up."

**1:00, Verify tab. Click "Load an example draft", then "Check before sending".**
> "Now the moment that matters most: Ann is about to send a reply. Canary checks every claim in it. Two are wrong
> because of the new law. One is disputed, because the wiki says the 3rd working day and the help centre says the
> 5th, so Ann should ask Koen. One is fine. And here's a safe version she can send instead."

**1:35, Detect tab.**
> "This is the view for the people who own the documents. One legal change: five wrong statements in three
> documents, each with a suggested rewrite and an owner. Here's the deadline conflict, with a ticket that proves it
> already delayed overtime pay for 37 employees."

**1:55, point at the locked Approve button on Marc's playbook card (you are still Ann).**
> "Ann can't approve Marc's document: the button is locked, and the server enforces the same rule. The owner
> decides, not the AI."

**2:05, scroll to an "Only in chats" card.**
> "Cross-border payroll only lives in three chats by Jonas. Canary drafts the article from his own words. Jonas only
> has to approve it."

**2:15, Trust tab. Click one document.**
> "Every trust score is a formula you can read: how official, how old, who owns it, conflicts, legal changes."

**2:30, back to Ask. The close.**
> "The AI finds, the code decides. In our tests: 7 out of 7 problems found, zero false alarms, every fact traced to
> an exact sentence. Next step: plug Canary in between Legal Watch and the assistant SD Worx already has. From
> *I found something* to *I know I can send this*."
