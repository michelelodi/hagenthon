# Bot Telegram — Scontrini

Bot che riceve foto di scontrini, le legge con **Claude via `tools/askclaude/`** (il CLI
`claude` locale — **nessuna API key**) e le espone alla webapp, che le **registra da sé**.

## Prerequisiti
- Node 18+
- Il CLI `claude` installato e **loggato** (è quello di Claude Code). Verifica: `claude --version`.

## Setup

### 1. Crea il bot Telegram
1. Apri Telegram e cerca `@BotFather`
2. Scrivi `/newbot`, scegli un nome e uno username
3. Copia il **token** `1234567890:AA...`

### 2. Configura
```bash
cd hagenthon/bot
cp .env.example .env      # incolla TELEGRAM_BOT_TOKEN
```
Non serve nessuna chiave Anthropic: l'inferenza passa dal CLI `claude` già loggato.

### 3. Installa e avvia
```bash
npm install
npm start
```

## Comandi Telegram
- Invia una **foto** → lettura automatica + registrazione nella webapp
- `/start` → benvenuto
- `/pending` → spese in coda
- `/cancella <id>` → rimuove una voce dalla coda

## Come funziona
1. Mandi la foto al bot su Telegram
2. Il bot la passa a `askClaude({ images, schema })` → CLI `claude` locale (no API key)
3. Claude estrae importo, descrizione, data, categoria (+ `fiducia`), con schema imposto
4. La spesa va in `pending-expenses.json`; il bot serve `GET /pending` su `localhost:3001`
5. La webapp aperta fa polling e **registra da sé** il movimento (`telegram-autoimport.js`),
   poi la dashboard si aggiorna. Nessun click.

## Demo senza rete
Due opzioni:
- **Pre-carica** `pending-expenses.json` con una voce: la webapp la importa senza alcuna inferenza.
- **Stub del CLI**: `ASKCLAUDE_CLAUDE_BIN=../tools/askclaude/test/stub-bin.mjs` con risposta
  registrata (vedi `tools/askclaude/README.md`) → lettura deterministica e offline.
