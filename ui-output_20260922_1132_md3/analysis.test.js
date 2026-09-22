'use strict';

// Test del motore di analisi puro (analysis.js). Run:  node --test analysis.test.js
// analysis.js è uno script classico che esporta la sua API sotto module.exports in Node.

const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('./analysis.js');

// Helper: costruisce un movimento minimale.
function mov(contoId, tipo, importo, data, categoria) {
  return { id: data + categoria + importo, contoId, tipo, importo, data, categoria };
}

test('metriche di periodo: entrate, uscite, netto, tasso di risparmio', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'entrata', 2000, '2026-09-01', 'Stipendio'),
    mov('c1', 'uscita', 500, '2026-09-03', 'Casa'),
    mov('c1', 'uscita', 300, '2026-09-05', 'Spesa'),
    mov('c1', 'uscita', 200, '2026-08-05', 'Spesa'), // fuori periodo (mese)
  ];
  const r = A.analizza({ movimenti, conti: [{ id: 'c1', saldo: 1000 }], periodo: 'mese', now });
  assert.equal(r.entrate, 2000);
  assert.equal(r.uscite, 800);
  assert.equal(r.netto, 1200);
  assert.equal(r.tassoRisparmio, 0.6);
});

test('spese > entrate genera un insight di warning', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'entrata', 500, '2026-09-01', 'Stipendio'),
    mov('c1', 'uscita', 900, '2026-09-03', 'Casa'),
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  assert.ok(r.uscite > r.entrate);
  assert.equal(r.netto, -400);
  const codes = r.insights.map(function (i) { return i.code; });
  assert.ok(codes.includes('spese_oltre_entrate'));
  const ins = r.insights.find(function (i) { return i.code === 'spese_oltre_entrate'; });
  assert.equal(ins.level, 'warning');
});

test('netto positivo genera un insight di risparmio con tono di complimento', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'entrata', 2000, '2026-09-01', 'Stipendio'),
    mov('c1', 'uscita', 800, '2026-09-03', 'Casa'),
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  const ins = r.insights.find(function (i) { return i.code === 'risparmio'; });
  assert.ok(ins);
  assert.equal(ins.level, 'positive');
  // Deve essere un complimento esplicito e in evidenza (primo insight).
  assert.match(ins.title + ' ' + ins.detail, /[Cc]omplimenti|[Oo]ttimo|[Bb]rav/);
  assert.equal(r.insights[0].code, 'risparmio');
});

test('categoria in calo mese-su-mese genera un insight positivo', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'entrata', 3000, '2026-09-01', 'Stipendio'),
    // Ristoranti: 200 ad agosto → 80 a settembre (-60%)
    mov('c1', 'uscita', 200, '2026-08-10', 'Ristoranti'),
    mov('c1', 'uscita', 80, '2026-09-10', 'Ristoranti'),
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  const calo = r.categorieInCalo.find(function (c) { return c.categoria === 'Ristoranti'; });
  assert.ok(calo, 'Ristoranti in calo');
  assert.equal(calo.precedente, 200);
  assert.equal(calo.corrente, 80);
  assert.ok(calo.deltaPct >= 0.59);
  assert.ok(r.insights.some(function (i) { return i.code === 'categoria_calo' && i.level === 'positive'; }));
});

test('categoria in crescita mese-su-mese', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    // Agosto: Casa 100
    mov('c1', 'uscita', 100, '2026-08-10', 'Casa'),
    // Settembre: Casa 200 (+100%)
    mov('c1', 'uscita', 200, '2026-09-10', 'Casa'),
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  const cresc = r.categorieInCrescita.find(function (c) { return c.categoria === 'Casa'; });
  assert.ok(cresc, 'Casa in crescita');
  assert.equal(cresc.corrente, 200);
  assert.equal(cresc.precedente, 100);
  assert.ok(cresc.deltaPct >= 0.99);
  assert.ok(r.insights.some(function (i) { return i.code === 'categoria_crescita'; }));
});

test('nessuna crescita se la categoria è stabile o in calo', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'uscita', 200, '2026-08-10', 'Casa'),
    mov('c1', 'uscita', 100, '2026-09-10', 'Casa'), // in calo
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  assert.equal(r.categorieInCrescita.length, 0);
});

test('top categoria di uscita nel periodo', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'uscita', 500, '2026-09-03', 'Casa'),
    mov('c1', 'uscita', 120, '2026-09-05', 'Spesa'),
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  assert.equal(r.topCategoria.categoria, 'Casa');
  assert.equal(r.topCategoria.importo, 500);
  assert.equal(r.topCategoria.pct, 81); // 500/620
});

test('anomalia: spesa del mese molto sopra la media dei mesi precedenti', () => {
  const now = new Date('2026-09-22T10:00:00');
  // Aug e Sep uguali (nessuna crescita mese-su-mese) ma Sep >> media di Giu/Lug/Ago.
  const movimenti = [
    mov('c1', 'uscita', 50, '2026-06-10', 'Svago'),
    mov('c1', 'uscita', 50, '2026-07-10', 'Svago'),
    mov('c1', 'uscita', 300, '2026-08-10', 'Svago'),
    mov('c1', 'uscita', 300, '2026-09-10', 'Svago'),
  ];
  const r = A.analizza({ movimenti, conti: [], periodo: 'mese', now });
  const an = r.anomalie.find(function (a) { return a.categoria === 'Svago'; });
  assert.ok(an, 'anomalia Svago');
  assert.ok(an.fattore >= 1.5);
  // Nessuna crescita mese-su-mese, quindi l'insight anomalia non viene deduplicato.
  assert.equal(r.categorieInCrescita.length, 0);
  assert.ok(r.insights.some(function (i) { return i.code === 'anomalia'; }));
});

test('filtro per contoId isola i movimenti di un solo conto', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'uscita', 100, '2026-09-03', 'Casa'),
    mov('c2', 'uscita', 999, '2026-09-03', 'Casa'),
  ];
  const r = A.analizza({ movimenti, conti: [{ id: 'c1', saldo: 10 }, { id: 'c2', saldo: 20 }], periodo: 'mese', now, contoId: 'c1' });
  assert.equal(r.uscite, 100);
  assert.equal(r.saldoTotale, 10);
});

test('insights non vuoti su dataset realistico', () => {
  const now = new Date('2026-09-22T10:00:00');
  const movimenti = [
    mov('c1', 'entrata', 1800, '2026-09-05', 'Stipendio'),
    mov('c1', 'uscita', 780, '2026-09-03', 'Casa'),
    mov('c1', 'uscita', 121.3, '2026-09-09', 'Spesa'),
  ];
  const r = A.analizza({ movimenti, conti: [{ id: 'c1', saldo: 900 }], periodo: 'mese', now });
  assert.ok(Array.isArray(r.insights));
  assert.ok(r.insights.length >= 1);
  r.insights.forEach(function (i) {
    assert.ok(i.code && i.level && i.title && i.detail, 'insight completo');
  });
});
