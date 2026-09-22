import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { askClaude } from "../askclaude.mjs";
import { STUB, withEnv, tmpFile } from "./helpers.mjs";

test("image request builds a stream-json user message and parses the result event", async () => {
  const rec = tmpFile("rec.json");
  const png = tmpFile("s.png");
  writeFileSync(png, Buffer.from([9, 9, 9]));
  const jsonl = [
    '{"type":"system","subtype":"init"}',
    '{"type":"result","subtype":"success","is_error":false,"result":"{\\"label\\":\\"cat\\"}","session_id":"s"}',
  ].join("\n");
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: jsonl, ASKCLAUDE_STUB_RECORD: rec }, async () => {
    const r = await askClaude({ prompt: "what is it", images: [{ path: png }] });
    assert.equal(r.ok, true);
    assert.deepEqual(r.data, { label: "cat" });
    assert.equal(r.meta.mode, "stream-json");
  });
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.ok(saved.argv.includes("--input-format"));
  const msg = JSON.parse(saved.stdin.trim());
  assert.equal(msg.type, "user");
  assert.equal(msg.message.content[0].type, "text");
  assert.equal(msg.message.content[1].type, "image");
  assert.equal(msg.message.content[1].source.media_type, "image/png");
});

test("unsupported image extension yields a usage error before spawning", async () => {
  await withEnv({ ASKCLAUDE_CLAUDE_BIN: STUB, ASKCLAUDE_STUB_STDOUT: "{}" }, async () => {
    const r = await askClaude({ prompt: "x", images: [{ path: "a.bmp" }] });
    assert.equal(r.error.type, "usage");
  });
});
