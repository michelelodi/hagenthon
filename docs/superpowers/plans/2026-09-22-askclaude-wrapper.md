# askclaude Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a thin, idea-agnostic wrapper around the local `claude` CLI (print mode) that any language can call identically — one JSON request in, one JSON envelope out — encapsulating the fragile Windows/stdin/structured-output/image plumbing once.

**Architecture:** A single zero-dependency Node.js ESM file (`tools/askclaude/askclaude.mjs`) that is dual-use: `import { askClaude }` from JS/TS, or pipe a JSON request to it as a CLI. It spawns `claude` with hygiene flags, sends the prompt via stdin, parses the CLI envelope, and applies a JSON strategy (native `--json-schema` enforce, or tolerant extract + repair). A `stub-bin.mjs` fake `claude` (selected via `ASKCLAUDE_CLAUDE_BIN`) makes every branch testable offline.

**Tech Stack:** Node v24.14.0, built-in modules only (`node:child_process`, `node:fs`, `node:path`, `node:os`, `node:process`, `node:url`). Tests use the built-in runner (`node:test` + `node:assert/strict`). No third-party dependencies, no `npm install`.

**Spec:** `docs/specs/2026-09-22-askclaude-wrapper-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Zero dependencies.** Built-in Node modules only. No `npm install`, no `package-lock.json` with deps.
- **Node ≥ 24** (present: v24.14.0). Tests run with `node --test` (built-in runner + `node:assert/strict`).
- **Product LLM = Claude via local `claude` CLI only.** No API keys, no external AI services, no network for inference. All offline tests and the demo run through the stub bin.
- **Windows / PowerShell target.** `claude` is a native executable at `C:\Users\michele.lodi\.local\bin\claude.exe`, so spawn with `shell: false` and pass each arg as a distinct argv element (inline JSON schema needs no escaping this way).
- **Verified flag vocabulary (claude 2.1.278).** Use exactly: `-p`, `--tools ""` (empty string disables all tools), `--no-session-persistence`, `--permission-prompts none`, `--output-format json|stream-json`, `--input-format stream-json`, `--json-schema <inline JSON>`, `--system-prompt <replace>`, `--append-system-prompt <append>`, `--model`, `--verbose`. All confirmed present via `claude --help`.
- **Prompt is always sent via stdin**, never as a CLI argument (no length limit, no escaping).
- **Default request `cwd` = `os.tmpdir()`** (neutral dir → `claude` does not auto-load the project `CLAUDE.md`).
- **Envelope on stdout always** (success and error). Exit codes: `0` ok · `1` usage · `2` spawn/timeout/cli · `3` parse.
- **Location:** `tools/askclaude/` in the product tree, NOT in `.claude/` (it is a build tool, not a skill).
- **Not a git repo yet.** Task 2 optionally runs `git init`. Commit steps are optional — skip them if you prefer no VCS.

---

## File Structure

```
tools/askclaude/
  askclaude.mjs        # ESM module (askClaude + exported pure helpers) AND CLI entrypoint — same file
  package.json         # { type:module, bin, scripts.test }, zero deps
  README.md            # contract + Python / PowerShell / JS-TS snippets + env vars + exit codes
  test/
    helpers.mjs        # shared test utils: withEnv, jsonResult, spawnNode, STUB & CLI paths, tmpFile
    stub-bin.mjs       # offline fake `claude`, driven entirely by ASKCLAUDE_STUB_* env vars
    build-args.test.mjs         # buildArgs (pure)
    payload.test.mjs            # encodeImage + buildStdinPayload (pure)
    extract-record.test.mjs     # extractResultRecord (pure)
    extract-json.test.mjs       # extractJson (pure)
    run-claude.test.mjs         # runClaude spawn helper (uses stub)
    ask-claude.test.mjs         # askClaude text transport: happy + errors + repair (uses stub)
    ask-claude-images.test.mjs  # askClaude images branch (uses stub)
    cli.test.mjs                # CLI entrypoint: envelope on stdout + exit codes (spawns askclaude.mjs)
    live.test.mjs               # opt-in real smoke against real claude (ASKCLAUDE_LIVE=1)
docs/specs/
  2026-09-22-askclaude-smoke-findings.md   # Task 1 output (records the §8 answers)
