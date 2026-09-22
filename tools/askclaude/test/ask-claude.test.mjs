import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { askClaude } from "../askclaude.mjs";
import { STUB, withEnv, jsonResult, tmpFile } from "./helpers.mjs";

test("json + schema: returns parsed data from a result STRING", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: '{"n":42}' }) }, async () => {
    const r = await askClaude({ prompt: "n?", schema: { type: "object", properties: { n: { type: "number" } }, required: ["n"] } });
    assert.equal(r.ok, true);
    assert.deepEqual(r.data, { n: 42 });
    assert.equal(r.meta.schemaEnforced, true);
    assert.equal(r.meta.mode, "json");
    assert.equal(r.meta.sessionId, "sess");
    assert.equal(r.meta.costUsd, 0.01);
  });
});

test("json + schema: also accepts a result that is already an OBJECT", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: '{"type":"result","subtype":"success","result":{"n":7}}' }, async () => {
    const r = await askClaude({ prompt: "n?", schema: { type: "object" } });
    assert.deepEqual(r.data, { n: 7 });
  });
});

test("json without schema: extracts JSON and reports retriedRepair=false", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: '```json\n{"ok":1}\n```' }) }, async () => {
    const r = await askClaude({ prompt: "give json" });
    assert.deepEqual(r.data, { ok: 1 });
    assert.equal(r.meta.retriedRepair, false);
  });
});

test("json:false returns raw text and no data", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "just prose" }) }, async () => {
    const r = await askClaude({ prompt: "talk", json: false });
    assert.equal(r.ok, true);
    assert.equal(r.text, "just prose");
    assert.equal(r.data, undefined);
  });
});

test("hygiene flags, prompt-on-stdin, and neutral cwd are sent to claude", async () => {
  const rec = tmpFile("rec.json");
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "{}" }), ASKCLAUDE_STUB_RECORD: rec }, async () => {
    await askClaude({ prompt: "hi" });
  });
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.ok(saved.argv.includes("--no-session-persistence"));
  assert.equal(saved.stdin, "hi");
  assert.equal(realpathSync(saved.cwd), realpathSync(tmpdir()));
});

test("usage error when prompt is missing", async () => {
  const r = await askClaude({});
  assert.equal(r.ok, false);
  assert.equal(r.error.type, "usage");
});

test("spawn error when the claude binary is missing", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: "definitely-not-real-xyz" }, async () => {
    const r = await askClaude({ prompt: "hi" });
    assert.equal(r.error.type, "spawn");
  });
});

test("timeout error when claude runs too long", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "{}" }), ASKCLAUDE_STUB_DELAY_MS: "3000" }, async () => {
    const r = await askClaude({ prompt: "hi", timeoutMs: 200 });
    assert.equal(r.error.type, "timeout");
  });
});

test("cli error on a non-zero exit (stderr surfaced in raw)", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: "", ASKCLAUDE_STUB_STDERR: "boom", ASKCLAUDE_STUB_EXIT: "1" }, async () => {
    const r = await askClaude({ prompt: "hi" });
    assert.equal(r.error.type, "cli");
    assert.match(r.error.raw, /boom/);
  });
});

test("cli error when the envelope reports is_error", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: '{"type":"result","is_error":true,"result":"model failed"}' }, async () => {
    const r = await askClaude({ prompt: "hi" });
    assert.equal(r.error.type, "cli");
  });
});

test("parse error after repair is exhausted (raw carries the bad text)", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "not json at all" }) }, async () => {
    const r = await askClaude({ prompt: "hi", retries: 1 });
    assert.equal(r.error.type, "parse");
    assert.match(r.error.raw, /not json/);
  });
});

test("cli error on non-zero exit even when the output parses", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "ok" }), ASKCLAUDE_STUB_EXIT: "1" }, async () => {
    const r = await askClaude({ prompt: "hi", json: false });
    assert.equal(r.ok, false);
    assert.equal(r.error.type, "cli");
  });
});

test("repairs, then succeeds on the second attempt", async () => {
  const seq = tmpFile("seq");
  await withEnv({
    ASKCLAUDE_CLAUDE_BIN: STUB,
    ASKCLAUDE_STUB_SEQ_FILE: seq,
    ASKCLAUDE_STUB_STDOUT: jsonResult({ result: "garbage" }),      // attempt 0
    ASKCLAUDE_STUB_STDOUT_1: jsonResult({ result: '{"fixed":true}' }), // attempt 1
  }, async () => {
    const r = await askClaude({ prompt: "json please", retries: 1 });
    assert.equal(r.ok, true);
    assert.deepEqual(r.data, { fixed: true });
    assert.equal(r.meta.retriedRepair, true);
  });
});
