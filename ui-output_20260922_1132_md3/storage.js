/*
 * storage.js — livello dati condiviso della webapp "Finanze di Famiglia".
 *
 * Classic script: caricalo con <script src="storage.js"></script> PRIMA degli
 * script di pagina. Espone le sue funzioni come globali (getConti, createConto, …).
 * Lo stesso file è testabile in Node (module.exports in fondo) con un mock di
 * localStorage — vedi storage.test.js.
 *
 * Schema localStorage:
 *   ff_conti      → Array<Conto>      Conto: { id, nome, saldoIniziale, saldo, createdAt }
 *   ff_movimenti  → Array<Movimento>  Movimento: { id, contoId, tipo, importo, data,
 *                                                   categoria, descrizione?, fonte, createdAt }
 *   ff_auth       → { password, loggedIn }
 */

'use strict';

var FF_CONTI = 'ff_conti';
var FF_MOVIMENTI = 'ff_movimenti';
var FF_AUTH = 'ff_auth';

var DEFAULT_PASSWORD = 'famiglia2026';

// Liste fisse di categorie, ognuna appartiene a Entrata O Uscita (vedi CONTEXT.md).
var CATEGORIE = {
  uscita: [
    'Casa', 'Spesa', 'Ristoranti', 'Trasporti',
    'Salute', 'Abbigliamento', 'Svago', 'Istruzione',
    'Abbonamenti', 'Altro'
  ],
  entrata: ['Stipendio', 'Freelance', 'Regalo', 'Rimborso', 'Altro']
};

// ── Utility di persistenza ────────────────────────────────────────────────────
function readJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function nowISO() {
  return new Date().toISOString();
}

