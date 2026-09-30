import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Authority, Doc } from "./types.ts";

const CORPUS_DIR = join(process.cwd(), "data", "corpus");
const AUTHORITIES: Authority[] = ["official", "team", "informal"];

export function parseDoc(raw: string): Doc {
  const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Document is missing frontmatter");
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  const authority = AUTHORITIES.includes(meta.authority as Authority) ? (meta.authority as Authority) : "informal";
  return {
    id: meta.id,
    title: meta.title,
    type: meta.type,
    authority,
    source: meta.source,
    owner: meta.owner,
    team: meta.team,
    country: meta.country,
    language: meta.language,
    last_reviewed: meta.last_reviewed,
    effective: meta.effective || undefined,
    body: match[2].trim(),
  };
}

export function loadCorpus(): Doc[] {
  return readdirSync(CORPUS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => parseDoc(readFileSync(join(CORPUS_DIR, f), "utf8")));
}
