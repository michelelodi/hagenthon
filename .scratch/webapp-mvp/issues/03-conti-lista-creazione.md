# 03: Conti — lista e creazione

**What to build:** l'utente vede la lista dei suoi conti con il saldo aggiornato, può creare un nuovo conto e viene indirizzato al dettaglio appena creato.

**Blocked by:** 01 — Storage layer, 02 — Login gate.

**Status:** ready-for-agent

- [ ] `home.html`: al caricamento legge `getConti()` e renderizza dinamicamente le card; se la lista è vuota mostra l'empty state (già presente nell'HTML statico come `home-empty.html` — attivare/disattivare via JS o reindirizzare)
- [ ] Ogni card mostra nome conto e saldo formattato in € (es. `€ 1.234,56`); click sulla card naviga a `dettaglio-conto.html?id=<contoId>`
- [ ] `nuovo-conto.html`: submit del form chiama `createConto({ nome, saldoIniziale })`; se il nome è vuoto o il saldo iniziale non è un numero valido mostra errore inline; al successo naviga a `dettaglio-conto.html?id=<nuovoContoId>`
- [ ] Il pulsante "Annulla" in `nuovo-conto.html` naviga a `home.html` senza salvare
- [ ] Formato valuta: euro con separatore decimale virgola e separatore migliaia punto (es. `1.234,56`) — usare `Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })`
