// tools/askclaude/examples/client.mjs
// Vanilla Node ESM demo client for askclaude.
// Shows the four main usage patterns + the if(!r.ok) error-handling guard.
//
// ─── OFFLINE (PowerShell — deterministic, no real `claude` needed) ───────────
//
//   $env:ASKCLAUDE_CLAUDE_BIN = "$PWD/tools/askclaude/test/stub-bin.mjs"
//   node tools/askclaude/examples/client.mjs
//
//   The client detects stub mode automatically and feeds each example a realistic
//   canned result, so all four examples show clean outcomes with no inference.
//
// ─── LIVE (real `claude` on PATH, network required) ──────────────────────────
//
//   node tools/askclaude/examples/client.mjs
//
//   claude must be installed and logged-in.  Set ASKCLAUDE_CLAUDE_BIN to the
//   full path if `claude` is not on PATH.

import { askClaude } from "../askclaude.mjs";

// ─── Offline-demo scaffolding ─────────────────────────────────────────────────
// When pointed at the stub (ASKCLAUDE_CLAUDE_BIN contains "stub-bin"), feed each
// example a realistic canned claude result before calling askClaude().  The stub
// reads ASKCLAUDE_STUB_STDOUT fresh on every subprocess invocation, so setting it
// here — right before each await — is sufficient.
// This block is DEMO-ONLY scaffolding: it never runs against real claude.
const OFFLINE_STUB = (process.env.ASKCLAUDE_CLAUDE_BIN || "").includes("stub-bin");
const canned = (result) =>
  JSON.stringify({ type: "result", subtype: "success", is_error: false, result, session_id: "demo", total_cost_usd: 0 });

// Pretty-print one example result.
function show(label, r) {
  if (r.ok) {
    const data = r.data !== undefined ? ` data=${JSON.stringify(r.data)}` : "";
    const text = r.text !== undefined ? ` text="${r.text}"` : "";
    console.log(`[${label}] ok ✓${data}${text}`);
  } else {
    console.log(`[${label}] ERROR  type="${r.error.type}"  message="${r.error.message}"`);
  }
}

// ─── (a) Plain text — no JSON extraction ─────────────────────────────────────
//   json:false → wrapper skips JSON parsing and just returns the raw text.
//   Use this for summarisation, translation, free-form Q&A, etc.
if (OFFLINE_STUB) process.env.ASKCLAUDE_STUB_STDOUT = canned("ready");
const a = await askClaude({
  prompt: "Reply with only the single word: ready.",
  json: false,
});
show("a plain-text", a);

// ─── (b) JSON with a schema — structured output guaranteed ───────────────────
//   Passing `schema` adds --json-schema to the claude invocation.
//   The result string is parsed into `data`; meta.schemaEnforced is true.
if (OFFLINE_STUB) process.env.ASKCLAUDE_STUB_STDOUT = canned('{"capital":"Paris"}');
const b = await askClaude({
  prompt: 'Return JSON: {"capital": "Paris"}',
  schema: {
    type: "object",
    properties: { capital: { type: "string" } },
    required: ["capital"],
  },
});
show("b json+schema", b);

// ─── (c) JSON without a schema — tolerant extraction ─────────────────────────
//   No --json-schema flag; wrapper appends a nudge and tries to extract the first
//   balanced { } / [ ] from the model output (strips fences, ignores prose).
if (OFFLINE_STUB) process.env.ASKCLAUDE_STUB_STDOUT = canned('{"answer":42}');
const c = await askClaude({
  prompt: 'Return exactly: {"answer": 42}',
});
show("c json (no schema, tolerant extract)", c);

// ─── (d) Error case — missing prompt ─────────────────────────────────────────
//   Demonstrates the if(!r.ok) guard.  askClaude validates before spawning,
//   so this returns immediately without touching the network or filesystem.
//   No stub output needed — the usage error fires before any subprocess starts.
const d = await askClaude({
  // prompt intentionally omitted to trigger a usage error
  json: false,
});
if (!d.ok) {
  show("d error-case (expected)", d);
} else {
  console.log("[d error-case] unexpected success:", d);
}

console.log("\nDone.");
