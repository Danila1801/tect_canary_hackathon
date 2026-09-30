import analysisJson from "../../data/analysis.json";
import corpusJson from "../../data/corpus.json";
import type { Analysis, Doc } from "./types.ts";

// In-memory state for the demo. A real deployment would put this in a database.
let current = analysisJson as unknown as Analysis;

export interface Resolution {
  issue_id: string;
  action: "approved" | "dismissed";
  by: string;
  at: string;
}

export interface Gap {
  question: string;
  topic: string;
  routed_to: string | null;
  asked_by: string;
  at: string;
}

const resolutions = new Map<string, Resolution>();
const gaps: Gap[] = [];

export function getAnalysis(): Analysis {
  return current;
}

export function setAnalysis(a: Analysis): void {
  current = a;
  resolutions.clear();
}

export function getDocs(): Doc[] {
  return corpusJson as Doc[];
}

export function getResolutions(): Resolution[] {
  return [...resolutions.values()];
}

export function resolveIssue(r: Resolution): void {
  resolutions.set(r.issue_id, r);
}

export function logGap(g: Gap): void {
  gaps.unshift(g);
  gaps.length = Math.min(gaps.length, 50);
}

export function getGaps(): Gap[] {
  return gaps;
}
