# askclaude Smoke Findings — 2026-09-22

Resolves the §8 runtime unknowns for the `askclaude` wrapper.
All commands run from `$env:TEMP` (neutral dir, no project `CLAUDE.md` loaded).
`claude` version: 2.1.278, model: claude-sonnet-4-6.

---

## Step 1 — Plain JSON envelope field

**Command:**
```powershell
"Say the word ready and nothing else." | claude -p --tools "" --no-session-persistence --permission-prompts none --output-format json
```

**Findings:**
- Top-level field holding the model's answer: **`result`** (string value `"ready"`) — matches plan assumption.
- All expected envelope fields are present: `is_error` (false), `subtype` ("success"), `session_id`, `total_cost_usd`, `duration_ms`.
- Additional fields present: `type` ("result"), `uuid`, `num_turns`, `ttft_ms`, `stop_reason`, `usage`, `modelUsage`, `terminal_reason`, etc.

**Verdict:** Matches plan assumption. No code change needed.

---

## Step 2 — `--json-schema` shape (string vs structured)

**Command:**
```powershell
$schema = '{"type":"object","properties":{"capital":{"type":"string"}},"required":["capital"]}'
"Return the capital of France." | claude -p --tools "" --no-session-persistence --permission-prompts none --output-format json --json-schema $schema
```

(Note: the brief's verbatim backslash-escaped form fails in PowerShell with "JSON Parse error: Unrecognized token '\'" — the schema must be passed via a variable or single-quoted string.)

**Findings:**
- `result` field is a **JSON string**: `"{\"capital\":\"Paris\"}"` — needs a second `JSON.parse()`.
- An additional top-level field `structured_output` is also present with the already-parsed object: `{"capital":"Paris"}`.
- Internally claude uses a `StructuredOutput` tool to enforce the schema (visible in verbose stream-json; see Step 3c).

**Verdict:** `result` is always a JSON string when `--json-schema` is used. The wrapper's defensive "tolerates string-or-object" parsing is correct. No code change needed; the wrapper can also optionally prefer `structured_output` if present to skip the second parse.

---

## Step 3 — stream-json + `--verbose`

**Command:**
```powershell
'{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Reply with the single word ok."}]}}' | claude -p --input-format stream-json --output-format stream-json --verbose --tools "" --no-session-persistence --permission-prompts none
```

**Findings:**
- Emits JSONL. Events observed in order:
  1. `{"type":"system","subtype":"init",...}` — init/metadata event
  2. `{"type":"assistant","message":{...},...}` — streamed assistant turn
  3. `{"type":"rate_limit_event",...}` — rate limit info
  4. `{"type":"result",...,"result":"ok","is_error":false,"subtype":"success"}` — **terminal result event**
- Terminal `{"type":"result",...}` event is present and carries the same envelope fields as the plain JSON mode.

**`--verbose` is required:** Running without `--verbose` exits with code 1 and error:
```
Error: When using --print, --output-format=stream-json requires --verbose
```
The defensive `--verbose` in the wrapper is **justified and mandatory** (not just defensive).

**Step 3c — `--json-schema` composes with stream-json:** Tested additionally. Works correctly:
- The system init event shows `"tools":["StructuredOutput"]` (schema enforcement tool injected).
- The terminal result event still carries `"result":"{\"capital\":\"Paris\"}"` (JSON string) and `"structured_output":{"capital":"Paris"}` (parsed object).
- No errors. Schema + stream-json + verbose is a supported combination.

**Verdict:** All matches plan assumptions. `--verbose` is mandatory (not just defensive). No code change needed.

---

## Summary

| Unknown | Plan assumption | Actual | Match? |
|---------|----------------|--------|--------|
| Top-level result field name | `result` | `result` | YES |
| `--json-schema` shape of `result` | string (needs 2nd parse) or object | Always a JSON **string**; bonus `structured_output` object also present | YES (string confirmed) |
| `stream-json` needs `--verbose` | defensive `--verbose` included | `--verbose` is **mandatory** (errors without it) | YES — wrapper is correct |
| `--json-schema` + `stream-json` composition | fallback to extract+repair if it errors | Works fine; schema applies via StructuredOutput tool | BONUS: no fallback needed |

**All plan assumptions confirmed. No code changes implied.**
