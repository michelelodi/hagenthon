# 02: Login gate + navigation guard

**What to build:** l'utente apre `login.html`, inserisce la password, e se è corretta accede all'app. Se visita qualsiasi altra pagina senza essere loggato, viene rimandato a `login.html`. Il logout non esiste nel MVP (si chiude il browser).

**Blocked by:** 01 — Storage layer.

**Status:** ready-for-agent

- [ ] `login.html`: al submit del form, confronta la password inserita con quella in `ff_auth.password` (default hardcoded: `"famiglia2026"` se la chiave non esiste ancora); se corretta, imposta `ff_auth.loggedIn = true` e naviga a `home.html`; se errata, mostra messaggio di errore inline senza ricaricare la pagina
- [ ] Guard da inserire all'inizio di ogni HTML (eccetto `login.html`): se `ff_auth.loggedIn !== true` → `window.location.replace("login.html")`; il guard deve essere un blocco `<script>` sincrono nel `<head>`, prima del resto del body, per evitare flash di contenuto
- [ ] La password di default `"famiglia2026"` viene scritta in `ff_auth` da `seedDemo()` (ticket 07) ma il guard deve funzionare anche senza seed, usando il fallback hardcoded
- [ ] Dopo login con successo, il focus deve andare al contenuto principale (accessibilità)
