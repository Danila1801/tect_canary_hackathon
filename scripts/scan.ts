// Offline scan: node --env-file=.env.local scripts/scan.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { scan } from "../src/lib/analyze.ts";
import { loadCorpus } from "../src/lib/corpus.ts";

const docs = loadCorpus();
console.log(`Scanning ${docs.length} documents...`);
const analysis = await scan(docs);
writeFileSync(join(process.cwd(), "data", "analysis.json"), JSON.stringify(analysis, null, 2));
// Bundled at build time, so the app never reads the filesystem at runtime.
writeFileSync(join(process.cwd(), "data", "corpus.json"), JSON.stringify(docs, null, 2));
console.log(JSON.stringify(analysis.stats, null, 2));
console.log(`Health ${analysis.health}/100`);
for (const i of analysis.issues) console.log(`- [${i.kind}] ${i.title} -> ${i.owner.name}`);
