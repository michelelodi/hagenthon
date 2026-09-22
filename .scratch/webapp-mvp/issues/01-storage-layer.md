# 01: Storage layer

**What to build:** un file `storage.js` condiviso da tutte le schermate che permette all'app di leggere e scrivere dati in localStorage in modo coerente. Qualsiasi schermata che lo importa può creare un conto, aggiungere un movimento e leggere il saldo aggiornato senza sapere nulla di localStorage.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Schema localStorage definito: chiave `ff_conti` (array di Conto), chiave `ff_movimenti` (array di Movimento), chiave `ff_auth` (oggetto `{ password, loggedIn }`)
- [ ] Ogni Conto ha: `id` (uuid v4 o `crypto.randomUUID()`), `nome`, `saldoIniziale`, `saldo`, `createdAt`
- [ ] Ogni Movimento ha: `id`, `contoId`, `tipo` (`entrata`|`uscita`), `importo` (float), `data` (ISO date string), `categoria`, `descrizione` (opzionale), `fonte` (`manuale`|`telegram`), `createdAt`
- [ ] `getConto(id)`, `getConti()`, `createConto({ nome, saldoIniziale })` → ricalcola `saldo`
- [ ] `getMovimenti(contoId?)`, `createMovimento({ contoId, tipo, importo, data, categoria, descrizione?, fonte? })` → aggiorna `conto.saldo` dopo l'inserimento
- [ ] `deleteMovimento(id)` → aggiorna `conto.saldo`
- [ ] `saldoCalcolato(contoId)` → valore derivato da saldoIniziale + movimenti (usato come verifica/reset)
- [ ] `seedDemo()` → popola localStorage con scenario Sara & Marco: 1 conto "Conto Famiglia", ~15 movimenti realistici su categorie miste negli ultimi 3 mesi (per render dashboard non vuota)
- [ ] `clearAll()` → svuota tutto (utile per reset demo)
- [ ] File salvato come `ui-output_20260922_1132_md3/storage.js`, caricabile con `<script src="../storage.js">` o `<script src="storage.js">` da ogni HTML
