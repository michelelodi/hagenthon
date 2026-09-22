# 07: Demo seed + test e2e

**What to build:** la webapp parte già con dati realistici di Sara & Marco pronti per la demo live da 90s. Il flusso login → conto → movimenti → dashboard funziona end-to-end senza dati extra da inserire.

**Blocked by:** 05 — Dashboard, 06 — Importa da Telegram.

**Status:** ready-for-agent

- [ ] `seedDemo()` in `storage.js` (implementata nel ticket 01) viene chiamata automaticamente se `ff_conti` è assente al primo caricamento di `login.html`; in alternativa, un pulsante nascosto "Carica demo" in `login.html` richiama `seedDemo()` manualmente (utile per reset rapido durante la demo)
- [ ] Scenario seed: 1 conto "Conto Famiglia", saldo iniziale €2.000; ~15 movimenti distribuiti su luglio–settembre 2026; categorie miste (Spesa, Ristoranti, Trasporti, Casa, Stipendio); importi realistici per una famiglia italiana
- [ ] La password demo è `"famiglia2026"` (già in `ff_auth` dopo il seed)
- [ ] Test manuale del flusso e2e: login → home (vedo il conto con saldo reale) → dettaglio conto (vedo i movimenti) → nuovo movimento (aggiungo una spesa) → dashboard (il chart si aggiorna con la nuova spesa) → importa da telegram (opzionale se il bot è avviato)
- [ ] Nessun errore in console durante il flusso e2e
- [ ] La dashboard nel periodo "Settembre 2026" mostra dati non vuoti con il seed
- [ ] Verificare che il saldo del conto sia coerente con saldoIniziale + somma movimenti seed
