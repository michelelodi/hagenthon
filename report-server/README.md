# report-server

Bridge locale tra la webapp (statica, offline) e il wrapper [`tools/askclaude`](../tools/askclaude).
Genera il **report AI** in linguaggio naturale sulle finanze della famiglia.

## Cos'è e cosa NON è

- **Insight deterministici** (spese > entrate, categorie in crescita, anomalie, top categoria, tasso di
  risparmio) → calcolati **client-side** in [`analysis.js`](../ui-output_20260922_1132_md3/analysis.js),
  **istantanei e offline**. Vivono nella card "Analisi" della dashboard e **non** dipendono da questo server.
- **Report testuale AI** → è un **extra online**: la webapp POSTa qui le metriche già calcolate, il server
  costruisce il prompt e chiama Claude via `askclaude`. La **demo dei 90s resta offline** e usa solo gli
  insight deterministici.

Vedi [ADR-0002](../docs/adr/0002-report-ai-opzionale-via-askclaude.md).

## Avvio

```bash
node report-server/server.mjs
```

- Porta `3002` (override con `PORT`).
- Zero dipendenze: solo built-in Node + `tools/askclaude` (a sua volta zero-dep).
- Usa il CLI `claude` (login/subscription dell'utente).

## Endpoint

| Metodo | Path      | Body                  | Risposta |
|--------|-----------|-----------------------|----------|
| `GET`  | `/health` | —                     | `{ ok: true }` |
| `POST` | `/report` | `{ "analysis": {…} }` | `{ ok: true, report: "…", meta } ` oppure `{ ok:false, error }` |

`analysis` è l'oggetto restituito da `analizza()` in `analysis.js`.

## Test offline (deterministico, senza rete)

Punta askclaude allo stub incluso e fornisci l'output finto:

```bash
export ASKCLAUDE_CLAUDE_BIN="$(pwd)/tools/askclaude/test/stub-bin.mjs"
export ASKCLAUDE_STUB_STDOUT='{"result":"Report di prova.","subtype":"success"}'
node report-server/server.mjs
# poi:
curl -s -X POST http://localhost:3002/report -H 'Content-Type: application/json' \
  -d '{"analysis":{"periodo":"mese","entrate":1600,"uscite":1642,"netto":-42}}'
```

Se il server non è avviato, la webapp mostra un messaggio non bloccante e continua a
funzionare con i soli insight deterministici.
