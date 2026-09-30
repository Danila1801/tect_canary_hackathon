// Scores the scan and the Q&A against the planted ground truth in data/expected.json.
// node --env-file=.env.local scripts/eval.ts [scanRuns=3] [askRuns=2] [verifyRuns=2]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scan } from "../src/canary/analyze.ts";
import { ask } from "../src/canary/ask.ts";
import { loadCorpus } from "../src/canary/corpus.ts";
import { verify } from "../src/canary/verify.ts";
import type { Analysis, Issue, Verdict } from "../src/canary/types.ts";

interface Expected {
  findings: string[];
  never_flagged: string[];
  questions: { question: string; status: string; must_cite: string[] }[];
  verify: { name: string; draft: string; statements: { keywords: string[]; verdict: Verdict }[] }[];
}

const scanRuns = Number(process.argv[2] ?? 3);
const askRuns = Number(process.argv[3] ?? 2);
const verifyRuns = Number(process.argv[4] ?? 2);
const expected = JSON.parse(readFileSync(join("data", "expected.json"), "utf8")) as Expected;
const docs = loadCorpus();

function findingKey(issue: Issue): string {
  if (issue.kind === "conflict") return `conflict:${[...issue.doc_ids].sort().join("|")}`;
  if (issue.kind === "undocumented") return `undocumented:${issue.topic.split(".")[0]}`;
  return `${issue.kind}:${issue.doc_ids[0]}`;
}

function scoreScan(a: Analysis) {
  const predicted = new Set(a.issues.map(findingKey));
  const truth = new Set(expected.findings);
  const hits = [...predicted].filter((k) => truth.has(k));
  const falseFlags = a.issues.filter((i) => expected.never_flagged.includes(i.doc_ids[0])).length;
  return {
    precision: hits.length / Math.max(1, predicted.size),
    recall: hits.length / truth.size,
    missed: [...truth].filter((k) => !predicted.has(k)),
    extra: [...predicted].filter((k) => !truth.has(k)),
    false_flags: falseFlags,
    grounded: `${a.stats.grounded_claims}/${a.stats.claims}`,
    seconds: a.stats.seconds,
    calls: a.stats.llm_calls,
  };
}

console.log(`Scan: ${scanRuns} runs over ${docs.length} sources`);
const scans = await Promise.all(Array.from({ length: scanRuns }, () => scan(docs)));
const scanScores = scans.map(scoreScan);

const reference = JSON.parse(readFileSync(join("data", "analysis.json"), "utf8")) as Analysis;
const outdatedOrQuarantined = new Set(
  reference.trust.filter((t) => t.flags.includes("outdated_by_law") || t.flags.includes("quarantined")).map((t) => t.doc_id),
);

console.log(`Q&A: ${expected.questions.length} questions x ${askRuns} runs`);
const askResults = await Promise.all(
  expected.questions.flatMap((q) =>
    Array.from({ length: askRuns }, async () => {
      const r = await ask(q.question, reference, docs);
      const cited = r.citations.map((c) => c.doc_id);
      return {
        question: q.question,
        expected: q.status,
        got: r.status,
        status_ok: r.status === q.status,
        must_cite_ok: q.must_cite.every((id) => cited.includes(id)),
        cited_bad_source: cited.some((id) => outdatedOrQuarantined.has(id)),
      };
    }),
  ),
);

// Each expected statement is matched to a checked statement by keywords (the model picks its own sentence
// boundaries). A statement the model skipped counts as a wrong verdict.
console.log(`Verify: ${expected.verify.length} drafts x ${verifyRuns} runs`);
const verifyResults = (
  await Promise.all(
    expected.verify.flatMap((d) =>
      Array.from({ length: verifyRuns }, async () => {
        const r = await verify(d.draft, reference, docs);
        return d.statements.map((e) => {
          const match = r.statements.find((s) => e.keywords.every((k) => s.text.toLowerCase().includes(k.toLowerCase())));
          const cited = match?.citations.map((c) => c.doc_id) ?? [];
          return {
            draft: d.name,
            keywords: e.keywords,
            expected: e.verdict,
            got: match?.verdict ?? "missing",
            verdict_ok: match?.verdict === e.verdict,
            cited,
            cited_bad_source: cited.some((id) => outdatedOrQuarantined.has(id)),
          };
        });
      }),
    ),
  )
).flat();

const pct = (x: number) => `${Math.round(x * 100)}%`;
console.log("\n| run | precision | recall | false flags | grounded claims | sec | calls |");
console.log("|---|---|---|---|---|---|---|");
scanScores.forEach((s, i) =>
  console.log(`| ${i + 1} | ${pct(s.precision)} | ${pct(s.recall)} | ${s.false_flags} | ${s.grounded} | ${s.seconds} | ${s.calls} |`),
);
for (const [i, s] of scanScores.entries()) {
  if (s.missed.length || s.extra.length) console.log(`run ${i + 1}: missed ${JSON.stringify(s.missed)} extra ${JSON.stringify(s.extra)}`);
}

const statusOk = askResults.filter((r) => r.status_ok).length;
const citeOk = askResults.filter((r) => r.must_cite_ok).length;
const bad = askResults.filter((r) => r.cited_bad_source).length;
console.log(`\n| answers | right status | cited the required source | cited an outdated or quarantined source |`);
console.log("|---|---|---|---|");
console.log(`| ${askResults.length} | ${statusOk}/${askResults.length} | ${citeOk}/${askResults.length} | ${bad}/${askResults.length} |`);
for (const r of askResults.filter((x) => !x.status_ok)) console.log(`wrong status: "${r.question}" expected ${r.expected}, got ${r.got}`);

const verdictOk = verifyResults.filter((r) => r.verdict_ok).length;
const verifyBad = verifyResults.filter((r) => r.cited_bad_source).length;
console.log(`
| statements | right verdict | cited an outdated or quarantined source |`);
console.log("|---|---|---|");
console.log(`| ${verifyResults.length} | ${verdictOk}/${verifyResults.length} | ${verifyBad}/${verifyResults.length} |`);
for (const v of ["supported", "contradicted", "disputed", "no_source"] as Verdict[]) {
  const rows = verifyResults.filter((r) => r.expected === v);
  if (rows.length) console.log(`${v}: ${rows.filter((r) => r.verdict_ok).length}/${rows.length}`);
}
for (const r of verifyResults.filter((x) => !x.verdict_ok)) {
  console.log(`wrong verdict: ${r.draft} "${r.keywords.join(" ")}" expected ${r.expected}, got ${r.got}`);
}

mkdirSync("out", { recursive: true });
writeFileSync(
  join("out", "eval.json"),
  JSON.stringify({ at: new Date().toISOString(), scanScores, askResults, verifyResults }, null, 2),
);