function toNumber(v) {
  var n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Arrotonda a 2 decimali per evitare drift da somme in floating point.
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ── Conti ─────────────────────────────────────────────────────────────────────
function getConti() {
  return readJSON(FF_CONTI, []);
}

function getConto(id) {
  return getConti().find(function (c) { return c.id === id; }) || null;
}

function createConto(input) {
  input = input || {};
  var conti = getConti();
  var saldoIniziale = round2(toNumber(input.saldoIniziale));
  var conto = {
    id: uuid(),
    nome: String(input.nome || '').trim(),
    saldoIniziale: saldoIniziale,
    saldo: saldoIniziale,
    createdAt: nowISO()
  };
  conti.push(conto);
  writeJSON(FF_CONTI, conti);
  return conto;
}

// Ricalcola e riscrive conto.saldo dal valore derivato (saldoIniziale + Σ movimenti).
function ricalcolaSaldo(contoId) {
  var conti = getConti();
  var idx = conti.findIndex(function (c) { return c.id === contoId; });
  if (idx === -1) return;
  conti[idx].saldo = saldoCalcolato(contoId);
  writeJSON(FF_CONTI, conti);
}

function saldoCalcolato(contoId) {
  var conto = getConto(contoId);
  if (!conto) return 0;
  var delta = getMovimenti(contoId).reduce(function (sum, m) {
    return sum + (m.tipo === 'entrata' ? toNumber(m.importo) : -toNumber(m.importo));
  }, 0);
  return round2(conto.saldoIniziale + delta);
}

// ── Movimenti ───────────────────────────────────────────────────────────────
function getMovimenti(contoId) {
  var all = readJSON(FF_MOVIMENTI, []);
  if (!contoId) return all;
  return all.filter(function (m) { return m.contoId === contoId; });
}

function createMovimento(input) {
  input = input || {};
  var movimenti = readJSON(FF_MOVIMENTI, []);
  var mov = {
    id: uuid(),
    contoId: input.contoId,
    tipo: input.tipo === 'entrata' ? 'entrata' : 'uscita',
    importo: round2(Math.abs(toNumber(input.importo))),
    data: input.data,
    categoria: input.categoria,
    descrizione: input.descrizione || '',
    fonte: input.fonte === 'telegram' ? 'telegram' : 'manuale',
    createdAt: nowISO()
  };
  movimenti.push(mov);
  writeJSON(FF_MOVIMENTI, movimenti);
  ricalcolaSaldo(mov.contoId);
  return mov;
}

function deleteMovimento(id) {
  var movimenti = readJSON(FF_MOVIMENTI, []);
  var mov = movimenti.find(function (m) { return m.id === id; });
  if (!mov) return;
  var rest = movimenti.filter(function (m) { return m.id !== id; });
  writeJSON(FF_MOVIMENTI, rest);
  ricalcolaSaldo(mov.contoId);
}

// ── Periodo / aggregazioni (per la dashboard) ─────────────────────────────────
// Periodo solare: mese/trimestre/anno di calendario correnti, da inizio periodo a `now`.
function periodoRange(periodo, now) {
  now = now || new Date();
  var y = now.getFullYear();
  var m = now.getMonth();
  var start;
  if (periodo === 'anno') {
    start = new Date(y, 0, 1);
  } else if (periodo === 'trimestre') {
    var qStart = Math.floor(m / 3) * 3;
    start = new Date(y, qStart, 1);
  } else { // 'mese' (default)
    start = new Date(y, m, 1);
  }
  return { start: start, end: now };
}

function parseData(d) {
  // Le date sono stringhe ISO "YYYY-MM-DD": interpretale in orario locale.
  if (d instanceof Date) return d;
  var parts = String(d).slice(0, 10).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function filterByPeriodo(movimenti, periodo, now) {
  var range = periodoRange(periodo, now);
  var startTime = range.start.getTime();
  // Includi tutto il giorno finale.
  var endDay = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate(), 23, 59, 59, 999);
  var endTime = endDay.getTime();
  return movimenti.filter(function (m) {
    var t = parseData(m.data).getTime();
    return t >= startTime && t <= endTime;
  });
}

function aggregaUscitePerCategoria(movimenti) {
  var map = new Map();
  movimenti.forEach(function (m) {
    if (m.tipo !== 'uscita') return;
    var cat = m.categoria || 'Altro';
    map.set(cat, round2((map.get(cat) || 0) + toNumber(m.importo)));
  });
  return map;
}

// ── Auth (gate client-side, non sicurezza reale) ──────────────────────────────
function getAuth() {
  var auth = readJSON(FF_AUTH, null);
  if (!auth) {
    auth = { password: DEFAULT_PASSWORD, loggedIn: false };
    writeJSON(FF_AUTH, auth);
  }
  return auth;
}

function verifyPassword(pw) {
  var auth = getAuth();
  if (pw === auth.password) {
    auth.loggedIn = true;
    writeJSON(FF_AUTH, auth);
    return true;
  }
  return false;
}

function isLoggedIn() {
  var auth = readJSON(FF_AUTH, null);
  return !!(auth && auth.loggedIn === true);
}

// Guard sincrono da chiamare in cima a ogni pagina protetta.
function requireAuth() {
  if (!isLoggedIn() && typeof window !== 'undefined') {
    window.location.replace('login.html');
  }
}

// ── Formattazione ─────────────────────────────────────────────────────────────
var euroFormatter = null;
function formatEuro(n) {
  if (!euroFormatter) {
    euroFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  }
  return euroFormatter.format(toNumber(n));
}

// dd/mm/yyyy
function formatData(d) {
  var dt = parseData(d);
  var gg = String(dt.getDate()).padStart(2, '0');
  var mm = String(dt.getMonth() + 1).padStart(2, '0');
  var yyyy = dt.getFullYear();
  return gg + '/' + mm + '/' + yyyy;
}

// ── Demo seed (scenario Sara & Marco) ─────────────────────────────────────────
function seedDemo() {
  // Non ri-seedare se ci sono già conti (evita di sovrascrivere il lavoro dell'utente).
  if (getConti().length > 0) {
    getAuth(); // garantisce comunque l'esistenza di ff_auth
    return;
  }

  writeJSON(FF_AUTH, { password: DEFAULT_PASSWORD, loggedIn: false });
  writeJSON(FF_CONTI, []);
  writeJSON(FF_MOVIMENTI, []);

  var conto = createConto({ nome: 'Conto Famiglia', saldoIniziale: 2000 });

  // ~15 movimenti realistici, luglio–settembre 2026, categorie miste.
  var seed = [
    // Luglio
    { tipo: 'entrata', importo: 1800, data: '2026-07-27', categoria: 'Stipendio', descrizione: 'Stipendio Marco' },
    { tipo: 'uscita', importo: 780, data: '2026-07-05', categoria: 'Casa', descrizione: 'Affitto' },
    { tipo: 'uscita', importo: 132.4, data: '2026-07-08', categoria: 'Spesa', descrizione: 'Supermercato' },
    { tipo: 'uscita', importo: 45, data: '2026-07-14', categoria: 'Trasporti', descrizione: 'Benzina' },
    { tipo: 'uscita', importo: 62, data: '2026-07-19', categoria: 'Ristoranti', descrizione: 'Cena fuori' },
    // Agosto
    { tipo: 'entrata', importo: 1800, data: '2026-08-27', categoria: 'Stipendio', descrizione: 'Stipendio Marco' },
    { tipo: 'uscita', importo: 780, data: '2026-08-04', categoria: 'Casa', descrizione: 'Affitto' },
    { tipo: 'uscita', importo: 156.8, data: '2026-08-11', categoria: 'Spesa', descrizione: 'Supermercato' },
    { tipo: 'uscita', importo: 38, data: '2026-08-16', categoria: 'Trasporti', descrizione: 'Benzina' },
    { tipo: 'uscita', importo: 88.5, data: '2026-08-22', categoria: 'Ristoranti', descrizione: 'Pizzeria in famiglia' },
    // Settembre (periodo demo — deve risultare non vuoto)
    { tipo: 'entrata', importo: 1800, data: '2026-09-05', categoria: 'Stipendio', descrizione: 'Stipendio Marco' },
    { tipo: 'uscita', importo: 780, data: '2026-09-03', categoria: 'Casa', descrizione: 'Affitto' },
    { tipo: 'uscita', importo: 121.3, data: '2026-09-09', categoria: 'Spesa', descrizione: 'Supermercato' },
    { tipo: 'uscita', importo: 34, data: '2026-09-15', categoria: 'Ristoranti', descrizione: 'Pranzo' },
    { tipo: 'uscita', importo: 45, data: '2026-09-18', categoria: 'Trasporti', descrizione: 'Benzina' },
    { tipo: 'uscita', importo: 12.9, data: '2026-09-20', categoria: 'Abbonamenti', descrizione: 'Streaming' }
  ];

  seed.forEach(function (m) {
    createMovimento({
      contoId: conto.id,
      tipo: m.tipo,
      importo: m.importo,
      data: m.data,
      categoria: m.categoria,
      descrizione: m.descrizione,
      fonte: 'manuale'
    });
  });
}

function clearAll() {
  localStorage.removeItem(FF_CONTI);
  localStorage.removeItem(FF_MOVIMENTI);
  localStorage.removeItem(FF_AUTH);
}

// ── Export per i test in Node (in browser `module` non esiste, il blocco è skippato) ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIE: CATEGORIE,
    DEFAULT_PASSWORD: DEFAULT_PASSWORD,
    getConti: getConti,
    getConto: getConto,
    createConto: createConto,
    saldoCalcolato: saldoCalcolato,
    getMovimenti: getMovimenti,
    createMovimento: createMovimento,
    deleteMovimento: deleteMovimento,
    periodoRange: periodoRange,
    filterByPeriodo: filterByPeriodo,
    aggregaUscitePerCategoria: aggregaUscitePerCategoria,
    getAuth: getAuth,
    verifyPassword: verifyPassword,
    isLoggedIn: isLoggedIn,
    requireAuth: requireAuth,
    formatEuro: formatEuro,
    formatData: formatData,
    seedDemo: seedDemo,
    clearAll: clearAll
  };
}
