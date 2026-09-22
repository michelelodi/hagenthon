/*
 * telegram-autoimport.js — registra AUTOMATICAMENTE in localStorage i movimenti
 * che il bot Telegram ha estratto dagli scontrini, senza conferma manuale.
 *
 * Perché vive qui e non nel bot: i movimenti stanno nel localStorage del browser,
 * e un processo Node (il bot) non può scriverci. Questo poller sta nella webapp:
 * interroga l'API locale del bot (GET /pending), scrive ogni voce con
 * createMovimento() e la toglie dalla coda (DELETE /pending/:id). A ogni import
 * emette l'evento window 'telegram:imported' così la pagina si ridisegna.
 *
 * Caricalo DOPO storage.js, sulle pagine "vive" (home, dashboard).
 * Se il bot è spento è silenzioso: la webapp resta 100% offline (vedi ADR-0002).
 */
(function () {
  'use strict';

  var BOT_API = 'http://localhost:3001';
  var POLL_MS = 4000;

  // Soglia di fiducia per l'import automatico. 0 = importa tutto.
  // Alza a 0.8 per registrare da solo solo le letture affidabili e lasciare
  // le altre alla revisione manuale su importa-telegram.html.
  var MIN_FIDUCIA = 0;

  // Id già importati: idempotenza anti-duplicati anche se la DELETE fallisce.
  var SEEN_KEY = 'ff_tg_importati';

  function seen() {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || []; }
    catch (e) { return []; }
  }
  function markSeen(id) {
    var s = seen();
    if (s.indexOf(id) === -1) { s.push(id); localStorage.setItem(SEEN_KEY, JSON.stringify(s)); }
  }

  // Sincronizza i conti al bot così l'utente può sceglierli su Telegram.
  var contiSig = '';
  async function syncConti(conti) {
    var sig = conti.map(function (c) { return c.id + ':' + c.nome; }).join('|');
    if (sig === contiSig) return;                 // invia solo quando cambia
    try {
      await fetch(BOT_API + '/conti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conti.map(function (c) { return { id: c.id, nome: c.nome }; })),
        signal: AbortSignal.timeout(3000)
      });
      contiSig = sig;
    } catch (e) { /* bot spento → riprova al prossimo giro */ }
  }

  async function poll() {
    // storage.js deve essere caricato e deve esistere un conto in cui registrare.
    if (typeof getConti !== 'function' || typeof createMovimento !== 'function') return;
    var conti = getConti();
    if (conti.length === 0) return;

    syncConti(conti); // fire-and-forget: tiene il bot aggiornato sui conti

    var items;
    try {
      var res = await fetch(BOT_API + '/pending', { signal: AbortSignal.timeout(3000) });
      items = await res.json();
    } catch (e) {
      return; // bot spento / offline → nessun rumore
    }
    if (!Array.isArray(items) || items.length === 0) return;

    var giaVisti = seen();
    var nuovi = 0;
    var ultimo = null;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var fiducia = (it.fiducia == null) ? 1 : it.fiducia;
      if (fiducia < MIN_FIDUCIA) continue; // sotto soglia → resta in coda per revisione

      if (giaVisti.indexOf(it.id) === -1) {
        var contoId = (typeof getConto === 'function' && getConto(it.contoId)) ? it.contoId : conti[0].id;
        createMovimento({
          contoId: contoId,
          tipo: it.tipo === 'entrata' ? 'entrata' : 'uscita',
          importo: it.importo,
          data: it.data,
          categoria: it.categoria,
          descrizione: it.descrizione,
          fonte: 'telegram'
        });
        markSeen(it.id);
        nuovi++;
        ultimo = it;
      }
      // Già registrato nel localStorage: rimuovilo dalla coda del bot.
      try { await fetch(BOT_API + '/pending/' + it.id, { method: 'DELETE' }); } catch (e) {}
    }

    if (nuovi > 0) {
      window.dispatchEvent(new CustomEvent('telegram:imported', { detail: { count: nuovi, ultimo: ultimo } }));
      toast(ultimo, nuovi);
    }
  }

  // ── Toast minimale, senza dipendenze ──
  function toast(item, count) {
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:96px',
      'transform:translateX(-50%) translateY(20px)',
      'background:#0088CC', 'color:#fff', 'padding:12px 20px', 'border-radius:50px',
      'font:500 14px Roboto,sans-serif', 'box-shadow:0 4px 12px rgba(0,0,0,.3)',
      'z-index:1000', 'opacity:0', 'transition:opacity .25s, transform .25s',
      'max-width:90vw', 'text-align:center'
    ].join(';');
    el.textContent = count > 1
      ? ('📷 ' + count + ' scontrini registrati da Telegram')
      : ('📷 Registrato da Telegram: ' +
         (item && item.descrizione ? item.descrizione : 'scontrino') +
         (item && item.importo != null ? ' · €' + Number(item.importo).toFixed(2) : ''));
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(function () { el.remove(); }, 300);
    }, 3200);
  }

  setInterval(poll, POLL_MS);
  poll();
})();
