import assert from "node:assert/strict";
import { test } from "node:test";
import { isGrounded } from "../src/canary/analyze.ts";

const body = `## Step 3: Salary benchmark
Always ask the candidate for their **current gross monthly salary** and benefits package during the first
interview.`;

test("exact quote is grounded", () => {
  assert.equal(isGrounded("Always ask the candidate for their current gross monthly salary", body), true);
});

test("line breaks, markdown and curly quotes do not break grounding", () => {
  assert.equal(isGrounded("benefits package during the first interview.", body), true);
  assert.equal(isGrounded("their current gross monthly salary and benefits package", body), true);
});

test("a fabricated quote is not grounded", () => {
  assert.equal(isGrounded("Never ask candidates about their salary history under any circumstances", body), false);
});

test("a very short quote is not accepted as evidence", () => {
  assert.equal(isGrounded("salary", body), false);
});
