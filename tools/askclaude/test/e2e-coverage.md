# e2e Coverage — `tools/askclaude`

All 20 e2e tests in `test/e2e.test.mjs` drive the CLI subprocess interface
(`node askclaude.mjs` ← JSON on stdin → envelope on stdout + exit code).
Every test runs offline via `test/stub-bin.mjs`; no real `claude` is invoked.

---

## Covered (20 tests)

| # | Test name | What it asserts | Exit code |
|---|-----------|-----------------|-----------|
| 01 | json mode no-schema — extracts data from result string | `ok:true`, `data={answer:42}`, `schemaEnforced:false`, `mode:"json"` | 0 |
| 02 | schema mode, result is JSON string — data parsed, schemaEnforced true | `ok:true`, `data={n:5}`, `schemaEnforced:true` | 0 |
| 03 | schema mode, result already an object — passed through as data | `ok:true`, `data={x:9}` (object in record, no second parse) | 0 |
| 04 | json:false — text only, data undefined | `ok:true`, `text="hello world"`, `data===undefined` | 0 |
| 05 | missing prompt — usage error | `ok:false`, `error.type="usage"` | 1 |
| 06 | invalid stdin JSON — usage error | `ok:false`, `error.type="usage"` | 1 |
| 07 | stdin is valid JSON but not an object (123) — usage error | `ok:false`, `error.type="usage"` | 1 |
| 08 | bad ASKCLAUDE_CLAUDE_BIN — spawn error | `ok:false`, `error.type="spawn"` | 2 |
| 09 | timeout (stub delay > timeoutMs) — timeout error | `ok:false`, `error.type="timeout"` | 2 |
| 10 | non-zero exit, empty stdout — cli error, stderr in raw | `ok:false`, `error.type="cli"`, `error.raw` contains stderr | 2 |
| 11 | non-zero exit with parseable output — still cli error (Task 8 guard) | `ok:false`, `error.type="cli"` even when stdout parses | 2 |
| 12 | is_error:true in record — cli error | `ok:false`, `error.type="cli"` | 2 |
| 13 | unparseable result after repair exhausted — parse error | `ok:false`, `error.type="parse"`, `error.raw` contains the bad text | 3 |
| 14 | repair-then-success (SEQ_FILE: garbage→valid) | `ok:true`, `data={fixed:true}`, `meta.retriedRepair:true` | 0 |
| 15 | images — stream-json JSONL, single result event | `ok:true`, `data={label:"cat"}`, `meta.mode:"stream-json"` | 0 |
| 16 | unsupported image extension — usage error before spawn | `ok:false`, `error.type="usage"` (no subprocess started) | 1 |
| 17 | extraArgs forwarded verbatim (asserted via STUB_RECORD argv) | `--safe-mode` and `--some-flag` present in subprocess argv | 0 |
| 18 | system-prompt + model forwarded; prompt on stdin not in argv | `--system-prompt` and `--model` in argv; `stdin="hello"`; `"hello"` absent from argv | 0 |
| 19 | EDGE: prose-wrapped JSON with brace-in-string — tolerant extract | `ok:true`, `data={msg:"a } b",n:1}` — firstBalanced() skips braces inside strings | 0 |
| 20 | EDGE: stream-json with two terminal result events — last wins | `ok:true`, `data={second:2}` — extractResultRecord keeps overwriting with each `type:"result"` line | 0 |

Exit codes covered: **0** (ok), **1** (usage), **2** (spawn / timeout / cli), **3** (parse).
Transports covered: **json** (tests 01–14, 16–19) and **stream-json** (tests 15, 20).

---

## Intentionally NOT covered (≤20 budget exhausted)

| Scenario | Reason not covered |
|----------|--------------------|
| schema + images composition (spec §8 #2: schema may not compose with stream-json) | Needs real `claude` to observe fallback behaviour; stub cannot simulate the stream-json+schema interaction meaningfully. |
| Multiple images in one request | Variant of test 15; the encoding loop is tested in unit tests (`ask-claude-images.test.mjs`). E2e coverage adds no unique signal. |
| Inline base64 image (vs path) | Variant of test 15; `encodeImage` is unit-tested for both branches. |
| `retries` > 1 (more than one repair attempt) | The SEQ_FILE mechanism and the repair loop are verified for `retries:1` (tests 13–14); higher counts add combinatorial cost with no new code path. |
| Custom `cwd` override | The neutral `os.tmpdir()` default is implicit in every test; a custom path exercises no new code in the wrapper (passed straight to `spawn`). |
| `--safe-mode` / `--bare` via `extraArgs` end-to-end effect | Test 17 proves verbatim passthrough; the effect on real `claude` is not observable through the stub. |
| Model-specific behaviour (opus / sonnet / fable) | `--model` flag forwarding is proven in test 18; per-model output differences are not observable through the stub. |
| Large prompts (> 100 kB) | Not observable through the stub; the subprocess stdio pipe is the only constraint and is not validated in the wrapper. |
| Real / live path | Covered by the opt-in `test/live.test.mjs` (set `ASKCLAUDE_LIVE=1`). |

---

## Limits confirmed

| Limit | Handling |
|-------|----------|
| schema `result` is a JSON string that needs a second parse | `extractJson(text)` handles it; documented in spec and verified in test 02. |
| Manual PowerShell inline `--json-schema` escaping is error-prone | The wrapper uses `shell:false` and passes the serialised schema as a plain argument — callers should use the wrapper rather than constructing the flag manually. |
| A non-zero claude exit is always a `cli` error, even if the output parses cleanly | The `if (res.code !== 0)` guard runs after `extractResultRecord` succeeds; this is intentional (Task 8 guard). Verified in test 11. |
| Empty stdout with exit 0 maps to `cli` (not `parse`) | `extractResultRecord` throws "empty output from claude"; the catch block creates a `cli` envelope regardless of exit code when parsing fails. Acceptable — empty output is an unexpected claude state. |
| Node's `--test` discovers every file under `test/`, so a bare `node --test` executes the stub bin and hangs | Use `npm test` or `node --test "test/*.test.mjs"` to scope to real test files only. |

---

## Bugs found and fixed

(a) Non-zero claude exit now always maps to `cli` error even when stdout parses — the `if (res.code !== 0)` guard runs after `extractResultRecord` succeeds (Task 8 guard); verified in e2e test 11.
(b) Client offline demo was not showing all examples — fixed so the full example set is displayed.
(c) `npm test` no longer hangs — test discovery scoped to `*.test.mjs` so `stub-bin.mjs` is not executed as a test entry point.
(d) `runClaude` multibyte decoding — added `child.stdout/stderr.setEncoding("utf8")` so UTF-8 chars split across pipe chunk boundaries are decoded correctly via Node's StringDecoder instead of producing U+FFFD.
(e) CLI stdout flush-before-exit — `process.exit()` now called only inside the `process.stdout.write()` completion callback, ensuring the full JSON envelope is flushed to the pipe before the process terminates on Windows.
