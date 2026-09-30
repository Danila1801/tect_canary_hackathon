# Start here (team page)

**Deadline: 23:00 tonight, in Builderbase.** We aim to submit at **22:30**. That leaves room for things to go wrong.

## Who does what

| Who | Owns | Files |
|---|---|---|
| Danil | Backend, security, Aikido audit | `src/canary/`, `src/app/api/`, `scripts/`, `tests/` |
| Frontend | The look of the app | `src/app/ui/CanaryApp.tsx`, `src/app/globals.css` |
| Presentation | Video, pitch, submission text | `presentation/` |

Two people editing the same file causes merge conflicts. If you need a change in someone else's files, ask them.

## Checklist until we submit

- [ ] **Aikido**: run the Code Security Audit and screenshot it (*before*). Fix the findings, mark them resolved, then screenshot again (*after*). (Danil)
- [x] **New look** (dark navy, deep green, fresh green): designed in Lovable, now live in `src/app/ui/CanaryApp.tsx`.
- [ ] **Freeze the code at 21:45.** After that, only fixes for bugs we see in the demo.
- [ ] **Record the demo video**, under 3 minutes, with `presentation/demo-script.md`. Upload it to YouTube as *Unlisted*. (Presentation)
- [ ] **Builderbase**, 4 fields:
  - description: paste from `presentation/submission.md`
  - video link
  - GitHub link: https://github.com/Danila1801/tect_canary_hackathon
  - Aikido screenshots, before and after
- [ ] Press **Submit**. After that we can't change anything, so check every link first.

## Run the app on your laptop

**Important: passwords belong to the laptop that runs the app.** If you run the app yourself, Danil's passwords
won't work on your laptop, and yours won't work on his.

**Easiest way (everyone gets the same passwords):**

```
git clone https://github.com/Danila1801/tect_canary_hackathon.git
cd tect_canary_hackathon
npm install
```

1. Danil sends you his `.env.local` file **in a private message**. It holds the AI key and the passwords.
2. Save it in the `tect_canary_hackathon` folder, named exactly `.env.local`. On Windows, check it isn't
   `.env.local.txt`.
3. Run `npm run dev` and open http://localhost:3000. Use the passwords from the `CANARY_PASSWORD_*` lines.

**Your own passwords instead:** run `npm run setup`, then `npm run dev`. That creates your own `.env.local` with new
passwords (they're in the `CANARY_PASSWORD_*` lines). It never overwrites an existing file. You still need the AI
key on the `LLM_API_KEY=` line to ask questions.

**Getting "Too many attempts"?** After 5 wrong passwords a profile is locked for 15 minutes. Stop `npm run dev`
(Ctrl+C) and start it again to reset.

**Never commit `.env.local` or paste it anywhere public.** And don't copy `.env.example` over it: that wipes the key
and all the passwords.

Sign in as:

- **Ann**, a payroll consultant. She asks questions.
- **Marc**, a content owner. He approves fixes to his own documents.
- **Sofie**, a knowledge admin. She can do everything, including a re-scan.

## How to go through the app (5 minutes)

1. **Sign in** as Ann (password from `.env.local`).
2. **Ask** tab: click the example chips one by one.
   - "Can recruiters ask current salary?" gives a *verified* answer. It ignores the outdated playbook and the
     poisoned Teams message, and warns Marc.
   - "Payroll input deadline": the sources *disagree* (3rd vs 5th working day). It goes to Koen.
   - "Cross-border social security": *unverified*, because only Jonas's chats say it.
   - "Bike allowance": *no trusted source*, so it's logged as a knowledge gap.
3. **Verify** tab: click "Load an example draft", then "Check before sending". Canary finds 2 wrong claims and 1
   disputed claim, and gives you a safe version.
4. **Handover** tab: the day-one briefing for someone taking over a portfolio. It shows what changed by law, what's
   disputed, what only lives in chats and what's solid. "Copy as checklist" copies it.
5. **Detect** tab: the legal-change banner, then the issue cards with side-by-side quotes, suggested rewrites and
   owners. As Ann, the Approve buttons are locked on other people's documents.
6. **Trust** tab: click any document to see how its score is calculated.
7. **Connect** tab: who knows what, and the live list of knowledge gaps.
8. Sign out and sign in as **Marc**: now you can approve the fix to his playbook. As **Sofie** (admin) you can
   approve anything and press "Re-scan sources" (takes about 30 seconds).

## The story in 30 seconds (everyone should be able to say this)

A client calls Ann: *"Can our recruiters still ask candidates what they earn?"* The company's own playbook says yes,
always ask. But since 7 June 2026 that's illegal under the new EU pay transparency rules. A normal AI assistant finds
the playbook and repeats the wrong answer, confidently.

Canary tells Ann the right answer and shows the exact sentence it comes from. It also shows the outdated playbook it
ignored, and why. Then it warns Marc, who owns the playbook. It does this across all documents, before anyone even
asks.

**The model finds, code decides**: the AI suggests, fixed rules check everything, and a human approves.

## Numbers we can say out loud

- Found **7 out of 7** planted problems, with **0 false alarms**, in 3 separate runs.
- **16 out of 16** test answers got the right status. None cited an outdated or poisoned source.
- **40 out of 40** facts are traced back to an exact sentence in a document.
- **22** automated tests pass.
