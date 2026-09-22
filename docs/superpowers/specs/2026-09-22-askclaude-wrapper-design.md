# askclaude — wrapper CLI `claude` (spec di design)

- **Data:** 2026-09-22
- **Stato:** design approvato → build TDD (codice non ancora scritto)
- **Contesto:** perimetro in [CLAUDE.md](../../CLAUDE.md); idee candidate in [docs/discovery](../discovery/discovery.md)
- **Autore:** brainstorming (skill `superpowers:brainstorming`), sessione Opus 4.8

---

## 1. Scopo e requisiti serviti

Fornire **un unico punto di invocazione dell'LLM** per il prodotto: un wrapper sottile e
idea-agnostico attorno alla CLI `claude` in print-mode, che fa **una volta sola** le parti
fragili e ripetitive (invocazione corretta su Windows, prompt via stdin, structured output,
input immagini, timeout/errori) ed è **chiamabile identico da qualsiasi linguaggio**.

Perché è sul *critical path* di ogni idea (non opzionale):

| Requisito CLAUDE.md | Come il wrapper lo serve |
|---|---|
| "L'LLM del prodotto si invoca via CLI `claude` da script locali" | È esattamente la plumbing che incapsula. Universale a ogni idea. |
| "Capability che chiude il loop: proposta → conferma → esecuzione" | Chiudere il loop richiede output del modello → **azione eseguibile**: serve JSON strutturato affidabile (`--json-schema` + parse). |
| "Demo 90s offline su dati locali" | Lo **stub-bin** fa girare la demo offline con output LLM *canned*. |
| "Solo Claude, niente API key / servizi esterni" | Il wrapper si limita a lanciare `claude`; non introduce alcuna dipendenza esterna. |
| "Più linguaggi (invoker probabilmente JS/TS)" | Un solo contratto JSON stdin/stdout + import nativo per JS/TS. |

**Il costo di build è pagato ora (prima del 22/09), non durante le ~5h dell'hackathon.**

---

## 2. Non-obiettivi (YAGNI v1)

