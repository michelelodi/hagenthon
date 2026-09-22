import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArgs } from "../askclaude.mjs";

const HYGIENE = ["-p", "--tools", "", "--no-session-persistence", "--permission-mode", "default"];

test("text + json (default): hygiene + output-format json + JSON nudge, no schema", () => {
  const args = buildArgs({ prompt: "hi" });
  assert.deepEqual(args.slice(0, 6), HYGIENE);
  assert.equal(args[args.indexOf("--output-format") + 1], "json");
  assert.ok(args.includes("--append-system-prompt"));
  assert.ok(!args.includes("--json-schema"));
});

test("text + schema: --json-schema carries inline JSON, and the JSON nudge is dropped", () => {
  const schema = { type: "object", properties: { n: { type: "number" } }, required: ["n"] };
  const args = buildArgs({ prompt: "hi", schema });
  assert.equal(args[args.indexOf("--json-schema") + 1], JSON.stringify(schema));
  assert.ok(!args.includes("--append-system-prompt"));
});

test("json:false: still --output-format json, no nudge", () => {
  const args = buildArgs({ prompt: "hi", json: false });
  assert.equal(args[args.indexOf("--output-format") + 1], "json");
  assert.ok(!args.includes("--append-system-prompt"));
});

test("images: stream-json in and out, with --verbose", () => {
  const args = buildArgs({ prompt: "hi", images: [{ path: "a.png" }] });
  assert.equal(args[args.indexOf("--input-format") + 1], "stream-json");
  assert.equal(args[args.indexOf("--output-format") + 1], "stream-json");
  assert.ok(args.includes("--verbose"));
});

test("system replaces; model and extraArgs are appended", () => {
  const args = buildArgs({ prompt: "hi", system: "SYS", model: "opus", extraArgs: ["--restricted"] });
  assert.equal(args[args.indexOf("--system-prompt") + 1], "SYS");
  assert.equal(args[args.indexOf("--model") + 1], "opus");
  assert.equal(args[args.length - 1], "--restricted");
});
