# 04: Movimenti — lista e inserimento

**What to build:** l'utente apre il dettaglio di un conto, vede i movimenti in ordine cronologico inverso con saldo aggiornato, e può aggiungere un nuovo movimento con tipo, importo, data e categoria.

**Blocked by:** 03 — Conti lista e creazione.

**Status:** ready-for-agent

- [ ] `dettaglio-conto.html` e `dettaglio-conto-empty.html`: leggono `id` da `URLSearchParams`; caricano il conto e i suoi movimenti; se movimenti vuoti mostrano l'empty state, altrimenti la lista
- [ ] Lista movimenti: ogni riga mostra data (formato `dd/mm/yyyy`), categoria, descrizione (se presente), importo con segno (+ verde per entrate, − rosso per uscite), formattato in €
- [ ] Header mostra nome conto + saldo corrente aggiornato
- [ ] Il pulsante "Nuovo movimento" naviga a `nuovo-movimento.html?contoId=<id>`
- [ ] `nuovo-movimento.html`: legge `contoId` da URL; il campo "Categoria" è un `<select>` popolato dinamicamente con le categorie fisse filtrate per tipo (entrata o uscita); la lista categorie è definita in `storage.js`
- [ ] Categorie Uscita: `Casa`, `Spesa`, `Ristoranti`, `Trasporti`, `Salute`, `Abbigliamento`, `Svago`, `Istruzione`, `Abbonamenti`, `Altro`
- [ ] Categorie Entrata: `Stipendio`, `Freelance`, `Regalo`, `Rimborso`, `Altro`
- [ ] Submit chiama `createMovimento(...)`, aggiorna saldo, naviga a `dettaglio-conto.html?id=<contoId>`
- [ ] La data di default nel form è oggi (`new Date().toISOString().slice(0, 10)`)
- [ ] Validazione: importo > 0, data non futura oltre 1 anno, tipo e categoria obbligatori