```

**Responsibilities**

- `askclaude.mjs` — the whole tool. Pure helpers (`buildArgs`, `encodeImage`, `buildStdinPayload`, `extractResultRecord`, `extractJson`) are exported alongside the public `askClaude` so they can be unit-tested in isolation. The CLI entrypoint at the bottom runs only when the file is invoked directly.
- `test/helpers.mjs` — DRY test utilities imported by every test file.
- `test/stub-bin.mjs` — a fake `claude` that emits canned stdout/stderr/exit-code (and can record what it received), so all spawn/parse/error branches run offline and deterministically.

**Exported interface (built across tasks; names are fixed here so tasks agree):**

- `askClaude(request) -> Promise<envelope>` (public)
- `buildArgs(request) -> string[]`
- `encodeImage(image) -> { media_type: string, data: string }`
- `buildStdinPayload(prompt: string, encodedImages: Array<{media_type,data}>) -> string`
- `extractResultRecord(stdout: string, mode: "json"|"stream-json") -> object`
- `extractJson(text: string|object) -> any` (throws if no JSON found)
- `runClaude({ bin, args, stdin, timeoutMs, cwd }) -> Promise<{ code?, stdout?, stderr?, timedOut?, spawnError? }>`
- `exitCodeForEnvelope(envelope) -> number`
- Constants: `DEFAULT_TIMEOUT_MS = 60000`, `IMAGE_MEDIA_TYPES`

**Envelope shape (fixed):**

```json
{ "ok": true,  "data": {}, "text": "raw model text", "meta": { "mode": "json|stream-json", "schemaEnforced": false, "retriedRepair": false, "model": null, "durationMs": 0, "sessionId": null, "costUsd": null } }
{ "ok": false, "error": { "type": "usage|spawn|timeout|cli|parse", "message": "…", "raw": "…" } }
```

**Result record shape (what `claude --output-format json` emits, confirmed in Task 1):** an object with `result` (model text, or a structured object under `--json-schema`), `is_error`, `subtype`, `session_id`, `total_cost_usd`, `duration_ms`.

---

### Task 1: Smoke test — resolve the §8 runtime unknowns against real `claude`

This is the spec's "one real smoke" (§7, §10 step 1) — the **only** step that spends inference. It is investigation, not TDD: run the commands, read the output, and write down the answers. The wrapper code (later tasks) already tolerates both possible outcomes, so this task's job is to **confirm** the assumptions and flag any surprise.

**Files:**
- Create: `docs/specs/2026-09-22-askclaude-smoke-findings.md`

**Interfaces:**
- Consumes: nothing (real `claude` on PATH).
- Produces: a findings doc that Tasks 5 & 8 cite for the exact result-field name and string-vs-object shape.

- [ ] **Step 1: Confirm the plain JSON envelope field**

Run from a neutral dir so the project `CLAUDE.md` is not loaded (PowerShell):

```powershell
"Say the word ready and nothing else." | claude -p --tools "" --no-session-persistence --permission-prompts none --output-format json
```

Record in the findings doc: the top-level field holding the model's answer (expected `result`), plus the presence of `is_error`, `subtype`, `session_id`, `total_cost_usd`, `duration_ms`.

- [ ] **Step 2: Confirm `--json-schema` shape (string vs structured)**

```powershell
"Return the capital of France." | claude -p --tools "" --no-session-persistence --permission-prompts none --output-format json --json-schema '{\"type\":\"object\",\"properties\":{\"capital\":{\"type\":\"string\"}},\"required\":[\"capital\"]}'
```

Record: is `result` a **JSON string** (needs a second parse) or an **already-structured object**? (The wrapper handles both; just note which.)

- [ ] **Step 3: Confirm stream-json + verbose for the images transport**

```powershell
'{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Reply with the single word ok."}]}}' | claude -p --input-format stream-json --output-format stream-json --verbose --tools "" --no-session-persistence --permission-prompts none
```

Record: does it emit JSONL with a terminal `{"type":"result",...}` event? Does `--output-format stream-json` require `--verbose` in this version? (If it errors without `--verbose`, our defensive `--verbose` is justified.) Optionally re-run adding `--json-schema` to note whether schema composes with stream-json (§8 #2); if it errors, note that schema+images falls back to extract+repair.

- [ ] **Step 4: Write the findings doc**

Create `docs/specs/2026-09-22-askclaude-smoke-findings.md` with a short section per step: the exact answer, and — only if different from this plan's assumptions — the one-line code change needed (e.g., "result field is `X` not `result` → change the two `record.result` reads in `askClaude`"). If everything matches, say so explicitly.

- [ ] **Step 5: Commit (optional)**

```bash
git add docs/specs/2026-09-22-askclaude-smoke-findings.md
git commit -m "docs: record askclaude smoke findings (envelope + schema + stream-json)"
```

---

### Task 2: Scaffold, stub bin, and test harness

Stand up the package, the offline fake `claude`, and shared test utilities — then prove the harness works with one test. Everything after this task depends on it.

**Files:**
- Create: `tools/askclaude/package.json`
- Create: `tools/askclaude/test/stub-bin.mjs`
- Create: `tools/askclaude/test/helpers.mjs`
- Create: `tools/askclaude/test/stub-bin.test.mjs`

**Interfaces:**
- Produces: `test/helpers.mjs` exports `STUB`, `CLI`, `withEnv(env, fn)`, `jsonResult(fields)`, `spawnNode(scriptArgs, {env, stdin})`, `tmpFile(name)`. The stub is driven by env vars `ASKCLAUDE_STUB_STDOUT`, `ASKCLAUDE_STUB_STDOUT_<n>`, `ASKCLAUDE_STUB_STDERR`, `ASKCLAUDE_STUB_EXIT`, `ASKCLAUDE_STUB_DELAY_MS`, `ASKCLAUDE_STUB_RECORD`, `ASKCLAUDE_STUB_SEQ_FILE`.

- [ ] **Step 1: (Optional) init git**

```bash
cd tools/askclaude && git init
```

Skip if not using VCS. If you do use git, run the per-task commit steps from the repo root.

- [ ] **Step 2: Create `tools/askclaude/package.json`**

```json
{
  "name": "askclaude",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": { "askclaude": "./askclaude.mjs" },
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 3: Create `tools/askclaude/test/stub-bin.mjs`**

```js
#!/usr/bin/env node
// Offline fake `claude` for tests. Behaviour is controlled entirely by ASKCLAUDE_STUB_* env vars.
import { writeFileSync, readFileSync } from "node:fs";
import process from "node:process";

const env = process.env;
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { stdin += c; });
process.stdin.on("end", () => {
  if (env.ASKCLAUDE_STUB_RECORD) {
    writeFileSync(env.ASKCLAUDE_STUB_RECORD, JSON.stringify({
      argv: process.argv.slice(2),
      stdin,
      cwd: process.cwd(),
    }));
  }

  // Sequenced responses: attempt N reads ASKCLAUDE_STUB_STDOUT_<N>, else ASKCLAUDE_STUB_STDOUT.
  let n = 0;
  if (env.ASKCLAUDE_STUB_SEQ_FILE) {
    try { n = Number(readFileSync(env.ASKCLAUDE_STUB_SEQ_FILE, "utf8")) || 0; } catch {}
    writeFileSync(env.ASKCLAUDE_STUB_SEQ_FILE, String(n + 1));
  }

  const stdout = env[`ASKCLAUDE_STUB_STDOUT_${n}`] ?? env.ASKCLAUDE_STUB_STDOUT ?? "";
  const stderr = env.ASKCLAUDE_STUB_STDERR ?? "";
  const exit = env.ASKCLAUDE_STUB_EXIT ? Number(env.ASKCLAUDE_STUB_EXIT) : 0;
  const delay = env.ASKCLAUDE_STUB_DELAY_MS ? Number(env.ASKCLAUDE_STUB_DELAY_MS) : 0;

  const emit = () => {
    const done = () => process.exit(exit);
    if (stderr) process.stderr.write(stderr);
    if (stdout) process.stdout.write(stdout, done);
    else done();
  };
  if (delay > 0) setTimeout(emit, delay);
  else emit();
});
```

- [ ] **Step 4: Create `tools/askclaude/test/helpers.mjs`**

```js
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";

export const STUB = fileURLToPath(new URL("./stub-bin.mjs", import.meta.url));
export const CLI = fileURLToPath(new URL("../askclaude.mjs", import.meta.url));

export function tmpFile(name) {
  return join(mkdtempSync(join(tmpdir(), "askclaude-")), name);
}

// Temporarily set env vars for the duration of fn, then restore. Tests in a file run
// sequentially, so this is safe.
export async function withEnv(env, fn) {
  const saved = {};
  for (const k of Object.keys(env)) { saved[k] = process.env[k]; process.env[k] = env[k]; }
  try { return await fn(); }
  finally {
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// Build a canned `--output-format json` result record.
export function jsonResult(fields) {
  return JSON.stringify({
    type: "result", subtype: "success", is_error: false,
    session_id: "sess", total_cost_usd: 0.01, duration_ms: 5, ...fields,
  });
}

// Spawn `node <scriptArgs...>` and collect output. Used for the stub and the CLI.
export function spawnNode(scriptArgs, { env, stdin } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, scriptArgs, { env: { ...process.env, ...env } });
    let out = "", err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("close", (code) => resolve({ code, out, err }));
    child.stdin.end(stdin ?? "");
  });
}
```

- [ ] **Step 5: Write the harness test `tools/askclaude/test/stub-bin.test.mjs`**

```js
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
```

- [ ] **Step 6: Run the harness test to verify it passes**

Run: `node --test tools/askclaude/test/stub-bin.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit (optional)**

```bash
git add tools/askclaude/package.json tools/askclaude/test/
git commit -m "test: askclaude scaffold, offline stub bin, and test harness"
```

---

### Task 3: `buildArgs` — pure CLI flag builder

Creates `askclaude.mjs` with its module header, constants, and the first function. `buildArgs` maps a request to the exact `claude` flags per the transport × JSON matrix (spec §5.1) plus the always-on hygiene flags (§5.2). Pure and fully unit-testable — no subprocess.

**Files:**
- Create: `tools/askclaude/askclaude.mjs`
- Test: `tools/askclaude/test/build-args.test.mjs`

**Interfaces:**
- Produces: `buildArgs(request) -> string[]` (flags only — no bin, no prompt; prompt goes via stdin). Also creates the shared module header, `DEFAULT_TIMEOUT_MS`, `IMAGE_MEDIA_TYPES`, and the internal `JSON_NUDGE`/`REPAIR_NUDGE` constants that later tasks reuse.

- [ ] **Step 1: Write the failing test `tools/askclaude/test/build-args.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArgs } from "../askclaude.mjs";

