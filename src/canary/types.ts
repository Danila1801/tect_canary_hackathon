export type Authority = "official" | "team" | "informal";

export interface Doc {
  id: string;
  title: string;
  type: string;
  authority: Authority;
  source: string;
  owner: string;
  team: string;
  country: string;
  language: string;
  last_reviewed: string;
  effective?: string;
  body: string;
}

export interface Claim {
  id: string;
  doc_id: string;
  topic: string;
  statement: string;
  value: string;
  quote: string;
  grounded: boolean;
}

export type IssueKind = "outdated_by_law" | "conflict" | "undocumented" | "quarantined";

export interface Issue {
  id: string;
  kind: IssueKind;
  severity: "high" | "medium" | "low";
  topic: string;
  title: string;
  explanation: string;
  // The claim that is (probably) wrong or unverified, and the one it clashes with.
  claim_ids: string[];
  doc_ids: string[];
  // Docs that show the issue already caused harm (tickets, complaints).
  incident_doc_ids: string[];
  owner: { name: string; team: string };
  suggested_fix?: string;
  // Informal sources (mail, chat) that already hold the right answer: knowledge stuck in an inbox.
  captured_in?: string[];
}

export interface DocTrust {
  doc_id: string;
  score: number; // 0-100
  reasons: string[];
  flags: IssueKind[];
}

export interface Expert {
  topic: string;
  name: string;
  team: string;
  contributions: number;
  doc_ids: string[];
  official: boolean;
}

export interface SecurityFinding {
  doc_id: string;
  rule: string;
  excerpt: string;
}

export interface Analysis {
  generated_at: string;
  model: string;
  docs: Omit<Doc, "body">[];
  claims: Claim[];
  issues: Issue[];
  trust: DocTrust[];
  experts: Expert[];
  security: SecurityFinding[];
  health: number;
  stats: {
    docs: number;
    claims: number;
    grounded_claims: number;
    outdated: number;
    conflicts: number;
    undocumented: number;
    quarantined: number;
    llm_calls: number;
    seconds: number;
  };
}

export type Verdict = "supported" | "contradicted" | "disputed" | "no_source";

export interface VerifyStatement {
  text: string;
  verdict: Verdict;
  topic: string;
  explanation: string;
  correction: string;
  citations: { doc_id: string; quote: string; trust: number; title: string }[];
  route: { name: string; team: string; reason: string } | null;
}

export interface VerifyResult {
  status: "checked" | "blocked";
  safe_to_send: boolean;
  statements: VerifyStatement[];
  corrected_draft: string;
  counts: Record<Verdict, number>;
}

export interface AskResult {
  status: "answered" | "unverified" | "conflict" | "no_source" | "blocked";
  answer: string;
  topic: string;
  confidence: number;
  citations: { doc_id: string; quote: string; trust: number; title: string }[];
  ignored: { doc_id: string; reason: string }[];
  escalate: { name: string; team: string; reason: string } | null;
}
