---
status: accepted
superseded-in-part-by: 0002
---

# Webapp tradizionale di finanze personali, senza LLM a runtime

> ⚠️ **Aggiornamento — [ADR-0002](0002-scontrini-telegram-llm.md).** È stato aggiunto un canale opzionale di cattura scontrini via Telegram che usa un **LLM a runtime** (tramite `tools/askclaude/`, il CLI `claude` locale — nessuna API key) **+ rete**. Questo **supera in parte** i confini "senza LLM" e "nessuna rete" qui sotto, e rende `tools/askclaude/` **usato** dal prodotto. Il resto della webapp resta FE-only e offline.

## Contesto
Hackathon Hagenthon (Accenture, ~5h). Il perimetro [CLAUDE.md](../../CLAUDE.md) poneva come confine non negoziabile #1 un **LLM integrato nel prodotto a runtime** (via `tools/askclaude/`) con chiusura del loop fino a un'azione. In questo ambiente **non esiste un modello locale**: l'inferenza reale della CLI `claude` richiede rete e l'"offline" è ottenibile solo con lo stub a risposte registrate (vedi `docs/superpowers/specs/2026-09-22-askclaude-wrapper-design.md`, Rischio #1).

## Decisione
Il team costruisce una **webapp tradizionale di gestione finanze personali**, **senza alcun LLM a runtime** (né ora né in futuro), **solo frontend + `localStorage`**, che gira 100% offline nel browser. Persona: **Sara & Marco** (famiglia, un conto familiare); barriera = onere dell'inserimento manuale.

## Alternative considerate
- **LLM a runtime** (ingestione linguaggio naturale → movimenti categorizzati; insight → azione): soddisfaceva il confine #1 e la barriera della persona, ma richiedeva rete a dev-time e output registrati in demo. Scartata per scelta esplicita del team.
- **Spine ora + LLM in "fase 2"**: scartata — la fase 2 rischia di non arrivare e, per questa persona, l'LLM *è* il valore.

## Conseguenze
- Rinuncia consapevole ai due assi su cui l'hackathon pesa la "qualità della costruzione agentica" (LLM nel prodotto; loop fino all'azione). Restano in gioco **idea** e **presentazione**.
- Il confine #1 di CLAUDE.md è **superato da questo ADR**; il file è aggiornato di conseguenza.
- `tools/askclaude/` resta **inutilizzato** dal prodotto.
- FE-only + `localStorage`: il "login con password" è un **gate client-side** (non sicurezza reale); i dati vivono in quel browser. Limiti noti, accettati per una demo locale.
- **Saldo memorizzato** sul conto (scelta del team): il campo `saldo` è **riscritto dal valore derivato a ogni mutazione** dei movimenti, per evitare drift.