const HYGIENE = ["-p", "--tools", "", "--no-session-persistence", "--permission-prompts", "none"];

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/build-args.test.mjs`
Expected: FAIL — `Cannot find module '../askclaude.mjs'` (file does not exist yet).

- [ ] **Step 3: Create `tools/askclaude/askclaude.mjs` with the header, constants, and `buildArgs`**

```js
// tools/askclaude/askclaude.mjs
// Thin, idea-agnostic wrapper around the `claude` CLI (print mode).
// Dual-use: `import { askClaude }` from JS/TS, OR pipe a JSON request to this file as a CLI.
// Zero dependencies — Node built-ins only. See README.md for the full contract.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import os from "node:os";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const DEFAULT_TIMEOUT_MS = 60000;

export const IMAGE_MEDIA_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const JSON_NUDGE =
  "Respond with ONLY a single valid JSON value. No prose, no explanation, no markdown code fences.";
const REPAIR_NUDGE =
  "Your previous answer could not be parsed as JSON. Reply again with ONLY the JSON value — no fences, no commentary.";

// Map a request to claude's flags (prompt is sent via stdin, so it is not here).
export function buildArgs(request) {
  const hasImages = Array.isArray(request.images) && request.images.length > 0;
  const wantJson = request.json !== false; // default true
  const hasSchema = request.schema != null;

  const args = [
    "-p",
    "--tools", "",
    "--no-session-persistence",
    "--permission-prompts", "none",
  ];

  if (hasImages) {
    args.push("--input-format", "stream-json", "--output-format", "stream-json", "--verbose");
  } else {
    args.push("--output-format", "json");
  }

  if (hasSchema) {
    args.push("--json-schema", JSON.stringify(request.schema));
  }
  if (request.system != null) {
    args.push("--system-prompt", String(request.system));
  }
  if (wantJson && !hasSchema) {
    args.push("--append-system-prompt", JSON_NUDGE);
  }
  if (request.model != null) {
    args.push("--model", String(request.model));
  }
  if (Array.isArray(request.extraArgs)) {
    args.push(...request.extraArgs.map(String));
  }
  return args;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/build-args.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/build-args.test.mjs
git commit -m "feat: buildArgs — claude flag builder for the transport/JSON matrix"
```

---

### Task 4: `encodeImage` + `buildStdinPayload` — pure stdin payload builders

Add image encoding (path → base64 + deduced media type, or inline base64) and the stdin payload builder (plain prompt for text; one stream-json user message for images, spec §5.3). Both pure.

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (append two functions)
- Test: `tools/askclaude/test/payload.test.mjs`

**Interfaces:**
- Consumes: `IMAGE_MEDIA_TYPES` (Task 3).
- Produces: `encodeImage(image) -> { media_type, data }` (throws on unsupported ext / missing mediaType); `buildStdinPayload(prompt, encodedImages) -> string` (returns raw prompt when `encodedImages` is empty; otherwise one JSON line ending in `\n`).

- [ ] **Step 1: Write the failing test `tools/askclaude/test/payload.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { encodeImage, buildStdinPayload } from "../askclaude.mjs";
import { tmpFile } from "./helpers.mjs";

test("encodeImage from base64 requires an explicit mediaType", () => {
  assert.throws(() => encodeImage({ base64: "AAAA" }), /mediaType/);
  assert.deepEqual(encodeImage({ base64: "AAAA", mediaType: "image/png" }), { media_type: "image/png", data: "AAAA" });
});

test("encodeImage from path deduces mediaType and base64-encodes bytes", () => {
  const p = tmpFile("x.png");
  writeFileSync(p, Buffer.from([1, 2, 3]));
  assert.deepEqual(encodeImage({ path: p }), { media_type: "image/png", data: Buffer.from([1, 2, 3]).toString("base64") });
});

test("encodeImage rejects an unknown extension", () => {
  assert.throws(() => encodeImage({ path: "a.bmp" }), /unsupported image extension/);
});

test("encodeImage rejects an image with neither path nor base64", () => {
  assert.throws(() => encodeImage({}), /path.*base64|base64.*path/);
});

test("buildStdinPayload: no images returns the raw prompt", () => {
  assert.equal(buildStdinPayload("hello", []), "hello");
});

test("buildStdinPayload: images become one stream-json user line (text block first)", () => {
  const line = buildStdinPayload("look", [{ media_type: "image/png", data: "ZZ" }]);
  assert.ok(line.endsWith("\n"));
  const obj = JSON.parse(line);
  assert.equal(obj.type, "user");
  assert.equal(obj.message.role, "user");
  assert.deepEqual(obj.message.content[0], { type: "text", text: "look" });
  assert.deepEqual(obj.message.content[1], { type: "image", source: { type: "base64", media_type: "image/png", data: "ZZ" } });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/payload.test.mjs`
Expected: FAIL — `encodeImage is not a function` / `buildStdinPayload is not a function`.

- [ ] **Step 3: Append `encodeImage` and `buildStdinPayload` to `askclaude.mjs`**

```js
// Turn one request image into a content-block source. Reads files eagerly so a bad
// path/extension fails as a `usage` error before any subprocess is started.
export function encodeImage(image) {
  if (image && typeof image.base64 === "string") {
    if (typeof image.mediaType !== "string" || image.mediaType.length === 0) {
      throw new Error("image.base64 requires an explicit image.mediaType");
    }
    return { media_type: image.mediaType, data: image.base64 };
  }
  if (image && typeof image.path === "string") {
    const ext = extname(image.path).toLowerCase();
    const media_type = IMAGE_MEDIA_TYPES[ext];
    if (!media_type) {
      throw new Error(`unsupported image extension '${ext}' for ${image.path}`);
    }
    return { media_type, data: readFileSync(image.path).toString("base64") };
  }
  throw new Error("each image needs either a 'path' or 'base64'+'mediaType'");
}

// Text transport: the raw prompt. Image transport: one stream-json user message line.
export function buildStdinPayload(prompt, encodedImages) {
  if (!encodedImages || encodedImages.length === 0) {
    return prompt;
  }
  const content = [
    { type: "text", text: prompt },
    ...encodedImages.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.media_type, data: img.data },
    })),
  ];
  return JSON.stringify({ type: "user", message: { role: "user", content } }) + "\n";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/payload.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/payload.test.mjs
