// tools/askclaude/test/e2e.test.mjs
// End-to-end integration suite. Drives the REAL CLI subprocess interface:
//   JSON request on stdin → envelope JSON on stdout + process exit code.
//
// All tests are OFFLINE — the stub (test/stub-bin.mjs) replaces `claude`.
// Behaviour is controlled via ASKCLAUDE_STUB_* env vars; no inference, no network.
//
// Exit code contract:  0 ok  ·  1 usage  ·  2 spawn/timeout/cli  ·  3 parse

import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, readFileSync } from "node:fs";
import { CLI, STUB, spawnNode, jsonResult, tmpFile } from "./helpers.mjs";

// ---------------------------------------------------------------------------
// Internal helper — pipe a request to the CLI and parse the stdout envelope.
// ASKCLAUDE_CLAUDE_BIN defaults to the offline stub; pass ASKCLAUDE_CLAUDE_BIN
// in extraEnv to override (e.g. test 08).
// ---------------------------------------------------------------------------
async function cli(request, extraEnv = {}) {
  const stdin = typeof request === "string" ? request : JSON.stringify(request);
  const r = await spawnNode([CLI], {
    env: { ASKCLAUDE_CLAUDE_BIN: STUB, ...extraEnv },
    stdin,
  });
  let env;
  try { env = JSON.parse(r.out); } catch { env = null; }
  return { code: r.code, env, raw: r };
}

// ─── 1 ──────────────────────────────────────────────────────────────────────
// json mode, no schema: valid JSON string in result → data extracted, exit 0
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 01: json mode no-schema — extracts data from result string, exit 0", async () => {
  const { code, env } = await cli(
    { prompt: "hello" },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: '{"answer":42}' }) },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { answer: 42 });
  assert.equal(env.meta.schemaEnforced, false);
  assert.equal(env.meta.mode, "json");
});

// ─── 2 ──────────────────────────────────────────────────────────────────────
// schema mode: result is a JSON string → parsed to data, schemaEnforced true
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 02: schema mode, result is JSON string — data parsed, schemaEnforced true, exit 0", async () => {
  const { code, env } = await cli(
    { prompt: "n?", schema: { type: "object", properties: { n: { type: "number" } } } },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: '{"n":5}' }) },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { n: 5 });
  assert.equal(env.meta.schemaEnforced, true);
});

// ─── 3 ──────────────────────────────────────────────────────────────────────
// schema mode: result already an object → passed through as-is
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 03: schema mode, result already an object — passed through as data, exit 0", async () => {
  const raw = JSON.stringify({
    type: "result", subtype: "success", is_error: false, result: { x: 9 }, session_id: "s",
  });
  const { code, env } = await cli(
    { prompt: "x?", schema: { type: "object" } },
    { ASKCLAUDE_STUB_STDOUT: raw },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { x: 9 });
  assert.equal(env.meta.schemaEnforced, true);
});

// ─── 4 ──────────────────────────────────────────────────────────────────────
// json:false → text only, data undefined, exit 0
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 04: json:false — text only, data undefined, exit 0", async () => {
  const { code, env } = await cli(
    { prompt: "say hi", json: false },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "hello world" }) },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.equal(env.text, "hello world");
  assert.equal(env.data, undefined);
});

// ─── 5 ──────────────────────────────────────────────────────────────────────
// missing prompt → usage error, exit 1
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 05: missing prompt — usage error, exit 1", async () => {
  const { code, env } = await cli({});
  assert.equal(code, 1);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "usage");
});

// ─── 6 ──────────────────────────────────────────────────────────────────────
// stdin is not valid JSON → usage error, exit 1
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 06: invalid stdin JSON — usage error, exit 1", async () => {
  const { code, env } = await cli("{ not json");
  assert.equal(code, 1);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "usage");
});

// ─── 7 ──────────────────────────────────────────────────────────────────────
// stdin is valid JSON but not an object (number 123) → usage error, exit 1
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 07: stdin is valid JSON but not an object (123) — usage error, exit 1", async () => {
  const { code, env } = await cli("123");
  assert.equal(code, 1);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "usage");
});

