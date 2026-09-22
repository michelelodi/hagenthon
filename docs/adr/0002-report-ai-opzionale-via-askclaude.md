---
status: accepted
supersedes-in-part: 0001
---

# Report AI opzionale sulle finanze, via askclaude (extra online)

## Contesto
[ADR-0001](0001-webapp-tradizionale-senza-llm.md) aveva deciso una webapp **senza LLM a runtime**, con
`tools/askclaude/` **inutilizzato dal prodotto**. Su richiesta esplicita dell'utente serve però un'**analisi
dei dati** con un **report leggibile** che aiuti la famiglia a capire come gestisce il denaro (es. "spendi più
di quanto incassi", "le bollette sono in aumento"), in **tempo reale**.

## Decisione
Introdurre l'analisi in **due livelli**, per soddisfare la richiesta senza rompere il vincolo "demo 100% offline":

1. **Insight deterministici (sempre attivi, offline, real-time).** `ui-output_.../analysis.js` calcola
   client-side, a ogni cambiamento dei dati, metriche e segnali: spese > entrate, categorie in crescita
   mese-su-mese, anomalie di spesa, top categoria, tasso di risparmio. Mostrati nella card **"Analisi"** della
   dashboard. Nessuna rete.
2. **Report AI in linguaggio naturale (extra online, on-demand).** Un pulsante "Genera report AI" invia le
   metriche a un bridge locale **`report-server/`** che le passa a Claude via **`tools/askclaude`**. Questo
   **riattiva `askclaude` nel prodotto**, in deroga ad ADR-0001, ma **solo** come extra opzionale.

## Conseguenze
- **ADR-0001 è superato in parte**: `tools/askclaude/` **è ora usato dal prodotto** per il report AI. Il
  confine "SENZA LLM a runtime" vale ancora per il *core* del flusso (login → conti → movimenti → dashboard →
  insight), che resta 100% offline.
- **La demo dei 90s resta offline**: usa solo gli insight deterministici; il report AI è un di più che
  richiede rete/`claude` e degrada con grazia se `report-server` non è avviato.
- **Niente consulenza professionale personalizzata** (confine CLAUDE.md rispettato): il system prompt del
  report impone tono descrittivo e suggerimenti di buon senso, non consulenza finanziaria.
- Nuovi artefatti: `analysis.js` (+ test), `report-server/` (bridge zero-dipendenze). CLAUDE.md aggiornato
  per non dire più che `askclaude` è inutilizzato.
