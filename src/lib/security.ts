import type { Doc, SecurityFinding } from "./types.ts";

// Deterministic prompt-injection screen. Runs before any document reaches a model, so a poisoned
// source is quarantined instead of being "interpreted".
const RULES: { rule: string; re: RegExp }[] = [
  { rule: "override-instructions", re: /ignore (all )?(the )?(previous|prior|above) instructions/i },
  { rule: "role-hijack", re: /\byou are now\b|\badmin mode\b|\bdeveloper mode\b/i },
  { rule: "fake-system-prompt", re: /(^|[\s<!-])system\s*:/im },
  { rule: "trust-manipulation", re: /(highest|maximum) trust|official legal source/i },
  { rule: "hidden-html-comment", re: /<!--[\s\S]*?-->/ },
  { rule: "zero-width-characters", re: /[​-‏‪-‮⁠-⁤]/ },
];

export function scanDoc(doc: Doc): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  for (const { rule, re } of RULES) {
    const m = doc.body.match(re);
    if (!m || m.index === undefined) continue;
    const start = Math.max(0, m.index - 20);
    findings.push({ doc_id: doc.id, rule, excerpt: doc.body.slice(start, m.index + m[0].length + 60).trim() });
  }
  return findings;
}

// Two independent hits means quarantine: one rule alone can be a false positive.
export function isQuarantined(findings: SecurityFinding[], docId: string): boolean {
  return findings.filter((f) => f.doc_id === docId).length >= 2;
}

// User questions are also untrusted input.
export function screenQuestion(q: string): string | null {
  for (const { rule, re } of RULES) {
    if (rule === "hidden-html-comment") continue;
    if (re.test(q)) return rule;
  }
  return null;
}
