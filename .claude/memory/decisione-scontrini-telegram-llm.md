---
name: decisione-scontrini-telegram-llm
tipo: decisione
---

**Deciso il 22/09/2026:** aggiunto canale opzionale di inserimento — un bot Telegram legge lo scontrino con **Claude Vision via `tools/askclaude/`** (CLI `claude` locale, **nessuna API key**) ed espone la spesa su `localhost:3001`; la webapp la **registra da sé** in localStorage (`telegram-autoimport.js`, auto-import senza click) e la dashboard si aggiorna. Chiude il loop foto → movimento. **Supera in parte** [[decisione-no-llm-webapp-tradizionale]] (confini "senza LLM"/"nessuna rete"), solo per questo canale; il resto resta FE-only offline. `tools/askclaude/` non è più inutilizzato. Dettagli in `docs/adr/0002-scontrini-telegram-llm.md`. Richiede `claude` installato/loggato + `TELEGRAM_BOT_TOKEN` in `bot/.env`. Riguarda [[idea-finanze-personali-webapp]].
