'use strict';

// Lightweight test seam for the pure logic in storage.js.
// Run with:  node --test  (from this folder)
//
// storage.js is a classic browser script that also exports its API under
// `module.exports` when running in Node. It talks to a global `localStorage`,
// which the browser provides and which we mock here.

const test = require('node:test');
const assert = require('node:assert/strict');

// ── Minimal localStorage mock ────────────────────────────────────────────────
function installLocalStorage() {
  const map = new Map();
  global.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

installLocalStorage();

const S = require('./storage.js');

test.beforeEach(() => {
  global.localStorage.clear();
});

test('createConto returns a conto with saldo === saldoIniziale and stable id', () => {
  const c = S.createConto({ nome: 'Conto Test', saldoIniziale: 1000 });
  assert.ok(c.id, 'has id');
  assert.equal(c.nome, 'Conto Test');
  assert.equal(c.saldoIniziale, 1000);
  assert.equal(c.saldo, 1000);
  assert.ok(c.createdAt, 'has createdAt');
  assert.deepEqual(S.getConto(c.id), c);
  assert.equal(S.getConti().length, 1);
});

test('createConto coerces saldoIniziale to a number', () => {
  const c = S.createConto({ nome: 'X', saldoIniziale: '250,50'.replace(',', '.') });
  assert.equal(c.saldoIniziale, 250.5);
  assert.equal(c.saldo, 250.5);
});

test('createMovimento uscita decreases saldo, entrata increases it', () => {
  const c = S.createConto({ nome: 'C', saldoIniziale: 100 });
  S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 30, data: '2026-09-01', categoria: 'Spesa' });
  assert.equal(S.getConto(c.id).saldo, 70);
  S.createMovimento({ contoId: c.id, tipo: 'entrata', importo: 50, data: '2026-09-02', categoria: 'Stipendio' });
  assert.equal(S.getConto(c.id).saldo, 120);
});

test('getMovimenti filters by contoId and returns all when omitted', () => {
  const a = S.createConto({ nome: 'A', saldoIniziale: 0 });
  const b = S.createConto({ nome: 'B', saldoIniziale: 0 });
  S.createMovimento({ contoId: a.id, tipo: 'uscita', importo: 10, data: '2026-09-01', categoria: 'Spesa' });
  S.createMovimento({ contoId: b.id, tipo: 'uscita', importo: 20, data: '2026-09-01', categoria: 'Spesa' });
  assert.equal(S.getMovimenti(a.id).length, 1);
  assert.equal(S.getMovimenti().length, 2);
});

test('deleteMovimento removes it and restores saldo', () => {
  const c = S.createConto({ nome: 'C', saldoIniziale: 100 });
  const m = S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 40, data: '2026-09-01', categoria: 'Spesa' });
  assert.equal(S.getConto(c.id).saldo, 60);
  S.deleteMovimento(m.id);
  assert.equal(S.getConto(c.id).saldo, 100);
  assert.equal(S.getMovimenti(c.id).length, 0);
});

test('saldoCalcolato equals stored saldo after mutations (no drift)', () => {
  const c = S.createConto({ nome: 'C', saldoIniziale: 200 });
  S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 12.9, data: '2026-09-01', categoria: 'Abbonamenti' });
  S.createMovimento({ contoId: c.id, tipo: 'entrata', importo: 100, data: '2026-09-02', categoria: 'Stipendio' });
  assert.equal(S.saldoCalcolato(c.id), S.getConto(c.id).saldo);
  assert.equal(S.saldoCalcolato(c.id), 287.1);
});

test('createMovimento defaults fonte to manuale', () => {
  const c = S.createConto({ nome: 'C', saldoIniziale: 0 });
  const m = S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 5, data: '2026-09-01', categoria: 'Altro' });
  assert.equal(m.fonte, 'manuale');
});

