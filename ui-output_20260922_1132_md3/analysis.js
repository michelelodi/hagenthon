/*
 * analysis.js — motore di analisi deterministico della webapp "Finanze di Famiglia".
 *
 * Puro e senza stato: prende movimenti/conti e restituisce metriche + insight già
 * pronti da mostrare. Client-side, istantaneo, offline (nessuna rete). Il report
 * testuale in linguaggio naturale è invece generato a parte via `askclaude`
 * (report-server), on-demand.
 *
 * Classic script: caricalo con <script src="analysis.js"></script> DOPO storage.js.
 * Espone `analizza()` come globale. Testabile in Node (module.exports in fondo).
 */

'use strict';

// Soglie (documentate qui così sono spiegabili a voce).
var CRESCITA_MIN_PCT = 0.20;      // +20% mese-su-mese per segnalare una crescita
var CRESCITA_MIN_IMPORTO = 20;    // ignora micro-importi
var ANOMALIA_FATTORE = 1.5;       // >= 1.5x la media dei mesi precedenti
var ANOMALIA_MIN_IMPORTO = 20;
var ANOMALIA_MESI_STORICO = 3;    // media calcolata sugli ultimi N mesi con dati

// Riusa i formatter globali (storage.js) se presenti, altrimenti fallback locale
// (così analysis.js resta testabile in Node senza dipendenze).
var _fmt = (typeof formatEuro === 'function')
  ? formatEuro
  : function (n) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(_num(n)); };

