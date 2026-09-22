// report-server — bridge locale tra la webapp e `askclaude`.
//
// La webapp (statica, offline) POSTa qui le metriche già calcolate client-side
// da analysis.js; il server costruisce il prompt e chiama Claude via il wrapper
// esistente tools/askclaude. Restituisce un report testuale in italiano.
//
// È un EXTRA online: la demo dei 90s resta offline e usa solo gli insight
// deterministici in dashboard. Questo server serve solo quando l'utente clicca
// "Genera report AI".
//
// Avvio:   node report-server/server.mjs         (porta 3002, usa il CLI `claude`)
// Zero dipendenze: solo built-in Node + tools/askclaude (a sua volta zero-dep).

import http from 'node:http';
import { askClaude } from '../tools/askclaude/askclaude.mjs';

const PORT = process.env.PORT || 3002;

const SYSTEM = [
  'Sei un assistente che aiuta una famiglia italiana a capire le proprie finanze personali.',
  'Scrivi in italiano, con tono chiaro, concreto e non giudicante.',
  'NON fornire consulenza finanziaria o professionale personalizzata: descrivi ciò che',
  'emerge dai dati e offri al massimo suggerimenti pratici di buon senso.',
  'Massimo ~130 parole. Struttura: 2-4 osservazioni chiave (puntate) + 1 suggerimento finale.',
  'Non inventare numeri: usa solo quelli forniti.'
].join(' ');

function euro(n) {
  try { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0); }
  catch { return (Number(n) || 0) + ' €'; }
}

// Traduce le metriche in una descrizione testuale compatta per il modello.
function costruisciPrompt(a) {
  a = a || {};
  var righe = [];
  var periodo = a.periodo || 'mese';
  righe.push('Periodo analizzato: ' + periodo + ' corrente.');
  righe.push('Entrate: ' + euro(a.entrate) + '; Uscite: ' + euro(a.uscite) + '; Saldo netto del periodo: ' + euro(a.netto) + '.');
  if (a.tassoRisparmio != null) righe.push('Tasso di risparmio: ' + Math.round(a.tassoRisparmio * 100) + '%.');
  if (a.saldoTotale != null) righe.push('Saldo totale attuale: ' + euro(a.saldoTotale) + '.');
  if (a.topCategoria) righe.push('Categoria di spesa principale: ' + a.topCategoria.categoria + ' (' + euro(a.topCategoria.importo) + ', ' + a.topCategoria.pct + '% delle uscite).');
  if (Array.isArray(a.categorieInCrescita) && a.categorieInCrescita.length) {
    righe.push('Categorie in aumento rispetto al mese scorso: ' + a.categorieInCrescita.slice(0, 3).map(function (c) {
      return c.categoria + ' (+' + Math.round(c.deltaPct * 100) + '%, da ' + euro(c.precedente) + ' a ' + euro(c.corrente) + ')';
    }).join('; ') + '.');
  }
  if (Array.isArray(a.anomalie) && a.anomalie.length) {
    righe.push('Spese anomale rispetto alla media: ' + a.anomalie.slice(0, 3).map(function (x) {
      return x.categoria + ' (' + euro(x.corrente) + ', ~' + x.fattore + '× la media di ' + euro(x.media) + ')';
    }).join('; ') + '.');
  }
  righe.push('');
  righe.push('Scrivi un breve report che aiuti la famiglia a capire come sta gestendo il denaro, evidenziando i punti sopra.');
  return righe.join('\n');
}

function sendJson(res, status, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var data = '';
    req.on('data', function (c) {
      data += c;
      if (data.length > 1e6) { reject(new Error('payload troppo grande')); req.destroy(); }
    });
    req.on('end', function () { resolve(data); });
    req.on('error', reject);
  });
}

const server = http.createServer(async function (req, res) {
  if (req.method === 'OPTIONS') { sendJson(res, 204, {}); return; }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true, service: 'report-server' });
    return;
  }

  if (req.method === 'POST' && req.url === '/report') {
    let payload;
    try {
      payload = JSON.parse((await readBody(req)) || '{}');
    } catch {
      sendJson(res, 400, { ok: false, error: 'JSON non valido' });
      return;
    }
    const analysis = payload.analysis || payload;
    const prompt = costruisciPrompt(analysis);

    const r = await askClaude({
      prompt: prompt,
      system: SYSTEM,
      json: false,
      model: payload.model || 'sonnet',
      timeoutMs: 45000
    });

    if (!r.ok) {
      sendJson(res, 502, { ok: false, error: r.error.type + ': ' + r.error.message });
      return;
    }
    sendJson(res, 200, { ok: true, report: (r.text || '').trim(), meta: r.meta });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, function () {
  console.log('\n📊 report-server in ascolto su http://localhost:' + PORT);
  console.log('   POST /report  { analysis }  → report testuale via askclaude');
  console.log('   GET  /health\n');
  console.log('Suggerimento: per un test offline/deterministico esporta');
  console.log('  ASKCLAUDE_CLAUDE_BIN=../tools/askclaude/test/stub-bin.mjs e ASKCLAUDE_STUB_STDOUT=\'{"result":"...","subtype":"success"}\'\n');
});
