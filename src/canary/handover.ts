import { TOPICS } from "./topics.ts";
import type { Analysis, Claim } from "./types.ts";

// A day-one briefing for a consultant who takes over a portfolio. Built only from the scan, with no
// model call: every line is a claim that was already traced to its source.

export type HandoverStatus = "changed" | "disputed" | "chat_only" | "solid";

export interface HandoverItem {
  topic: string;
  question: string;
  status: HandoverStatus;
  rule: { statement: string; quote: string; doc_id: string; title: string; trust: number } | null;
  old_guidance: { doc_id: string; title: string; quote: string }[];
  note: string;
  ask: { name: string; team: string } | null;
  incidents: { doc_id: string; title: string }[];
}

const ORDER: Record<HandoverStatus, number> = { changed: 0, disputed: 1, chat_only: 2, solid: 3 };

export function buildHandover(analysis: Analysis): HandoverItem[] {
  const docs = new Map(analysis.docs.map((d) => [d.id, d]));
  const trust = new Map(analysis.trust.map((t) => [t.doc_id, t]));
  const claims = new Map(analysis.claims.map((c) => [c.id, c]));
  const usable = (c: Claim) => {
    const doc = docs.get(c.doc_id);
    const t = trust.get(c.doc_id);
    return c.grounded && c.topic !== "other" && doc?.type !== "ticket" && !t?.flags.includes("quarantined");
  };
  // Official guidance outranks a chat, even when the chat scores higher for unrelated reasons.
  const rank = (c: Claim) => {
    const doc = docs.get(c.doc_id);
    if (doc?.type === "legal-update") return 3;
    return { official: 2, team: 1, informal: 0 }[doc?.authority ?? "informal"];
  };
  const byTopic = new Map<string, Claim[]>();
  for (const c of analysis.claims.filter(usable)) byTopic.set(c.topic, [...(byTopic.get(c.topic) ?? []), c]);

  const items: HandoverItem[] = [];
  for (const [topic, topicClaims] of byTopic) {
    const issues = analysis.issues.filter((i) => i.topic === topic);
    const lawIssues = issues.filter((i) => i.kind === "outdated_by_law");
    const conflict = issues.find((i) => i.kind === "conflict");
    const chatOnly = issues.find((i) => i.kind === "undocumented");
    const outdatedDocs = new Set(lawIssues.map((i) => i.doc_ids[0]));

    const current = topicClaims
      .filter((c) => !outdatedDocs.has(c.doc_id) && !trust.get(c.doc_id)?.flags.includes("outdated_by_law"))
      .sort((a, b) => rank(b) - rank(a) || (trust.get(b.doc_id)?.score ?? 0) - (trust.get(a.doc_id)?.score ?? 0))[0];

    const status: HandoverStatus = lawIssues.length ? "changed" : conflict ? "disputed" : chatOnly ? "chat_only" : "solid";
    const ruleDoc = current ? docs.get(current.doc_id) : undefined;
    const owner = conflict?.owner ?? chatOnly?.owner ?? (ruleDoc?.owner ? { name: ruleDoc.owner, team: ruleDoc.team } : null);

    const note = {
      changed: `A legal change made older guidance wrong. Don't follow ${[...outdatedDocs].join(", ")} until it is fixed.`,
      disputed: conflict?.explanation ?? "",
      chat_only: `Only answered in chats and mails. Confirm with ${chatOnly?.owner.name ?? "the expert"} before you advise a client.`,
      solid: "Current and consistent across sources.",
    }[status];

    items.push({
      topic,
      question: TOPICS[topic] ?? topic,
      status,
      rule:
        current && ruleDoc && status !== "disputed"
          ? { statement: current.statement, quote: current.quote, doc_id: current.doc_id, title: ruleDoc.title, trust: trust.get(current.doc_id)?.score ?? 0 }
          : null,
      old_guidance: lawIssues
        .map((i) => claims.get(i.claim_ids[0]))
        .filter((c): c is Claim => Boolean(c))
        .map((c) => ({ doc_id: c.doc_id, title: docs.get(c.doc_id)?.title ?? c.doc_id, quote: c.quote })),
      note,
      ask: owner,
      incidents: [...new Set(issues.flatMap((i) => i.incident_doc_ids))].map((id) => ({ doc_id: id, title: docs.get(id)?.title ?? id })),
    });
  }
  return items.sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.topic.localeCompare(b.topic));
}

export function handoverMarkdown(items: HandoverItem[]): string {
  const label = { changed: "CHANGED BY LAW", disputed: "DISPUTED", chat_only: "ONLY IN CHATS", solid: "SOLID" };
  return [
    "# Handover briefing (Canary)",
    "",
    ...items.flatMap((i) => [
      `- [${label[i.status]}] ${i.question}`,
      ...(i.rule ? [`  - Current rule: "${i.rule.quote}" (${i.rule.doc_id}, trust ${i.rule.trust})`] : []),
      `  - ${i.note}`,
      ...(i.ask ? [`  - Ask: ${i.ask.name}, ${i.ask.team}`] : []),
    ]),
  ].join("\n");
}