function _num(v) {
  var n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function _round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function _parseData(d) {
  if (d instanceof Date) return d;
  var p = String(d).slice(0, 10).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function _periodoRange(periodo, now) {
  var y = now.getFullYear(), m = now.getMonth(), start;
  if (periodo === 'anno') start = new Date(y, 0, 1);
  else if (periodo === 'trimestre') start = new Date(y, Math.floor(m / 3) * 3, 1);
  else start = new Date(y, m, 1);
  var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function _pct(label) { return Math.round(label * 100); }

// Somma le uscite per categoria in un dato mese di calendario.
function _usciteCatMese(movimenti, year, month) {
  var map = new Map();
  movimenti.forEach(function (m) {
    if (m.tipo !== 'uscita') return;
    var dt = _parseData(m.data);
    if (dt.getFullYear() !== year || dt.getMonth() !== month) return;
    var cat = m.categoria || 'Altro';
    map.set(cat, _round2((map.get(cat) || 0) + _num(m.importo)));
  });
  return map;
}

function analizza(opts) {
  opts = opts || {};
  var now = opts.now || new Date();
  var periodo = opts.periodo || 'mese';
  var contoId = opts.contoId || '';
  var conti = opts.conti || [];
  var movimenti = (opts.movimenti || []).filter(function (m) {
    return !contoId || m.contoId === contoId;
  });

  // ── Metriche del periodo selezionato ──
  var range = _periodoRange(periodo, now);
  var periodMov = movimenti.filter(function (m) {
    var t = _parseData(m.data).getTime();
    return t >= range.start && t <= range.end;
  });

  var entrate = 0, uscite = 0;
  periodMov.forEach(function (m) {
    if (m.tipo === 'entrata') entrate += _num(m.importo);
    else uscite += _num(m.importo);
  });
  entrate = _round2(entrate);
  uscite = _round2(uscite);
  var netto = _round2(entrate - uscite);
  var tassoRisparmio = entrate > 0 ? _round2(netto / entrate) : null;

  var contiRilevanti = contoId ? conti.filter(function (c) { return c.id === contoId; }) : conti;
  var saldoTotale = _round2(contiRilevanti.reduce(function (s, c) { return s + _num(c.saldo); }, 0));

  // ── Top categoria di uscita nel periodo ──
  var perCat = new Map();
  periodMov.forEach(function (m) {
    if (m.tipo !== 'uscita') return;
    var cat = m.categoria || 'Altro';
    perCat.set(cat, _round2((perCat.get(cat) || 0) + _num(m.importo)));
  });
  var topCategoria = null;
  perCat.forEach(function (v, k) {
    if (!topCategoria || v > topCategoria.importo) topCategoria = { categoria: k, importo: v };
  });
  if (topCategoria) topCategoria.pct = uscite > 0 ? Math.round(topCategoria.importo / uscite * 100) : 0;

  // ── Categorie in crescita: mese corrente vs mese precedente ──
  var curY = now.getFullYear(), curM = now.getMonth();
  var prevDate = new Date(curY, curM - 1, 1);
  var currMonthCat = _usciteCatMese(movimenti, curY, curM);
  var prevMonthCat = _usciteCatMese(movimenti, prevDate.getFullYear(), prevDate.getMonth());
  var categorieInCrescita = [];
  currMonthCat.forEach(function (curr, cat) {
    var prev = prevMonthCat.get(cat) || 0;
    if (prev > 0 && curr > prev) {
      var deltaPct = (curr - prev) / prev;
      if (deltaPct >= CRESCITA_MIN_PCT && curr >= CRESCITA_MIN_IMPORTO) {
        categorieInCrescita.push({ categoria: cat, corrente: _round2(curr), precedente: _round2(prev), deltaPct: _round2(deltaPct) });
      }
    }
  });
  categorieInCrescita.sort(function (a, b) { return b.deltaPct - a.deltaPct; });

  // ── Anomalie: mese corrente molto sopra la media dei mesi precedenti ──
  var anomalie = [];
  currMonthCat.forEach(function (curr, cat) {
    var prevs = [];
    for (var k = 1; k <= ANOMALIA_MESI_STORICO; k++) {
      var d = new Date(curY, curM - k, 1);
      var v = _usciteCatMese(movimenti, d.getFullYear(), d.getMonth()).get(cat);
      if (v != null) prevs.push(v);
    }
    if (prevs.length >= 2) {
      var media = prevs.reduce(function (a, b) { return a + b; }, 0) / prevs.length;
      if (media > 0 && curr >= ANOMALIA_FATTORE * media && curr >= ANOMALIA_MIN_IMPORTO) {
        anomalie.push({ categoria: cat, corrente: _round2(curr), media: _round2(media), fattore: _round2(curr / media) });
      }
    }
  });
  anomalie.sort(function (a, b) { return b.fattore - a.fattore; });

  var metriche = {
    entrate: entrate, uscite: uscite, netto: netto, tassoRisparmio: tassoRisparmio,
    saldoTotale: saldoTotale, topCategoria: topCategoria,
    categorieInCrescita: categorieInCrescita, anomalie: anomalie, periodo: periodo
  };
  metriche.insights = costruisciInsights(metriche);
  return metriche;
}

// Trasforma le metriche in una lista di insight pronti da mostrare (e da inviare al report AI).
function costruisciInsights(m) {
  var out = [];

  // 1) Bilancio del periodo.
  if (m.uscite > m.entrate) {
    out.push({
      code: 'spese_oltre_entrate', level: 'warning', icon: 'trending_down',
      title: 'Spendi più di quanto incassi',
      detail: 'Nel periodo le uscite (' + _fmt(m.uscite) + ') superano le entrate (' + _fmt(m.entrate) +
        '): stai erodendo il saldo di ' + _fmt(Math.abs(m.netto)) + '.'
    });
  } else if (m.netto > 0) {
    var quota = (m.tassoRisparmio != null) ? ' (' + _pct(m.tassoRisparmio) + '% delle entrate)' : '';
    out.push({
      code: 'risparmio', level: 'positive', icon: 'savings',
      title: 'Stai risparmiando',
      detail: 'Nel periodo metti da parte ' + _fmt(m.netto) + quota + '.'
    });
  }

  // 2) Categorie in aumento (es. bollette/Casa, Abbonamenti…).
  if (m.categorieInCrescita.length > 0) {
    var c = m.categorieInCrescita[0];
    out.push({
      code: 'categoria_crescita', level: 'warning', icon: 'north_east',
      title: 'Spese in aumento: ' + c.categoria,
      detail: c.categoria + ': ' + _fmt(c.corrente) + ' questo mese, +' + _pct(c.deltaPct) +
        '% rispetto a ' + _fmt(c.precedente) + ' del mese scorso.'
    });
  }

  // 3) Anomalia di spesa (se diversa dalla crescita già segnalata).
  if (m.anomalie.length > 0) {
    var a = m.anomalie[0];
    var giaSegnalata = m.categorieInCrescita.length > 0 && m.categorieInCrescita[0].categoria === a.categoria;
    if (!giaSegnalata) {
      out.push({
        code: 'anomalia', level: 'warning', icon: 'warning',
        title: 'Spesa insolita: ' + a.categoria,
        detail: a.categoria + ' a ' + _fmt(a.corrente) + ', circa ' + a.fattore + '× la media dei mesi scorsi (' + _fmt(a.media) + ').'
      });
    }
  }

  // 4) Dove vanno i soldi: categoria principale.
  if (m.topCategoria) {
    out.push({
      code: 'top_categoria', level: 'info', icon: 'pie_chart',
      title: 'Categoria principale: ' + m.topCategoria.categoria,
      detail: m.topCategoria.categoria + ' pesa ' + _fmt(m.topCategoria.importo) +
        ' (' + m.topCategoria.pct + '% delle uscite del periodo).'
    });
  }

  // 5) Fallback: nessun dato.
  if (out.length === 0) {
    out.push({
      code: 'nessun_dato', level: 'info', icon: 'info',
      title: 'Ancora pochi dati',
      detail: 'Aggiungi qualche movimento per vedere l\'analisi delle tue finanze.'
    });
  }

  return out;
}

// ── Export per i test in Node ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    analizza: analizza,
    costruisciInsights: costruisciInsights,
    CRESCITA_MIN_PCT: CRESCITA_MIN_PCT,
    ANOMALIA_FATTORE: ANOMALIA_FATTORE
  };
}