// ─── 8 ──────────────────────────────────────────────────────────────────────
// bad ASKCLAUDE_CLAUDE_BIN (no such binary) → spawn error, exit 2
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 08: bad ASKCLAUDE_CLAUDE_BIN — spawn error, exit 2", async () => {
  const { code, env } = await cli(
    { prompt: "hi" },
    { ASKCLAUDE_CLAUDE_BIN: "definitely-not-real-xyz" },
  );
  assert.equal(code, 2);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "spawn");
});

// ─── 9 ──────────────────────────────────────────────────────────────────────
// stub delay > request timeoutMs → timeout error, exit 2
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 09: timeout (stub delay > timeoutMs) — timeout error, exit 2", async () => {
  const { code, env } = await cli(
    { prompt: "hi", timeoutMs: 300 },
    {
      ASKCLAUDE_STUB_STDOUT: jsonResult({ result: '{}' }),
      ASKCLAUDE_STUB_DELAY_MS: "3000",
    },
  );
  assert.equal(code, 2);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "timeout");
});

// ─── 10 ─────────────────────────────────────────────────────────────────────
// non-zero exit with empty stdout (stderr surfaced in raw) → cli error, exit 2
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 10: non-zero exit, empty stdout — cli error, stderr in raw, exit 2", async () => {
  const { code, env } = await cli(
    { prompt: "hi" },
    { ASKCLAUDE_STUB_STDOUT: "", ASKCLAUDE_STUB_STDERR: "boom!", ASKCLAUDE_STUB_EXIT: "1" },
  );
  assert.equal(code, 2);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "cli");
  assert.match(env.error.raw, /boom!/);
});

// ─── 11 ─────────────────────────────────────────────────────────────────────
// non-zero exit WITH a parseable success record (Task 8 guard regression) → cli, exit 2
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 11: non-zero exit with parseable output — still cli error (Task 8 guard), exit 2", async () => {
  const { code, env } = await cli(
    { prompt: "hi", json: false },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "fine" }), ASKCLAUDE_STUB_EXIT: "1" },
  );
  assert.equal(code, 2);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "cli");
});

// ─── 12 ─────────────────────────────────────────────────────────────────────
// envelope reports is_error:true → cli error, exit 2
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 12: is_error:true in record — cli error, exit 2", async () => {
  const raw = JSON.stringify({ type: "result", is_error: true, result: "model failed" });
  const { code, env } = await cli(
    { prompt: "hi" },
    { ASKCLAUDE_STUB_STDOUT: raw },
  );
  assert.equal(code, 2);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "cli");
});

// ─── 13 ─────────────────────────────────────────────────────────────────────
// parse error after repair is exhausted → parse, exit 3
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 13: unparseable result after repair exhausted — parse error, exit 3", async () => {
  const { code, env } = await cli(
    { prompt: "hi", retries: 1 },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "not json at all ever" }) },
  );
  assert.equal(code, 3);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "parse");
  assert.match(env.error.raw, /not json at all ever/);
});

// ─── 14 ─────────────────────────────────────────────────────────────────────
// SEQ_FILE: attempt 0 garbage, attempt 1 valid → retriedRepair true, exit 0
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 14: repair-then-success — retriedRepair true, correct data, exit 0", async () => {
  const seq = tmpFile("e2e-seq");
  const { code, env } = await cli(
    { prompt: "json please", retries: 1 },
    {
      ASKCLAUDE_STUB_SEQ_FILE: seq,
      ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "garbage" }),
      ASKCLAUDE_STUB_STDOUT_1: jsonResult({ result: '{"fixed":true}' }),
    },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { fixed: true });
  assert.equal(env.meta.retriedRepair, true);
});

