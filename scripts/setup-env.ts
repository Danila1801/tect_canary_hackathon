// Creates .env.local with a fresh session secret and one password per persona.
// Never overwrites an existing .env.local.   Usage: npm run setup
import { randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = ".env.local";
if (existsSync(target) && /^SESSION_SECRET=.+$/m.test(readFileSync(target, "utf8"))) {
  console.log(`${target} already exists and is filled in. Nothing changed.`);
  process.exit(0);
}

const password = (name: string) => `${name}-canary-${randomInt(1000, 9999)}`;
const values: Record<string, string> = {
  SESSION_SECRET: randomBytes(48).toString("base64url"),
  CANARY_PASSWORD_ANN: password("ann"),
  CANARY_PASSWORD_MARC: password("marc"),
  CANARY_PASSWORD_SOFIE: password("sofie"),
  LLM_API_KEY: process.env.LLM_API_KEY ?? "",
};

const env = readFileSync(".env.example", "utf8")
  .split("\n")
  .map((line) => {
    const key = line.split("=")[0];
    return key in values && line.startsWith(`${key}=`) ? `${key}=${values[key]}` : line;
  })
  .join("\n");
writeFileSync(target, env);
console.log(`Created ${target}. Passwords are in the CANARY_PASSWORD_* lines.`);
if (!values.LLM_API_KEY) console.log("Add the LLM key yourself: LLM_API_KEY=... (ask Danil in a private message).");
