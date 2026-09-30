import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildHandover, handoverMarkdown } from "../src/canary/handover.ts";
import type { Analysis } from "../src/canary/types.ts";

const analysis = JSON.parse(readFileSync("data/analysis.json", "utf8")) as Analysis;
const items = buildHandover(analysis);
const byTopic = new Map(items.map((i) => [i.topic, i]));

test("topics changed by law come first and never show the outdated rule as current", () => {
  assert.equal(items[0].status, "changed");
  const salary = byTopic.get("recruitment.pay_history")!;
  assert.equal(salary.status, "changed");
  assert.equal(salary.rule?.doc_id, "LW-2026-041");
  assert.ok(salary.old_guidance.some((o) => o.doc_id === "PB-REC-2023"));
});

test("disputed topics show no single rule and name who decides", () => {
  const cutoff = byTopic.get("payroll.variable_input_cutoff")!;
  assert.equal(cutoff.status, "disputed");
  assert.equal(cutoff.rule, null);
  assert.ok(cutoff.ask);
  assert.ok(cutoff.incidents.some((i) => i.doc_id === "TICKET-48213"));
});

test("chat-only knowledge points to the expert, and quarantined text never appears", () => {
  assert.equal(byTopic.get("crossborder.social_security")?.status, "chat_only");
  assert.equal(byTopic.get("crossborder.social_security")?.ask?.name, "Jonas Verbeke");
  assert.ok(!handoverMarkdown(items).includes("TEAMS-GUEST-2026-09"));
});