// ─── 15 ─────────────────────────────────────────────────────────────────────
// images happy path — stream-json JSONL → ok:true, meta.mode=stream-json, exit 0
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 15: images — stream-json mode, result from JSONL, exit 0", async () => {
  const png = tmpFile("e2e-img.png");
  writeFileSync(png, Buffer.from([137, 80, 78, 71])); // 4 PNG magic bytes
  const jsonl = [
    '{"type":"system","subtype":"init"}',
    '{"type":"result","subtype":"success","is_error":false,"result":"{\\"label\\":\\"cat\\"}","session_id":"s"}',
  ].join("\n");
  const { code, env } = await cli(
    { prompt: "what is it", images: [{ path: png }] },
    { ASKCLAUDE_STUB_STDOUT: jsonl },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { label: "cat" });
  assert.equal(env.meta.mode, "stream-json");
});

// ─── 16 ─────────────────────────────────────────────────────────────────────
// unsupported image extension → usage error BEFORE spawn, exit 1
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 16: unsupported image extension — usage error before spawn, exit 1", async () => {
  const { code, env } = await cli(
    { prompt: "x", images: [{ path: "photo.bmp" }] },
    { ASKCLAUDE_STUB_STDOUT: "{}" },
  );
  assert.equal(code, 1);
  assert.equal(env.ok, false);
  assert.equal(env.error.type, "usage");
});

// ─── 17 ─────────────────────────────────────────────────────────────────────
// extraArgs forwarded verbatim — assert via ASKCLAUDE_STUB_RECORD argv
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 17: extraArgs forwarded verbatim to subprocess argv", async () => {
  const rec = tmpFile("e2e-rec17.json");
  const { code } = await cli(
    { prompt: "hi", json: false, extraArgs: ["--safe-mode", "--some-flag"] },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "ok" }), ASKCLAUDE_STUB_RECORD: rec },
  );
  assert.equal(code, 0);
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.ok(saved.argv.includes("--safe-mode"), "expected --safe-mode in argv");
  assert.ok(saved.argv.includes("--some-flag"), "expected --some-flag in argv");
});

// ─── 18 ─────────────────────────────────────────────────────────────────────
// system + model forwarded; prompt is sent on stdin (not in argv)
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 18: system-prompt and model forwarded; prompt is on stdin, not in argv", async () => {
  const rec = tmpFile("e2e-rec18.json");
  const { code } = await cli(
    { prompt: "hello", json: false, system: "be helpful", model: "claude-3-haiku" },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "ok" }), ASKCLAUDE_STUB_RECORD: rec },
  );
  assert.equal(code, 0);
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.ok(saved.argv.includes("--system-prompt"), "expected --system-prompt in argv");
  assert.ok(saved.argv.includes("--model"), "expected --model in argv");
  assert.equal(saved.stdin, "hello"); // prompt on stdin
  assert.ok(!saved.argv.includes("hello"), "prompt must NOT appear in argv");
});

// ─── 19 ─────────────────────────────────────────────────────────────────────
// EDGE: prose-wrapped JSON with a brace inside a string — tolerant extract recovers
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 19: prose-wrapped JSON with brace-in-string — tolerant extract, ok:true, exit 0", async () => {
  const result = 'Here you go: {"msg":"a } b","n":1} done';
  const { code, env } = await cli(
    { prompt: "give json" },
    { ASKCLAUDE_STUB_STDOUT: jsonResult({ result }) },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { msg: "a } b", n: 1 });
});

// ─── 20 ─────────────────────────────────────────────────────────────────────
// EDGE: stream-json with TWO terminal result events — the LAST one wins
// ─────────────────────────────────────────────────────────────────────────────
test("e2e 20: stream-json two result events — last one wins, exit 0", async () => {
  const png = tmpFile("e2e-img2.png");
  writeFileSync(png, Buffer.from([137, 80, 78, 71]));
  const jsonl = [
    '{"type":"result","subtype":"success","is_error":false,"result":"{\\"first\\":1}","session_id":"s1"}',
    '{"type":"result","subtype":"success","is_error":false,"result":"{\\"second\\":2}","session_id":"s2"}',
  ].join("\n");
  const { code, env } = await cli(
    { prompt: "describe", images: [{ path: png }] },
    { ASKCLAUDE_STUB_STDOUT: jsonl },
  );
  assert.equal(code, 0);
  assert.equal(env.ok, true);
  assert.deepEqual(env.data, { second: 2 });
});