git commit -m "feat: encodeImage + buildStdinPayload (text and stream-json transports)"
```

---

### Task 5: `extractResultRecord` — pull the result record from CLI output

Add the function that turns raw `claude` stdout into the result record: for `json` mode the whole stdout is the record; for `stream-json` mode it scans JSONL for the terminal `type:"result"` event (spec §5.3). Pure.

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (append one exported function + one internal helper)
- Test: `tools/askclaude/test/extract-record.test.mjs`

**Interfaces:**
- Produces: `extractResultRecord(stdout, mode) -> object` where `mode` is `"json"` or `"stream-json"`. Throws on empty output, unparseable JSON (json mode), or a missing result event (stream-json mode).

- [ ] **Step 1: Write the failing test `tools/askclaude/test/extract-record.test.mjs`**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/extract-record.test.mjs`
Expected: FAIL — `extractResultRecord is not a function`.

- [ ] **Step 3: Append `extractResultRecord` to `askclaude.mjs`**

```js
// Extract the terminal "result" record from claude output. json mode: the whole
// stdout is the record. stream-json mode: the last {type:"result"} JSONL event.
export function extractResultRecord(stdout, mode) {
  const trimmed = (stdout || "").trim();
  if (trimmed.length === 0) {
    throw new Error("empty output from claude");
  }
  if (mode === "stream-json") {
    let record = null;
    for (const line of trimmed.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let evt;
      try { evt = JSON.parse(line); } catch { continue; }
      if (evt && evt.type === "result") record = evt;
    }
    if (!record) throw new Error("no 'result' event in stream-json output");
    return record;
  }
  return JSON.parse(trimmed); // json mode
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/extract-record.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/extract-record.test.mjs
git commit -m "feat: extractResultRecord for json and stream-json output"
```

