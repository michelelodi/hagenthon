# Bot Telegram — Scontrini

Bot che riceve foto di scontrini, le analizza con Claude Vision e le espone alla webapp come movimenti pronti da importare.

## Setup (5 minuti)

### 1. Crea il bot Telegram
1. Apri Telegram e cerca `@BotFather`
2. Scrivi `/newbot`
3. Scegli un nome (es. "Finanze Famiglia Bot") e uno username (es. `finanzeXXXXX_bot`)
4. BotFather ti darà un **token** come `1234567890:AAxxxxxx` — copialo

### 2. Ottieni la Claude API key
1. Vai su https://console.anthropic.com/
2. Accedi o crea un account
3. Menu → **API Keys** → **Create Key** — copiala

### 3. Configura il bot
```bash
cd hagenthon/bot
cp .env.example .env
# Apri .env e incolla TELEGRAM_BOT_TOKEN e ANTHROPIC_API_KEY
```

### 4. Installa e avvia
```bash
npm install
npm start
```

## Comandi Telegram
- Invia una **foto** → analisi automatica dello scontrino
- `/start` → messaggio di benvenuto
- `/pending` → lista spese in attesa

## Come funziona
1. Mandi la foto al bot su Telegram
2. Il bot scarica la foto, la invia a Claude Vision API
3. Claude estrae: importo, descrizione, data, categoria
4. La spesa viene salvata in `pending-expenses.json`
5. Il bot serve anche un'API su `localhost:3001`
6. La webapp fa polling su `GET /pending` e mostra il banner
7. Clicchi "Importa da Telegram" nella webapp → rivedi, modifica, conferma
