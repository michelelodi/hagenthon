# 05: Dashboard

**What to build:** l'utente vede una dashboard con il totale speso nel periodo selezionato, la ripartizione per categoria su un donut chart e il confronto entrate/uscite. Il periodo è selezionabile tra mese corrente, trimestre corrente e anno corrente.

**Blocked by:** 04 — Movimenti lista e inserimento.

**Status:** ready-for-agent

- [ ] `dashboard.html`: al caricamento legge tutti i movimenti da `getMovimenti()`, filtra per periodo attivo (default: mese corrente), aggrega per categoria
- [ ] Segmented button Mese/Trimestre/Anno aggiorna il filtro e ridisegna il chart senza ricaricare la pagina
- [ ] Il filter chip "Tutti i conti" è non-interattivo nel MVP (mostra sempre tutti i conti); tenerlo visibile ma disabilitato
- [ ] Donut chart (Chart.js già caricato nell'HTML): dataset = importo totale per categoria (solo uscite); colori per categoria coerenti tra chart e legenda; se nessun movimento nel periodo → mostra `dashboard-empty.html` o svuota il chart e mostra il messaggio empty state inline
- [ ] Il testo centrale del donut mostra: riga 1 "Totale" (label MD3 small), riga 2 importo totale uscite formattato in € — reso via overlay HTML `.chart-donut-center` (il `centerTextPlugin` Chart.js è già stato rimosso nella sessione precedente)
- [ ] Sotto il chart: riga riepilogativa con totale Entrate (verde) e totale Uscite (rosso) nel periodo
- [ ] `dashboard-empty.html`: attivato quando `getMovimenti()` filtrati per periodo = 0; il pulsante "Aggiungi un movimento" naviga a `home.html`
- [ ] Periodo "mese corrente" = dal 1° del mese in corso a oggi; "trimestre" = dal 1° del trimestre solare in corso; "anno" = dall'1/1 dell'anno in corso
