# Finanze Personali

Contesto di una **webapp monoutente per tracciare le finanze personali**: conti, entrate/uscite categorizzate, dashboard per categoria e per periodo. Solo frontend, dati in `localStorage`, offline. Nessun LLM (→ `docs/adr/0001-webapp-tradizionale-senza-llm.md`).

## Language

**Utente**:
L'unica persona che accede all'app con password (gate client-side, non sicurezza reale). Monoutente.
_Avoid_: account, profilo

**Conto**:
Un contenitore di denaro dell'Utente (corrente, contanti, carta…) con un nome, un Saldo iniziale e un Saldo corrente. L'Utente può avere più Conti.
_Avoid_: account (che qui è il login), portafoglio

**Movimento**:
Una singola Entrata o Uscita registrata su **un** Conto, con importo, data e Categoria.
_Avoid_: transazione, operazione, spesa (troppo stretto)

**Entrata / Uscita**:
Il `tipo` di un Movimento: denaro che entra nel Conto / che ne esce. Non esiste il giroconto (un trasferimento si registra come un'Uscita + un'Entrata).
_Avoid_: incasso/pagamento, credito/debito

**Categoria**:
Etichetta di classificazione di un Movimento, presa da una **lista fissa** (seed, flat). Ogni Categoria appartiene a Entrata **o** a Uscita.
_Avoid_: tag, etichetta

**Saldo iniziale**:
Il Saldo di un Conto al momento della creazione. Valore di input, persistito.

**Saldo**:
Il denaro attualmente su un Conto = `Saldo iniziale + Σ Entrate − Σ Uscite`. È un campo **memorizzato**, **riscritto dal valore derivato a ogni mutazione** dei Movimenti (per non andare in drift).
_Avoid_: bilancio, disponibilità, totale

**Periodo**:
L'intervallo **solare** su cui la dashboard aggrega: un **mese**, un **trimestre** o un **anno** di calendario.
_Avoid_: intervallo mobile, "ultimi N giorni"
