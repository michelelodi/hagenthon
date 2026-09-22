import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson } from "../askclaude.mjs";

test("parses a clean JSON object", () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
});

test("strips ```json fences", () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
});

test("extracts an embedded object from prose", () => {
  assert.deepEqual(extractJson('Sure! Here you go: {"a":1,"b":[2,3]} — enjoy'), { a: 1, b: [2, 3] });
});

test("handles arrays", () => {
  assert.deepEqual(extractJson("[1,2,3]"), [1, 2, 3]);
});

test("does not stop at a brace inside a string", () => {
  assert.deepEqual(extractJson('{"msg":"a } b","n":1}'), { msg: "a } b", n: 1 });
});

test("throws when no JSON is present", () => {
  assert.throws(() => extractJson("just text"), /no JSON value/);
});

test("passes through an already-parsed object", () => {
  assert.deepEqual(extractJson({ a: 1 }), { a: 1 });
});