---

### Task 6: `extractJson` — tolerant JSON extraction

Add tolerant JSON extraction for the no-schema path (spec §5.4): strip code fences, try a direct parse, else scan for the first balanced `{...}`/`[...]`. Pure.

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (append one exported function + one internal helper)
- Test: `tools/askclaude/test/extract-json.test.mjs`

**Interfaces:**
- Produces: `extractJson(text) -> any`. Returns the value already if given an object; otherwise parses. Throws `"no JSON value found in text"` when nothing parseable is present.

- [ ] **Step 1: Write the failing test `tools/askclaude/test/extract-json.test.mjs`**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/extract-json.test.mjs`
Expected: FAIL — `extractJson is not a function`.

- [ ] **Step 3: Append `extractJson` and `firstBalanced` to `askclaude.mjs`**

```js
// Tolerant JSON extraction for the no-schema path: strip fences, try a direct parse,
// else return the first balanced {..} / [..] (string-aware, so braces in strings do not fool it).
export function extractJson(text) {
  if (text && typeof text === "object") return text;
  let s = String(text).trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  try { return JSON.parse(s); } catch {}
  const candidate = firstBalanced(s);
  if (candidate !== null) return JSON.parse(candidate); // may throw → caller handles
  throw new Error("no JSON value found in text");
}

function firstBalanced(s) {
  const closerOf = { "{": "}", "[": "]" };
  for (let i = 0; i < s.length; i++) {
    const open = s[i];
    if (open !== "{" && open !== "[") continue;
    const close = closerOf[open];
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const ch = s[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) return s.slice(i, j + 1);
      }
    }
  }
  return null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/extract-json.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/extract-json.test.mjs
git commit -m "feat: extractJson — tolerant JSON extraction with balanced scan"
```

---

### Task 7: `runClaude` — the spawn helper (first integration with the stub)

Add the impure spawn helper: launch `claude` (or the `.mjs` stub via `node`), write the payload to stdin and close it, capture stdout/stderr, enforce the timeout, and normalize spawn failures. It never throws — it resolves a plain result object.

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (append one exported function)
- Test: `tools/askclaude/test/run-claude.test.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks (self-contained).
- Produces: `runClaude({ bin, args, stdin, timeoutMs, cwd }) -> Promise<{ code?, stdout?, stderr?, timedOut?, spawnError? }>`. When `bin` ends in `.mjs`/`.js`/`.cjs`, it is run via `process.execPath` (so a JS stub works cross-platform); otherwise `bin` is spawned directly with `shell:false`.

- [ ] **Step 1: Write the failing test `tools/askclaude/test/run-claude.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { runClaude } from "../askclaude.mjs";
import { STUB, withEnv, tmpFile } from "./helpers.mjs";

test("captures stdout and exit code", async () => {
  await withEnv({ ASKCLAUDE_STUB_STDOUT: "OUT", ASKCLAUDE_STUB_EXIT: "0" }, async () => {
    const res = await runClaude({ bin: STUB, args: [], stdin: "", timeoutMs: 5000, cwd: tmpdir() });
    assert.equal(res.stdout, "OUT");
    assert.equal(res.code, 0);
    assert.equal(res.timedOut, false);
  });
});

test("passes stdin, argv, and cwd through to the process", async () => {
  const rec = tmpFile("rec.json");
  const cwd = dirname(rec);
  await withEnv({ ASKCLAUDE_STUB_STDOUT: "{}", ASKCLAUDE_STUB_RECORD: rec }, async () => {
    await runClaude({ bin: STUB, args: ["--flag", "v"], stdin: "HELLO", timeoutMs: 5000, cwd });
  });
  const saved = JSON.parse(readFileSync(rec, "utf8"));
  assert.equal(saved.stdin, "HELLO");
  assert.deepEqual(saved.argv, ["--flag", "v"]);
  assert.equal(realpathSync(saved.cwd), realpathSync(cwd));
});

test("times out and kills a slow process", async () => {
  await withEnv({ ASKCLAUDE_STUB_STDOUT: "late", ASKCLAUDE_STUB_DELAY_MS: "3000" }, async () => {
    const res = await runClaude({ bin: STUB, args: [], stdin: "", timeoutMs: 200, cwd: tmpdir() });
    assert.equal(res.timedOut, true);
  });
});

test("reports a spawn error for a missing binary", async () => {
  const res = await runClaude({ bin: "definitely-not-a-real-binary-xyz", args: [], stdin: "", timeoutMs: 2000, cwd: tmpdir() });
  assert.ok(res.spawnError);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/run-claude.test.mjs`
Expected: FAIL — `runClaude is not a function`.

- [ ] **Step 3: Append `runClaude` to `askclaude.mjs`**

