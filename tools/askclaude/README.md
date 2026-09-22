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
npm test        # from tools/askclaude — offline; uses the stub bin
```

Run `npm test` (which scopes to `test/*.test.mjs`), NOT a bare `node --test`:
Node's runner would also execute the support files under `test/` (the stub bin
waits on stdin) and hang. To run directly: `node --test "test/*.test.mjs"`.
