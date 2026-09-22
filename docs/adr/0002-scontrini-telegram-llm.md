---
status: accepted
---

# Cattura scontrini via Telegram con LLM a runtime (tramite askclaude)

## Contesto
[ADR-0001](0001-webapp-tradizionale-senza-llm.md) aveva scelto una webapp *senza LLM a runtime*, solo FE + `localStorage`, demo 100% offline, e considerava `tools/askclaude/` **inutilizzato**. Ma la barriera reale della persona (Sara & Marco) resta l'**onere dell'inserimento manuale** dei movimenti — proprio l'asse di valore a cui ADR-0001 aveva rinunciato.

## Decisione
Aggiungiamo un canale **opzionale** di inserimento: un **bot Telegram** (`bot/`) riceve la foto di uno scontrino e la legge con **Claude Vision a runtime tramite `tools/askclaude/`** (il CLI `claude` locale, **senza API key**). La spesa estratta è esposta via API locale (`localhost:3001`); la webapp, quando è aperta, la **registra da sé** in `localStorage` (`telegram-autoimport.js`) senza conferma manuale, e la dashboard si aggiorna in tempo reale.

Questo **supera in parte** ADR-0001 (confini "senza LLM a runtime" e "nessuna rete") **limitatamente a questo canale**. Il flusso core (login → conti → movimenti → dashboard) resta FE-only e gira 100% offline se il bot è spento.

## Conseguenze
- Recuperiamo i due assi persi da ADR-0001: **LLM nel prodotto** e **loop fino all'azione** (foto → movimento registrato, senza tocco a tastiera).
- L'inferenza passa da **`tools/askclaude/`** → CLI `claude` locale: **nessuna API key** (usa l'auth di Claude Code). Serve `claude` installato e loggato + rete per l'inferenza live. Di conseguenza `tools/askclaude/` **non è più inutilizzato**: è il canale LLM del prodotto (la nota in `CLAUDE.md`/ADR-0001 va aggiornata).
- Unica variabile in `bot/.env`: `TELEGRAM_BOT_TOKEN` (git-ignored). L'estrazione usa uno **schema JSON imposto** (`--json-schema`) con `categoria` vincolata alle categorie della webapp.
- "Semplificare senza tradire": una lettura errata di importo/categoria entrerebbe nei conti senza revisione. Mitigazione: `MIN_FIDUCIA` in `telegram-autoimport.js` (default 0 = importa tutto; a 0.8 le letture incerte restano alla revisione manuale su `importa-telegram.html`).
- Demo senza rete: pre-caricare `bot/pending-expenses.json` (nessuna inferenza), oppure puntare `ASKCLAUDE_CLAUDE_BIN` allo stub a risposte registrate → deterministico e **offline**.
- Idempotenza: gli id già importati sono tracciati in `localStorage.ff_tg_importati` per evitare duplicati anche se la `DELETE /pending/:id` fallisce.
- Per la webapp serve un'origine `http://` (es. `python -m http.server`): da `file://` la fetch verso `localhost:3001` è meno affidabile.