test('seedDemo popola conti e movimenti coerenti + password demo', () => {
  S.seedDemo();
  const conti = S.getConti();
  assert.ok(conti.length >= 1, `almeno un conto, trovati ${conti.length}`);
  const movs = S.getMovimenti();
  assert.ok(movs.length >= 12, `expected >= 12 movimenti, got ${movs.length}`);
  // Ogni conto: saldo memorizzato coerente col valore derivato (no drift).
  conti.forEach(function (c) {
    assert.equal(S.saldoCalcolato(c.id), c.saldo, 'saldo coerente per ' + c.nome);
  });
  // Ogni movimento appartiene a un conto seedato.
  const ids = conti.map(function (c) { return c.id; });
  movs.forEach(function (m) { assert.ok(ids.includes(m.contoId), 'movimento su conto valido'); });
  const auth = S.getAuth();
  assert.equal(auth.password, 'famiglia2026');
});

test('seedDemo is idempotent-ish: does not double seed when conti exist', () => {
  S.seedDemo();
  const n = S.getConti().length;
  S.seedDemo();
  assert.equal(S.getConti().length, n);
});

test('clearAll empties everything', () => {
  S.seedDemo();
  S.clearAll();
  assert.equal(S.getConti().length, 0);
  assert.equal(S.getMovimenti().length, 0);
});

test('CATEGORIE include Freelance under entrata (per ticket 04)', () => {
  assert.ok(S.CATEGORIE.entrata.includes('Freelance'));
  assert.ok(S.CATEGORIE.uscita.includes('Spesa'));
});

test('verifyPassword accepts default password and sets loggedIn', () => {
  assert.equal(S.isLoggedIn(), false);
  assert.equal(S.verifyPassword('sbagliata'), false);
  assert.equal(S.isLoggedIn(), false);
  assert.equal(S.verifyPassword('famiglia2026'), true);
  assert.equal(S.isLoggedIn(), true);
});

test('formatEuro formats it-IT currency (comma decimals + euro sign)', () => {
  // Grouping separator + NBSP placement vary by ICU build; assert the parts
  // that are stable across Node and the browser.
  const s = S.formatEuro(1234.56);
  assert.match(s, /,56/, 'comma decimal separator');
  assert.match(s, /€/, 'euro sign');
});

test('periodoRange: mese covers the current calendar month', () => {
  const now = new Date('2026-09-22T10:00:00');
  const { start, end } = S.periodoRange('mese', now);
  assert.equal(start.getMonth(), 8); // September (0-indexed)
  assert.equal(start.getDate(), 1);
  assert.ok(end >= now);
});

test('periodoRange: trimestre starts at the calendar quarter', () => {
  const now = new Date('2026-09-22T10:00:00'); // Q3 -> starts July (month 6)
  const { start } = S.periodoRange('trimestre', now);
  assert.equal(start.getMonth(), 6);
  assert.equal(start.getDate(), 1);
});

test('periodoRange: anno starts on Jan 1', () => {
  const now = new Date('2026-09-22T10:00:00');
  const { start } = S.periodoRange('anno', now);
  assert.equal(start.getMonth(), 0);
  assert.equal(start.getDate(), 1);
  assert.equal(start.getFullYear(), 2026);
});

test('aggregaUscitePerCategoria sums only uscite, grouped by categoria', () => {
  const c = S.createConto({ nome: 'C', saldoIniziale: 0 });
  S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 100, data: '2026-09-01', categoria: 'Casa' });
  S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 50, data: '2026-09-02', categoria: 'Casa' });
  S.createMovimento({ contoId: c.id, tipo: 'uscita', importo: 20, data: '2026-09-03', categoria: 'Spesa' });
  S.createMovimento({ contoId: c.id, tipo: 'entrata', importo: 999, data: '2026-09-04', categoria: 'Stipendio' });
  const agg = S.aggregaUscitePerCategoria(S.getMovimenti());
  assert.equal(agg.get('Casa'), 150);
  assert.equal(agg.get('Spesa'), 20);
  assert.equal(agg.has('Stipendio'), false);
});

test('filterByPeriodo keeps only movimenti within the range', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movs = [
    { data: '2026-09-10', importo: 1, tipo: 'uscita', categoria: 'Casa' },
    { data: '2026-08-10', importo: 1, tipo: 'uscita', categoria: 'Casa' },
  ];
  const mese = S.filterByPeriodo(movs, 'mese', now);
  assert.equal(mese.length, 1);
  const anno = S.filterByPeriodo(movs, 'anno', now);
  assert.equal(anno.length, 2);
});