```js
// Spawn claude (or a .mjs stub via node), feed stdin, capture output, enforce timeout.
// Never throws: resolves { code, stdout, stderr, timedOut } or { spawnError }.
export function runClaude({ bin, args, stdin, timeoutMs, cwd }) {
  return new Promise((resolve) => {
    const isJs = /\.[mc]?js$/i.test(bin);
    const program = isJs ? process.execPath : bin;
    const argv = isJs ? [bin, ...args] : args;

    let child;
    try {
      child = spawn(program, argv, { cwd, stdio: ["pipe", "pipe", "pipe"], shell: false });
    } catch (spawnError) {
      resolve({ spawnError });
      return;
    }

    let stdout = "", stderr = "", timedOut = false, settled = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };

    child.on("error", (spawnError) => finish({ spawnError }));
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("close", (code) => finish({ code, stdout, stderr, timedOut }));

    child.stdin.on("error", () => {}); // swallow EPIPE if claude exits before reading stdin
    child.stdin.end(stdin);
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/run-claude.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/run-claude.test.mjs
git commit -m "feat: runClaude — spawn helper with stdin, timeout, and error normalization"
```

---

### Task 8: `askClaude` — text transport orchestrator (happy paths, errors, repair)

Wire the pieces into the public function for the **text** transport: validate, build args + payload, spawn, parse the record, apply the JSON strategy (schema-enforce / extract / json:false), map every failure to a typed error envelope (§6), and run the repair loop for the no-schema case (§5.4). Images are added in Task 9.

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (append `askClaude` + `validateRequest` + `errEnvelope`)
- Test: `tools/askclaude/test/ask-claude.test.mjs`

**Interfaces:**
- Consumes: `buildArgs`, `buildStdinPayload`, `extractResultRecord`, `extractJson`, `runClaude`, `DEFAULT_TIMEOUT_MS`, `REPAIR_NUDGE`, and `os`, `process`.
- Produces: `askClaude(request) -> Promise<envelope>`; internal `errEnvelope(type, message, raw?)` and `validateRequest(request) -> string|null`.
- Behaviour: bin from `process.env.ASKCLAUDE_CLAUDE_BIN || "claude"`; cwd from `request.cwd || os.tmpdir()`; timeout `request.timeoutMs ?? DEFAULT_TIMEOUT_MS`; repairs `request.retries ?? 1` only when `json && !schema`.

- [ ] **Step 1: Write the failing test `tools/askclaude/test/ask-claude.test.mjs`**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/ask-claude.test.mjs`
Expected: FAIL — `askClaude is not a function`.

- [ ] **Step 3: Append `askClaude`, `validateRequest`, and `errEnvelope` to `askclaude.mjs`**

```js
export async function askClaude(request) {
  const invalid = validateRequest(request);
  if (invalid) return errEnvelope("usage", invalid);

  const wantJson = request.json !== false;
  const hasSchema = request.schema != null;
  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRepairs = wantJson && !hasSchema ? (request.retries ?? 1) : 0;
  const bin = process.env.ASKCLAUDE_CLAUDE_BIN || "claude";
  const cwd = request.cwd || os.tmpdir();

  let encodedImages, baseArgs;
  try {
    encodedImages = []; // Task 9 replaces this with request.images.map(encodeImage)
    baseArgs = buildArgs(request);
  } catch (err) {
    return errEnvelope("usage", err.message);
  }

  const mode = "json"; // Task 9 selects "stream-json" when images are present
  const started = Date.now();

  for (let attempt = 0; ; attempt++) {
    const attemptPrompt = attempt === 0 ? request.prompt : `${request.prompt}\n\n${REPAIR_NUDGE}`;
    const payload = buildStdinPayload(attemptPrompt, encodedImages);
    const res = await runClaude({ bin, args: baseArgs, stdin: payload, timeoutMs, cwd });

    if (res.spawnError) {
      return errEnvelope("spawn", `could not start '${bin}': ${res.spawnError.message}`, String(res.spawnError.stack || ""));
    }
    if (res.timedOut) {
      return errEnvelope("timeout", `claude did not finish within ${timeoutMs}ms`, res.stderr);
    }

    let record;
    try {
      record = extractResultRecord(res.stdout, mode);
    } catch {
      const message = res.code !== 0 ? `claude exited with code ${res.code}` : "unparseable claude output";
      return errEnvelope("cli", message, res.stderr || res.stdout);
    }
    if (record.is_error || (record.subtype && record.subtype !== "success")) {
      return errEnvelope("cli", String(record.result || record.subtype || "claude reported an error"), res.stderr || res.stdout);
    }

    const text = typeof record.result === "string" ? record.result : JSON.stringify(record.result);
    const meta = {
      mode,
      schemaEnforced: hasSchema,
      retriedRepair: attempt > 0,
      model: record.model ?? request.model ?? null,
      durationMs: Date.now() - started,
      sessionId: record.session_id ?? null,
      costUsd: record.total_cost_usd ?? null,
    };

    if (!wantJson) {
      return { ok: true, data: undefined, text, meta };
    }

    let data;
    try {
      data = typeof record.result === "object" && record.result !== null ? record.result : extractJson(text);
    } catch {
      if (attempt < maxRepairs) continue;
      return errEnvelope("parse", "model output was not valid JSON after repair", text);
    }
    return { ok: true, data, text, meta };
  }
}

function validateRequest(request) {
  if (request == null || typeof request !== "object") return "request must be a JSON object";
  if (typeof request.prompt !== "string" || request.prompt.length === 0) {
    return "`prompt` is required and must be a non-empty string";
  }
  return null;
}

