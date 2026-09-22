import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STUB, spawnNode, tmpFile } from "./helpers.mjs";

test("stub emits canned stdout and exit code", async () => {
  const r = await spawnNode([STUB], { env: { ASKCLAUDE_STUB_STDOUT: "hello", ASKCLAUDE_STUB_EXIT: "0" } });
  assert.equal(r.out, "hello");
  assert.equal(r.code, 0);
});

test("stub records argv, stdin, and cwd", async () => {
  const rec = tmpFile("rec.json");
  await spawnNode([STUB, "--flag", "v"], { env: { ASKCLAUDE_STUB_STDOUT: "{}", ASKCLAUDE_STUB_RECORD: rec }, stdin: "PROMPT" });
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.equal(saved.stdin, "PROMPT");
  assert.deepEqual(saved.argv, ["--flag", "v"]);
  assert.equal(typeof saved.cwd, "string");
});

test("stub sequences responses via SEQ_FILE", async () => {
  const seq = tmpFile("seq");
  const env = { ASKCLAUDE_STUB_SEQ_FILE: seq, ASKCLAUDE_STUB_STDOUT: "first", ASKCLAUDE_STUB_STDOUT_1: "second" };
  const a = await spawnNode([STUB], { env });
  const b = await spawnNode([STUB], { env });
  assert.equal(a.out, "first");
  assert.equal(b.out, "second");
});
