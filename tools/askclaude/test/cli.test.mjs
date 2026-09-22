import { test } from "node:test";
import assert from "node:assert/strict";
import { exitCodeForEnvelope } from "../askclaude.mjs";
import { CLI, STUB, spawnNode, jsonResult } from "./helpers.mjs";

function runCli(request, env) {
  const stdin = typeof request === "string" ? request : JSON.stringify(request);
  return spawnNode([CLI], { env, stdin });
}

test("exitCodeForEnvelope maps types to codes", () => {
  assert.equal(exitCodeForEnvelope({ ok: true }), 0);
  assert.equal(exitCodeForEnvelope({ ok: false, error: { type: "usage" } }), 1);
  assert.equal(exitCodeForEnvelope({ ok: false, error: { type: "timeout" } }), 2);
  assert.equal(exitCodeForEnvelope({ ok: false, error: { type: "cli" } }), 2);
  assert.equal(exitCodeForEnvelope({ ok: false, error: { type: "parse" } }), 3);
});

test("prints a success envelope on stdout and exits 0", async () => {
  const r = await runCli({ prompt: "hi", json: false }, { ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "hey" }) });
  const env = JSON.parse(r.out);
  assert.equal(env.ok, true);
  assert.equal(env.text, "hey");
  assert.equal(r.code, 0);
});

test("exits 1 with a usage envelope on invalid stdin JSON", async () => {
  const r = await runCli("{ not json", {});
  assert.equal(r.code, 1);
  assert.equal(JSON.parse(r.out).error.type, "usage");
});

test("exits 2 on a cli error and 3 on a parse error", async () => {
  const cliErr = await runCli({ prompt: "x" }, { ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_EXIT: "1", ASKCLAUDE_STUB_STDOUT: "" });
  assert.equal(cliErr.code, 2);
  const parseErr = await runCli({ prompt: "x" }, { ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "nope" }) });
  assert.equal(parseErr.code, 3);
});

test("does not truncate a large stdout envelope", async () => {
  const big = "x".repeat(200000);
  const r = await runCli({ prompt: "hi", json: false }, { ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: big }) });
  const env = JSON.parse(r.out); // throws if truncated
  assert.equal(env.ok, true);
  assert.equal(env.text, big);
  assert.equal(r.code, 0);
});