function errEnvelope(type, message, raw) {
  const error = { type, message };
  if (raw !== undefined) error.raw = raw;
  return { ok: false, error };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/ask-claude.test.mjs`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/ask-claude.test.mjs
git commit -m "feat: askClaude text transport — JSON strategy, error mapping, repair loop"
```

---

### Task 9: `askClaude` images branch (additive)

Enable the stream-json image transport. `buildArgs` and `buildStdinPayload` already handle images (Tasks 3–4); this task flips two lines in `askClaude` so images are encoded and the stream-json mode is selected, then covers the path with tests. Image encoding failures surface as `usage` errors (already handled by the try/catch around `encodedImages`).

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (two lines inside `askClaude`; add `encodeImage` to the call)
- Test: `tools/askclaude/test/ask-claude-images.test.mjs`

**Interfaces:**
- Consumes: `encodeImage`, `buildStdinPayload`, `extractResultRecord` (mode `"stream-json"`).
- Produces: no new exports — `askClaude` now supports `request.images`.

- [ ] **Step 1: Write the failing test `tools/askclaude/test/ask-claude-images.test.mjs`**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/ask-claude-images.test.mjs`
Expected: FAIL — with images ignored (`encodedImages = []`, `mode = "json"`), the stub's JSONL is parsed as a single JSON object and throws → the first test gets a `cli` error instead of `ok:true`.

- [ ] **Step 3: Enable images in `askClaude` — replace the two placeholder lines**

Replace:

```js
    encodedImages = []; // Task 9 replaces this with request.images.map(encodeImage)
    baseArgs = buildArgs(request);
```

with:

```js
    encodedImages = Array.isArray(request.images) ? request.images.map(encodeImage) : [];
    baseArgs = buildArgs(request);
```

And replace:

```js
  const mode = "json"; // Task 9 selects "stream-json" when images are present
```

with:

```js
  const mode = encodedImages.length > 0 ? "stream-json" : "json";
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/ask-claude-images.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the whole suite to confirm no regressions**

Run: `node --test tools/askclaude/test`
Expected: PASS (all files).

- [ ] **Step 6: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/ask-claude-images.test.mjs
git commit -m "feat: askClaude image transport (stream-json content blocks)"
```

---

### Task 10: CLI entrypoint — stdin JSON in, envelope + exit code out

Add the thin CLI layer at the bottom of `askclaude.mjs`: read a JSON request from stdin, call `askClaude`, print the envelope on stdout, mirror a one-line human error on stderr, and exit with the code for the envelope type (§4.2). The entrypoint runs only when the file is invoked directly (guarded), so importing the module for tests never triggers it.

**Files:**
- Modify: `tools/askclaude/askclaude.mjs` (append `exitCodeForEnvelope`, `readStdin`, `main`, and the guarded call)
- Test: `tools/askclaude/test/cli.test.mjs`

**Interfaces:**
- Consumes: `askClaude`, `errEnvelope`, `pathToFileURL`, `process`.
- Produces: `exitCodeForEnvelope(envelope) -> number` (exported for testing). The guard uses `import.meta.url === pathToFileURL(process.argv[1]).href`.

- [ ] **Step 1: Write the failing test `tools/askclaude/test/cli.test.mjs`**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tools/askclaude/test/cli.test.mjs`
Expected: FAIL — `exitCodeForEnvelope is not a function`.

- [ ] **Step 3: Append the CLI layer to the bottom of `askclaude.mjs`**

```js
export function exitCodeForEnvelope(envelope) {
  if (envelope.ok) return 0;
  switch (envelope.error.type) {
    case "usage": return 1;
    case "spawn":
    case "timeout":
    case "cli": return 2;
    case "parse": return 3;
    default: return 2;
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => { data += c; });
    process.stdin.on("end", () => resolve(data));
  });
}

async function main() {
  const raw = await readStdin();
  let request;
  try {
    request = JSON.parse(raw);
  } catch {
    const env = errEnvelope("usage", "stdin was not valid JSON");
    process.stdout.write(JSON.stringify(env) + "\n");
    process.stderr.write("askclaude: [usage] stdin was not valid JSON\n");
    process.exit(1);
    return;
  }
  const env = await askClaude(request);
  process.stdout.write(JSON.stringify(env) + "\n");
  if (!env.ok) {
    process.stderr.write(`askclaude: [${env.error.type}] ${env.error.message}\n`);
  }
  process.exit(exitCodeForEnvelope(env));
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsCli) {
  main();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tools/askclaude/test/cli.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the whole suite**

Run: `node --test tools/askclaude/test`
Expected: PASS (all files).

- [ ] **Step 6: Commit (optional)**

```bash
git add tools/askclaude/askclaude.mjs tools/askclaude/test/cli.test.mjs
git commit -m "feat: CLI entrypoint — stdin JSON to envelope with typed exit codes"
```

---

### Task 11: README — contract and the three language snippets

Write the usage doc: the request/response contract, JS-TS import + Python + PowerShell subprocess snippets, the env vars, exit codes, and the "`extraArgs` sparingly" note (spec §4, §5.5, §7).

**Files:**
- Create: `tools/askclaude/README.md`

**Interfaces:**
- Consumes: the finished `askClaude` contract from Tasks 8–10.
- Produces: documentation only (no code dependency).

- [ ] **Step 1: Create `tools/askclaude/README.md`**

````markdown
# askclaude

A thin, idea-agnostic wrapper around the local `claude` CLI (print mode). One JSON request in,
one JSON envelope out — callable identically from any language. Zero dependencies (Node built-ins
only). The product's LLM calls all go through here.

## Request (JSON on stdin, or the argument to `askClaude`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `prompt` | string | — | **Required.** Sent to claude via stdin. |
| `json` | boolean | `true` | `false` → return raw text in `text`, no `data`. |
| `schema` | JSON Schema | — | If present → native enforce via `--json-schema`. |
| `system` | string | — | Replaces the default system prompt. |
| `images` | array | — | `{ "path": "…" }` or `{ "base64": "…", "mediaType": "image/png" }`. |
| `model` | string | — | `opus` \| `sonnet` \| `fable` \| full name. |
| `timeoutMs` | number | `60000` | Kills claude past this. |
| `retries` | number | `1` | Repair attempts (only when `json` and no `schema`). |
| `extraArgs` | string[] | — | Forwarded verbatim to `claude`. Use sparingly. |
| `cwd` | string | OS temp dir | Neutral by default, so the project `CLAUDE.md` is not auto-loaded. |

## Response (JSON envelope on stdout — success and error)

```json
{ "ok": true,  "data": {}, "text": "raw model text", "meta": { "mode": "json", "schemaEnforced": true, "retriedRepair": false, "model": null, "durationMs": 1234, "sessionId": "…", "costUsd": 0.01 } }
{ "ok": false, "error": { "type": "usage|spawn|timeout|cli|parse", "message": "…", "raw": "…" } }
```

`data` is present only when `json` is true. `text` is always the raw model output.

## Exit codes (CLI)

`0` ok · `1` usage (bad request) · `2` spawn/timeout/cli · `3` parse (unparseable JSON after repair).

## Use it

**JS / TS (import — no subprocess):**

```js
import { askClaude } from "./tools/askclaude/askclaude.mjs";
const r = await askClaude({ prompt, json: true, schema });
if (!r.ok) throw new Error(r.error.message);
use(r.data);
```

**Python (subprocess):**

```python
import json, subprocess
req = {"prompt": "…", "schema": {...}}
out = subprocess.run(["node", "tools/askclaude/askclaude.mjs"],
                     input=json.dumps(req), text=True, capture_output=True)
env = json.loads(out.stdout)
if not env["ok"]:
    raise RuntimeError(env["error"]["message"])
data = env["data"]
```

**PowerShell (subprocess):**

```powershell
$req = @{ prompt = "…"; schema = @{ type = "object" } }
$env = $req | ConvertTo-Json -Depth 20 | node tools/askclaude/askclaude.mjs | ConvertFrom-Json
if (-not $env.ok) { throw $env.error.message }
$env.data
```

## Environment variables

- `ASKCLAUDE_CLAUDE_BIN` — override the `claude` command. Point it at `test/stub-bin.mjs` for
  **offline, deterministic** runs (tests and the 90s demo). A `.mjs`/`.js` value is run via `node`.
- `ASKCLAUDE_LIVE=1` — enable the opt-in real smoke test (`test/live.test.mjs`).

## `extraArgs` (escape hatch)

Anything not modelled above (`--restricted`, `--permission-mode`, `--add-dir`,
`--append-system-prompt`, `--fallback-model`, `--max-budget-usd`, `--safe-mode`, `--bare`, …) can be
forwarded verbatim. Use sparingly — prefer a modelled field when one exists.

## Tests

```
node --test            # from tools/askclaude  (offline; uses the stub bin)
```
````

- [ ] **Step 2: Commit (optional)**

```bash
git add tools/askclaude/README.md
git commit -m "docs: askclaude README — contract, snippets, env vars, exit codes"
```

---

### Task 12: Opt-in live smoke test

Add one real end-to-end test through the built wrapper, skipped unless `ASKCLAUDE_LIVE=1`. This confirms Task 1's findings still hold through `askClaude` (envelope field, schema enforcement) without spending inference on every `node --test` run.

**Files:**
- Create: `tools/askclaude/test/live.test.mjs`

**Interfaces:**
- Consumes: the real `claude` on PATH and `askClaude`.
- Produces: a guarded test (no effect on the offline suite).

- [ ] **Step 1: Create `tools/askclaude/test/live.test.mjs`**

```js
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
```

- [ ] **Step 2: Verify it is skipped offline**

Run: `node --test tools/askclaude/test/live.test.mjs`
Expected: PASS with both tests reported as skipped.

- [ ] **Step 3: Run it live once (spends inference; requires logged-in `claude`)**

PowerShell: `$env:ASKCLAUDE_LIVE = "1"; node --test tools/askclaude/test/live.test.mjs`
Expected: PASS (2 tests). If it fails, reconcile against Task 1's findings (result field / schema shape) and adjust the two `record.result` reads in `askClaude` if needed.

- [ ] **Step 4: Commit (optional)**

```bash
git add tools/askclaude/test/live.test.mjs
git commit -m "test: opt-in live smoke against real claude (ASKCLAUDE_LIVE=1)"
```

---

## Full verification

Run the complete offline suite (no inference, no network):

```
node --test tools/askclaude/test
```

Expected: all files pass; `live.test.mjs` reports skipped. Then, once, run the live smoke to confirm the wrapper works against real `claude` (spends inference):

```powershell
$env:ASKCLAUDE_LIVE = "1"; node --test tools/askclaude/test/live.test.mjs
```

## Spec coverage map

| Spec section | Task(s) |
|---|---|
| §3 architecture (single zero-dep dual-use file) | 2, 3–10 |
| §4.1 request fields (prompt, system, images, json, schema, model, timeoutMs, retries, extraArgs, cwd) | 3, 8, 9 |
| §4.2 envelope + exit codes | 8, 10 |
| §4.3 import API / §4.4 subprocess use | 8, 11 |
| §5.1 transport × JSON matrix | 3, 8, 9 |
| §5.2 hygiene flags + stdin prompt + neutral cwd | 3, 8 |
| §5.3 images (stream-json content block) | 4, 9 |
| §5.4 auto-repair | 8 |
| §5.5 extraArgs | 3 |
| §6 error model (usage/spawn/timeout/cli/parse) | 8, 10 |
| §7 stub-bin, offline tests, one real smoke | 2, 7–10, 12 |
| §8 runtime unknowns (envelope field, schema shape, stream-json+verbose) | 1 (+ defensive parsing in 5, 8) |
| §10 build order (smoke → stub+tests → module+CLI → README) | 1 → 2–10 → 11 |
