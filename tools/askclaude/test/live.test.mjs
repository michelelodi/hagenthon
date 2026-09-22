import { test } from "node:test";
import assert from "node:assert/strict";
import { askClaude } from "../askclaude.mjs";

const LIVE = process.env.ASKCLAUDE_LIVE === "1";

test("live: real claude returns schema-valid JSON", { skip: !LIVE }, async () => {
  const r = await askClaude({
    prompt: "Return the capital of France.",
    schema: { type: "object", properties: { capital: { type: "string" } }, required: ["capital"] },
    timeoutMs: 120000,
  });
  assert.equal(r.ok, true, JSON.stringify(r.error || {}));
  assert.equal(typeof r.data.capital, "string");
});

test("live: json:false returns raw text", { skip: !LIVE }, async () => {
  const r = await askClaude({ prompt: "Reply with the single word: ready.", json: false, timeoutMs: 120000 });
  assert.equal(r.ok, true, JSON.stringify(r.error || {}));
  assert.match(r.text.toLowerCase(), /ready/);
});
