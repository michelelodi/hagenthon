# 06: Importa da Telegram

**What to build:** l'utente apre la schermata "Importa da Telegram", vede le spese in attesa scansionate dal bot (tramite foto scontrino), e può confermare o rifiutare ciascuna. Le spese confermate diventano Movimenti nel conto selezionato.

**Blocked by:** 04 — Movimenti lista e inserimento.

**Status:** ready-for-agent

- [ ] `importa-telegram.html`: al caricamento fa `fetch('http://localhost:3001/pending')` con timeout 3s; se il bot non risponde mostra un banner "Bot non raggiungibile — avvia `bot/bot.js`" e continua senza bloccare la navigazione
- [ ] La lista mostra per ogni spesa in attesa: descrizione, importo, categoria, data, badge fiducia (✅ ≥ 0.8, ⚠️ ≥ 0.5, ❓ < 0.5)
- [ ] Ogni riga ha due azioni: "Importa" e "Ignora"
  - "Importa": apre un mini-form inline (o modal) per scegliere il conto di destinazione (select popolato con `getConti()`); al conferma chiama `createMovimento({ contoId, tipo: 'uscita', importo, data, categoria, fonte: 'telegram' })` poi `DELETE http://localhost:3001/pending/<id>`; aggiorna la lista
  - "Ignora": chiama solo `DELETE http://localhost:3001/pending/<id>`; rimuove la riga
- [ ] Se la lista è vuota (o dopo aver processato tutto) mostra messaggio "Nessuna spesa in attesa"
- [ ] Link alla schermata da `home.html` (bottom sheet o voce aggiuntiva nella nav bar — scegliere la soluzione meno invasiva per il prototipo)
