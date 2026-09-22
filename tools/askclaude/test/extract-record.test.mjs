import { test } from "node:test";
import assert from "node:assert/strict";
import { extractResultRecord } from "../askclaude.mjs";

test("json mode: the whole stdout is the record", () => {
  const rec = extractResultRecord('{"type":"result","result":"hi","session_id":"s1"}', "json");
  assert.equal(rec.result, "hi");
  assert.equal(rec.session_id, "s1");
});

test("stream-json mode: picks the terminal result event", () => {
  const jsonl = [
    '{"type":"system","subtype":"init"}',
    '{"type":"assistant","message":{}}',
    '{"type":"result","result":"done","total_cost_usd":0.02}',
  ].join("\n");
  const rec = extractResultRecord(jsonl, "stream-json");
  assert.equal(rec.result, "done");
  assert.equal(rec.total_cost_usd, 0.02);
});

test("stream-json mode: ignores non-JSON lines and throws when no result event", () => {
  assert.throws(() => extractResultRecord('garbage\n{"type":"system"}', "stream-json"), /no 'result' event/);
});

test("json mode: throws on non-JSON output", () => {
  assert.throws(() => extractResultRecord("not json", "json"));
});

test("throws on empty output", () => {
  assert.throws(() => extractResultRecord("   ", "json"), /empty output/);
});
