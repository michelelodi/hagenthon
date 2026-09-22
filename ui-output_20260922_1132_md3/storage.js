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

// ── Demo seed (scenario Sara & Marco — un anno di finanze famigliari) ──────────
function seedDemo() {
  var contiEsistenti = getConti();
  // Salta il seed se l'utente ha già i propri dati (più di 1 conto, o nome diverso dal vecchio seed).
  var isVecchioSeed = contiEsistenti.length === 1 && contiEsistenti[0].nome === 'Conto Famiglia';
  if (contiEsistenti.length > 0 && !isVecchioSeed) {
    getAuth();
    return;
  }

  writeJSON(FF_AUTH, { password: DEFAULT_PASSWORD, loggedIn: false });
  writeJSON(FF_CONTI, []);
  writeJSON(FF_MOVIMENTI, []);

  var corrente = createConto({ nome: 'Conto Corrente',    saldoIniziale: 2800 });
  var carta    = createConto({ nome: 'Conto Corrente Business', saldoIniziale: 2800 });
  var contanti = createConto({ nome: 'Contanti',          saldoIniziale: 2400 });

  // Formato: [conto, tipo, importo, 'YYYY-MM-DD', categoria, descrizione]
  // c = Conto Corrente · k = Conto Corrente Business · x = Contanti
  var raw = [
    // ── Ottobre 2025 ──
    ['c','entrata',1800,'2025-10-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2025-10-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2025-10-01','Casa',        'Affitto'],
    ['c','uscita', 130, '2025-10-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2025-10-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 162, '2025-10-08','Spesa',       'Supermercato'],
    ['c','uscita', 138, '2025-10-22','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2025-10-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita',38.5, '2025-10-14','Salute',      'Farmacia'],
    ['k','uscita',  89, '2025-10-20','Abbigliamento','Giacca autunno'],
    ['x','uscita',  78, '2025-10-12','Trasporti',   'Benzina'],
    ['x','uscita',  58, '2025-10-18','Ristoranti',  'Pizzeria'],
    ['x','uscita',  32, '2025-10-25','Svago',       'Cinema'],
    // ── Novembre 2025 ──
    ['c','entrata',1800,'2025-11-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2025-11-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2025-11-03','Casa',        'Affitto'],
    ['c','uscita', 150, '2025-11-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2025-11-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 158, '2025-11-07','Spesa',       'Supermercato'],
    ['c','uscita', 144, '2025-11-21','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2025-11-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 145, '2025-11-25','Abbigliamento','Black Friday'],
    ['k','uscita',  42, '2025-11-14','Salute',      'Visita medica'],
    ['x','uscita',  82, '2025-11-13','Trasporti',   'Benzina'],
    ['x','uscita',  64, '2025-11-19','Ristoranti',  'Cena fuori'],
    ['x','uscita',  28, '2025-11-26','Svago',       'Teatro'],
    // ── Dicembre 2025 ──
    ['c','entrata',1800,'2025-12-27','Stipendio','Stipendio Marco'],
    ['c','entrata', 500,'2025-12-15','Stipendio','Tredicesima Marco'],
    ['c','entrata',1600,'2025-12-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2025-12-01','Casa',        'Affitto'],
    ['c','uscita', 165, '2025-12-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2025-12-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 195, '2025-12-07','Spesa',       'Supermercato'],
    ['c','uscita', 220, '2025-12-20','Spesa',       'Spesa di Natale'],
    ['k','uscita',22.99,'2025-12-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 180, '2025-12-15','Svago',       'Regali di Natale'],
    ['k','uscita',  65, '2025-12-10','Abbigliamento','Maglione invernale'],
    ['x','uscita',  75, '2025-12-12','Trasporti',   'Benzina'],
    ['x','uscita',  95, '2025-12-24','Ristoranti',  'Cena della Vigilia'],
    ['x','uscita',  45, '2025-12-27','Svago',       'Giochi per i bambini'],
    // ── Gennaio 2026 ──
    ['c','entrata',1800,'2026-01-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-01-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-01-02','Casa',        'Affitto'],
    ['c','uscita', 170, '2026-01-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-01-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 148, '2026-01-08','Spesa',       'Supermercato'],
    ['c','uscita', 132, '2026-01-22','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-01-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 110, '2026-01-10','Abbigliamento','Saldi invernali'],
    ['k','uscita',  55, '2026-01-20','Salute',      'Farmacia e parafarmacia'],
    ['x','uscita',  76, '2026-01-14','Trasporti',   'Benzina'],
    ['x','uscita',  52, '2026-01-20','Ristoranti',  'Pranzo domenica'],
    ['x','uscita',  22, '2026-01-28','Svago',       'Cinema'],
    // ── Febbraio 2026 ──
    ['c','entrata',1800,'2026-02-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-02-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-02-02','Casa',        'Affitto'],
    ['c','uscita', 155, '2026-02-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-02-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 144, '2026-02-08','Spesa',       'Supermercato'],
    ['c','uscita', 128, '2026-02-22','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-02-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita',  85, '2026-02-14','Ristoranti',  'Cena San Valentino'],
    ['k','uscita',  48, '2026-02-20','Salute',      'Farmacia'],
    ['x','uscita',  80, '2026-02-12','Trasporti',   'Benzina'],
    ['x','uscita',  46, '2026-02-20','Ristoranti',  'Pizzeria'],
    ['x','uscita',  30, '2026-02-26','Svago',       'Pattinaggio'],
    // ── Marzo 2026 ──
    ['c','entrata',1800,'2026-03-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-03-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-03-02','Casa',        'Affitto'],
    ['c','uscita', 140, '2026-03-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-03-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 155, '2026-03-08','Spesa',       'Supermercato'],
    ['c','uscita', 140, '2026-03-22','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-03-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 120, '2026-03-20','Istruzione',  'Corso di lingua'],
    ['k','uscita',  35, '2026-03-14','Salute',      'Farmacia'],
    ['x','uscita',  75, '2026-03-13','Trasporti',   'Benzina'],
    ['x','uscita',  62, '2026-03-19','Ristoranti',  'Cena fuori'],
    ['x','uscita',  38, '2026-03-25','Svago',       'Parco avventura'],
    // ── Aprile 2026 ──
    ['c','entrata',1800,'2026-04-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-04-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-04-01','Casa',        'Affitto'],
    ['c','uscita', 110, '2026-04-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-04-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 168, '2026-04-08','Spesa',       'Supermercato'],
    ['c','uscita', 150, '2026-04-22','Spesa',       'Spesa di Pasqua'],
    ['k','uscita',22.99,'2026-04-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita',  95, '2026-04-18','Abbigliamento','Abbigliamento primavera'],
    ['k','uscita',  28, '2026-04-14','Salute',      'Farmacia'],
    ['x','uscita',  72, '2026-04-12','Trasporti',   'Benzina'],
    ['x','uscita',  78, '2026-04-20','Ristoranti',  'Pranzo di Pasqua'],
    ['x','uscita',  35, '2026-04-26','Svago',       'Gita fuoriporta'],
    // ── Maggio 2026 ──
    ['c','entrata',1800,'2026-05-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-05-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-05-04','Casa',        'Affitto'],
    ['c','uscita',  90, '2026-05-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-05-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 154, '2026-05-07','Spesa',       'Supermercato'],
    ['c','uscita', 136, '2026-05-21','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-05-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita',  68, '2026-05-20','Svago',       'Concerto'],
    ['k','uscita',  32, '2026-05-14','Salute',      'Parafarmacia'],
    ['x','uscita',  79, '2026-05-13','Trasporti',   'Benzina'],
    ['x','uscita',  55, '2026-05-19','Ristoranti',  'Cena compleanno'],
    ['x','uscita',  40, '2026-05-25','Svago',       'Sagra locale'],
    // ── Giugno 2026 ──
    ['c','entrata',1800,'2026-06-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-06-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-06-01','Casa',        'Affitto'],
    ['c','uscita',  95, '2026-06-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-06-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 160, '2026-06-08','Spesa',       'Supermercato'],
    ['c','uscita', 145, '2026-06-22','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-06-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 125, '2026-06-15','Abbigliamento','Costumi e abbigliamento estivo'],
    ['k','uscita',  44, '2026-06-14','Salute',      'Farmacia'],
    ['x','uscita',  85, '2026-06-12','Trasporti',   'Benzina'],
    ['x','uscita',  68, '2026-06-18','Ristoranti',  'Aperitivo e cena'],
    ['x','uscita',  45, '2026-06-25','Svago',       'Piscina'],
    // ── Luglio 2026 ──
    ['c','entrata',1800,'2026-07-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-07-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-07-01','Casa',        'Affitto'],
    ['c','uscita',  85, '2026-07-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-07-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 142, '2026-07-07','Spesa',       'Supermercato'],
    ['c','uscita', 128, '2026-07-21','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-07-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 380, '2026-07-15','Svago',       'Vacanze estive'],
    ['k','uscita',  75, '2026-07-20','Abbigliamento','Saldi estivi'],
    ['x','uscita',  92, '2026-07-10','Trasporti',   'Benzina viaggio'],
    ['x','uscita',  82, '2026-07-18','Ristoranti',  'Ristorante in vacanza'],
    ['x','uscita',  55, '2026-07-25','Svago',       'Escursione'],
    // ── Agosto 2026 ──
    ['c','entrata',1800,'2026-08-27','Stipendio','Stipendio Marco'],
    ['c','entrata',1600,'2026-08-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-08-01','Casa',        'Affitto'],
    ['c','uscita',  80, '2026-08-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-08-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 138, '2026-08-05','Spesa',       'Supermercato'],
    ['c','uscita', 145, '2026-08-20','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-08-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 250, '2026-08-10','Svago',       'Vacanze - attività'],
    ['k','entrata',120, '2026-08-25','Rimborso',    'Rimborso spese lavoro Sara'],
    ['x','uscita',  88, '2026-08-08','Trasporti',   'Benzina viaggio'],
    ['x','uscita',  75, '2026-08-15','Ristoranti',  'Cena di Ferragosto'],
    ['x','uscita',  40, '2026-08-22','Svago',       'Parco acquatico'],
    // ── Settembre 2026 (fino al 22) ──
    ['c','entrata',1600,'2026-09-05','Stipendio','Stipendio Sara'],
    ['c','uscita', 850, '2026-09-01','Casa',        'Affitto'],
    ['c','uscita', 100, '2026-09-10','Casa',        'Bolletta luce/gas'],
    ['c','uscita',  45, '2026-09-15','Abbonamenti', 'Internet e telefono'],
    ['c','uscita', 155, '2026-09-08','Spesa',       'Supermercato'],
    ['c','uscita', 142, '2026-09-18','Spesa',       'Supermercato'],
    ['k','uscita',22.99,'2026-09-01','Abbonamenti', 'Netflix + Spotify'],
    ['k','uscita', 185, '2026-09-15','Istruzione',  'Materiale scolastico'],
    ['x','uscita',  80, '2026-09-12','Trasporti',   'Benzina'],
    ['x','uscita',  62, '2026-09-19','Ristoranti',  'Cena fuori']
  ];

  var contoMap = { c: corrente.id, k: carta.id, x: contanti.id };
  raw.forEach(function (r) {
    createMovimento({
      contoId: contoMap[r[0]],
      tipo:        r[1],
      importo:     r[2],
      data:        r[3],
      categoria:   r[4],
      descrizione: r[5],
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
