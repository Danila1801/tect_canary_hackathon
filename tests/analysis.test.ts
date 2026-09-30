import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadCorpus } from "../src/canary/corpus.ts";
import type { Analysis } from "../src/canary/types.ts";

const analysis = JSON.parse(readFileSync("data/analysis.json", "utf8")) as Analysis;
const docs = loadCorpus();
const docIds = new Set(docs.map((d) => d.id));
const claimIds = new Set(analysis.claims.map((c) => c.id));

test("the corpus loads with its metadata, including the document without an owner", () => {
  assert.equal(docs.length, analysis.docs.length);
  assert.equal(docs.find((d) => d.id === "FAQ-CLIENT-DEADLINES")?.owner, "");
  assert.equal(docs.find((d) => d.id === "WIKI-NL-CUTOFF")?.country, "NL");
});

test("every issue points at real documents and claims", () => {
  for (const issue of analysis.issues) {
    for (const id of [...issue.doc_ids, ...issue.incident_doc_ids, ...(issue.captured_in ?? [])]) assert.ok(docIds.has(id), id);
    for (const id of issue.claim_ids) assert.ok(claimIds.has(id), id);
  }
});

test("claims used in issues are grounded in their source", () => {
  const byId = new Map(analysis.claims.map((c) => [c.id, c]));
  for (const issue of analysis.issues) for (const id of issue.claim_ids) assert.equal(byId.get(id)?.grounded, true, id);
});

test("the quarantined source never produced claims", () => {
  assert.equal(analysis.claims.filter((c) => c.doc_id === "TEAMS-GUEST-2026-09").length, 0);
});

test("a source for another country is never flagged against Belgian sources", () => {
  assert.ok(!analysis.issues.some((i) => i.kind === "conflict" && i.doc_ids.includes("WIKI-NL-CUTOFF")));
});

test("trust scores stay in range and outdated sources score below corroborated ones", () => {
  const score = new Map(analysis.trust.map((t) => [t.doc_id, t.score]));
  for (const t of analysis.trust) assert.ok(t.score >= 0 && t.score <= 100);
  assert.ok(score.get("PB-REC-2023")! < score.get("MAIL-2026-07-14")!);
  assert.ok(score.get("LW-2026-041")! > 90);
});