Fuori scope in v1 (riabilitabili poi, alcuni via `extraArgs` senza toccare il codice):
streaming di token verso il chiamante · stato conversazione / multi-turn · daemon HTTP ·
pacchetti pubblicati per-linguaggio · passthrough tool/MCP lato-modello · validazione
JSON-schema *nostra* (la delega alla CLI via `--json-schema`) · **esecuzione dell'azione**
(il wrapper è il *cervello* testo→JSON; le *mani* — Playwright, mock PagoPA, ecc. — sono il
codice dell'idea).

---

## 3. Architettura

- **Un singolo file Node.js, zero dipendenze** (`npm install` non necessario; solo built-in:
  `child_process`, `fs`, `process`). **Dual-use**: modulo ESM importabile **e** CLI, stesso file.
- **Perché Node** (non PowerShell/bash): i **managed-settings** aziendali richiedono conferma
  a ogni edit/create di `.ps1`/`.sh` → iterazione lenta; l'invoker sarà probabilmente **JS/TS**;
  Node v24 è presente; un `.mjs` è minimale quanto un `.ps1` ma senza quell'attrito ed è
  importabile nativamente da JS/TS. Decisione presa con l'utente.

Layout:

```
tools/askclaude/
  askclaude.mjs     # il tool: modulo ESM (export askClaude) + entrypoint CLI, stesso file
  package.json      # { "type": "module", "bin": { "askclaude": "./askclaude.mjs" } }, zero deps
  README.md         # contratto + snippet Python / PowerShell / JS-TS
```

Sta nel tree di **prodotto**, non in `.claude/` (è un tool di build, non una skill).

---

## 4. Contratto

### 4.1 Richiesta — un oggetto JSON su **stdin**

```json
{
  "prompt": "string (OBBLIGATORIO)",
  "system": "system prompt completo (opz., REPLACE del default)",
  "images": [
    { "path": "C:/percorso/shot.png" },
    { "base64": "<...>", "mediaType": "image/png" }
  ],
  "json": true,
  "schema": { "type": "object", "properties": { "...": {} }, "required": [] },
  "model": "opus | sonnet | fable | <nome-completo> (opz.)",
  "timeoutMs": 60000,
  "retries": 1,
  "extraArgs": ["--restricted"],
  "cwd": "directory neutra (opz.)"
}
```

- `prompt` è l'unico obbligatorio. `json` default `true`. `images` assente/vuoto ⇒ transport testo.
- `schema` è un **JSON Schema reale** (non un hint): se presente ⇒ passato a `--json-schema`.
- `images[].path` ⇒ il wrapper legge il file, base64-encode, deduce `mediaType` dall'estensione
  (`.png`→image/png, `.jpg`/`.jpeg`→image/jpeg, `.gif`→image/gif, `.webp`→image/webp);
  in alternativa `base64`+`mediaType` inline.

### 4.2 Risposta — un envelope JSON su **stdout** (successo *e* errore)

```json
{ "ok": true,  "data": { }, "text": "grezzo", "meta": { "mode": "json", "schemaEnforced": true, "retriedRepair": false, "model": "…", "durationMs": 1234, "sessionId": "…", "costUsd": 0.01 } }
```
```json
{ "ok": false, "error": { "type": "usage|spawn|timeout|cli|parse", "message": "…", "raw": "…" } }
```

- **Envelope su stdout sempre**, così ogni linguaggio parsa in modo uniforme.
- `data` valorizzato solo con `json:true`; `text` sempre (output grezzo del modello).
- Errore umano breve mirrorato anche su **stderr**.

**Exit code:** `0` ok · `1` errore d'uso (richiesta malformata) · `2` cli/spawn/timeout ·
`3` JSON non parsabile dopo repair.

### 4.3 API import (JS/TS, senza subprocess)

```js
import { askClaude } from "./tools/askclaude/askclaude.mjs";
const r = await askClaude({ prompt, json: true, schema });
if (!r.ok) throw new Error(r.error.message);
usa(r.data);
```

La CLI è un thin wrapper sopra la stessa funzione `askClaude(request) -> envelope`.

### 4.4 Uso da altri linguaggi (subprocess)

- **PowerShell:** `$req | ConvertTo-Json -Depth 20 | node tools/askclaude/askclaude.mjs | ConvertFrom-Json`
- **Python:** `subprocess.run(["node", path], input=json.dumps(req), text=True, capture_output=True)` → `json.loads(out.stdout)`

---

## 5. Comportamento

### 5.1 Matrice transport × strategia JSON (un contratto, due transport nascosti)

| Il chiamante manda | Transport CLI interno | Strategia JSON |
|---|---|---|
| testo + `schema` | `--output-format json --json-schema <schema>` | **enforce nativo** della CLI, poi parse |
| testo + `json` senza `schema` | `--output-format json` + system "solo JSON valido" | estrai oggetto + **repair** (`retries`) |
| testo + `json:false` | `--output-format json` | ritorna la risposta come `text` |
| con `images` | `--input-format stream-json --output-format stream-json --verbose` + content-block | enforce nativo se supportato lì, altrimenti estrai+repair |

### 5.2 Flag d'igiene sempre presenti (chiamata di prodotto pulita)

`-p` · `--tools ""` (nessun tool: niente Bash/Edit/Read lato-modello) ·
`--no-session-persistence` (niente file di sessione su disco) ·
`--permission-prompts none` (l'headless non si blocca mai su un prompt) ·
`--system-prompt <system>` se fornito (**replace**, così non trapela il nostro `CLAUDE.md`) ·
**cwd neutra** di default = **temp dir dell'OS** (`os.tmpdir()`), così non si auto-carica il
`CLAUDE.md` **di progetto**; per isolamento totale (anche user-level `~/.claude`, hook, plugin)
aggiungere `--safe-mode` o `--bare` via `extraArgs` ·
`--model` se fornito · `extraArgs` in coda.

Il **prompt** è passato a `claude` via **stdin** (non come argomento) in ogni modalità → nessun
limite di lunghezza né escaping.

### 5.3 Immagini (content-block + stream-json)

Quando `images` è non vuoto, il wrapper costruisce **un** messaggio utente stream-json:

```json
{ "type": "user", "message": { "role": "user", "content": [
  { "type": "text", "text": "<prompt>" },
  { "type": "image", "source": { "type": "base64", "media_type": "image/png", "data": "<base64>" } }
] } }
```

lo scrive come **una riga JSON** sullo stdin di `claude`, chiude lo stdin, poi legge lo
**stdout JSONL a eventi** e cerca l'evento terminale `{"type":"result", …}` per estrarne la
risposta. Da lì la strategia JSON è la stessa di 5.1. (`--verbose` è incluso in via difensiva:
alcune versioni della CLI lo richiedono con `--output-format stream-json` — vedi §8.)

### 5.4 Auto-repair (solo fallback, quando manca `schema`)

Se `json:true` **senza** `schema` e il parse fallisce: 1 tentativo di repair (default
`retries:1`) ri-promptando "restituisci **solo** JSON valido". Con `schema` presente ci si
affida a `--json-schema` e il repair è normalmente superfluo. Estrazione tollerante: rimozione
fence ```` ```json ````, individuazione del primo `{…}`/`[…]` bilanciato.

### 5.5 `extraArgs` (escape hatch)

Lista di flag inoltrati **verbatim** a `claude` in coda al comando. Sblocca qualsiasi capability
non modellata (`--restricted`, `--permission-mode`, `--add-dir`, `--append-system-prompt`,
`--fallback-model`, `--max-budget-usd`, `--input-format stream-json` custom, …) **senza toccare
il wrapper**. Documentare come "usare con parsimonia".

---

## 6. Modello degli errori

| `error.type` | Quando | Exit |
|---|---|---|
| `usage` | richiesta JSON malformata / `prompt` mancante | 1 |
| `spawn` | `claude` non trovato / impossibile avviare il processo | 2 |
| `timeout` | superato `timeoutMs` → processo ucciso | 2 |
| `cli` | `claude` esce non-zero, o envelope `is_error`/`subtype` d'errore (stderr in `raw`) | 2 |
| `parse` | `json:true` ma output non parsabile dopo repair (testo grezzo in `raw`) | 3 |

In ogni caso l'envelope `{"ok":false,…}` è emesso su stdout (+ riga umana su stderr).

---

## 7. Testing e offline (stub-bin)

- **`ASKCLAUDE_CLAUDE_BIN`**: env var che sostituisce il comando `claude` con uno **stub** locale.
  Lo stub emette un envelope canned (mode `json`) **o** un JSONL canned (mode `stream-json`).
- Abilita **test deterministici e offline** di: costruzione content-block immagini, parsing JSONL,
  branching schema/no-schema, estrazione+repair, mappatura errori/exit-code, timeout — **senza
  bruciare inferenza né rete**.
- Serve anche a **cannare** output LLM per la **demo 90s offline** (requisito CLAUDE.md).
- **Una sola smoke reale** contro `claude` vero fissa le incognite di §8 (unico test che costa
  inferenza + rete).

---

## 8. Incognite da verificare per prime (build, step 1)

Richiedono UNA chiamata reale a `claude`:

1. Campo esatto dell'envelope `--output-format json` che contiene la risposta (atteso `result`)
   e se, con `--json-schema`, l'oggetto arriva come **stringa JSON** in `result` o già strutturato.
2. Se `--json-schema` si combina con `--input-format stream-json` (caso immagini + schema) e se
   `--output-format stream-json` richiede `--verbose` in questa versione della CLI.

Gli esiti si riflettono nel parsing; il resto del design non cambia.

---

## 9. Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| **#1 "Inferenza offline" il giorno** — `claude -p` normalmente usa la rete per il modello | Non dipende dal wrapper e non è peggiorato da lui; lo stub-bin copre demo/test offline. Da verificare nell'ambiente d'hackathon. |
| Formato envelope / combinazioni `--json-schema` diversi dall'atteso | §8: smoke reale come primo passo del build; parsing adattato lì. |
| Parte immagini inutilizzata dall'idea scelta | Il nucleo testo/JSON paga a prescindere; l'immagine è additiva e isolata (nessun costo sul percorso testo). |
| Wrapper mezzo-testato → costa tempo il giorno | TDD con stub-bin: logica pura coperta offline prima della giornata. |

---

## 10. Piano di build (TDD)

1. **Smoke reale** contro `claude` per fissare le 2 incognite di §8 (envelope + combinazioni).
2. **Stub-bin + test offline** sulla logica pura (envelope canned / JSONL canned): tutti i rami di §5–§6.
3. **`askclaude.mjs`** (modulo + CLI) fino a far passare i test.
4. **README** con i tre snippet (Python / PowerShell / JS-TS) e la nota "`extraArgs` con parsimonia".
