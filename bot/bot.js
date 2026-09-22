import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { askClaude } from '../tools/askclaude/askclaude.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PENDING_FILE = join(__dirname, 'pending-expenses.json');

// Modello per la lettura dello scontrino. 'sonnet' = veloce/economico e sufficiente
// per uno scontrino; 'opus' per massima accuratezza. Per la demo 100% offline punta
// ASKCLAUDE_CLAUDE_BIN allo stub a risposte registrate (vedi tools/askclaude/README.md).
const MODEL = 'sonnet';

// ── Categorie uscite (speculari alla webapp) ──────────────────────────────────
const CATEGORIE_USCITA = [
  'Casa', 'Spesa', 'Ristoranti', 'Trasporti',
  'Salute', 'Abbigliamento', 'Svago', 'Istruzione',
  'Abbonamenti', 'Altro'
];

// NB: il CLI `claude` NON applica `--json-schema` agli input immagine (vision):
// risponderebbe in prosa. Quindi niente schema: chiediamo JSON esplicito nel
// prompt (askclaude aggiunge il nudge "solo JSON" + repair) e normalizziamo dopo.

// ── Storage locale ────────────────────────────────────────────────────────────
function readPending() {
  if (!existsSync(PENDING_FILE)) return [];
  try { return JSON.parse(readFileSync(PENDING_FILE, 'utf8')); }
  catch { return []; }
}

function writePending(items) {
  writeFileSync(PENDING_FILE, JSON.stringify(items, null, 2));
}

function addPending(item) {
  const items = readPending();
  items.push(item);
  writePending(items);
}

function removePending(id) {
  const items = readPending().filter(i => i.id !== id);
  writePending(items);
}

// ── Download immagine Telegram ────────────────────────────────────────────────
async function downloadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Analisi scontrino con Claude Vision, via askclaude → CLI `claude` locale ────
// Nessuna API key: usa l'auth di Claude Code. Vedi tools/askclaude/README.md.
async function analizzaScontrino(base64Image, mimeType = 'image/jpeg') {
  const oggi = new Date().toISOString().slice(0, 10);
  const r = await askClaude({
    prompt:
      'Analizza questo scontrino e restituisci SOLO un oggetto JSON valido ' +
      '(nessun altro testo, niente markdown, niente spiegazioni) con questi campi:\n' +
      '{\n' +
      '  "importo": <numero, totale pagato, es. 12.50>,\n' +
      '  "descrizione": "<negozio o descrizione breve, max 40 caratteri>",\n' +
      `  "data": "<data dello scontrino in formato YYYY-MM-DD; se non leggibile usa ${oggi}>",\n` +
      `  "categoria": "<una tra: ${CATEGORIE_USCITA.join(', ')}>",\n` +
      '  "fiducia": <numero da 0 a 1, quanto sei sicuro dell\'estrazione>\n' +
      '}',
    images: [{ base64: base64Image, mediaType: mimeType }],
    model: MODEL,
    timeoutMs: 60000
  });
  if (!r.ok) throw new Error(`askclaude [${r.error.type}]: ${r.error.message}`);

  // Normalizzazione difensiva (senza schema nativo).
  const d = r.data || {};
  const categoria = CATEGORIE_USCITA.includes(d.categoria) ? d.categoria : 'Altro';
  const importo = Number(d.importo);
  const fiducia = Number(d.fiducia);
  return {
    importo: isNaN(importo) ? 0 : importo,
    descrizione: String(d.descrizione || 'Scontrino').slice(0, 40),
    data: /^\d{4}-\d{2}-\d{2}$/.test(d.data) ? d.data : oggi,
    categoria: categoria,
    fiducia: isNaN(fiducia) ? 0.5 : Math.max(0, Math.min(1, fiducia))
  };
}

// ── Bot Telegram (polling) ────────────────────────────────────────────────────
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Elenco conti sincronizzato dalla webapp (POST /conti): [{ id, nome }].
// Serve per far scegliere il conto direttamente su Telegram.
let contiWebapp = [];

// Scontrini letti in attesa che l'utente scelga il conto (id breve → expense).
const attesaConto = new Map();

function makeExpense(dati) {
  return {
    id: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    importo: dati.importo,
    descrizione: dati.descrizione,
    data: dati.data,
    categoria: dati.categoria,
    tipo: 'uscita',
    fiducia: dati.fiducia,
    fonte: 'telegram',
    timestamp: new Date().toISOString()
  };
}

function riepilogo(e) {
  const emo = e.fiducia >= 0.8 ? '✅' : e.fiducia >= 0.5 ? '⚠️' : '❓';
  return `${emo} Scontrino letto!\n\n` +
    `📍 *${e.descrizione}*\n💶 €${e.importo.toFixed(2)}\n🏷️ ${e.categoria}\n📅 ${e.data}`;
}

// Dopo la lettura: chiede su Telegram in quale conto registrare (tastiera inline).
// Se la webapp non ha ancora sincronizzato i conti, ripiega sull'import nel conto principale.
async function proponiConto(chatId, messageId, expense) {
  if (contiWebapp.length === 0) {
    addPending(expense);
    await bot.editMessageText(
      riepilogo(expense) + '\n\n⚠️ Nessun conto disponibile (apri la webapp): ' +
      'lo registro nel conto principale. Riapri l\'app e rimanda la foto per scegliere il conto.',
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
    );
    return;
  }
  const sid = Math.random().toString(36).slice(2, 8);
  attesaConto.set(sid, expense);
  // Pulizia: scade dopo 10 minuti per non tenere memoria all'infinito.
  setTimeout(() => attesaConto.delete(sid), 10 * 60 * 1000);

  const inline_keyboard = contiWebapp.map((c, i) => ([{ text: c.nome, callback_data: `c:${sid}:${i}` }]));
  await bot.editMessageText(
    riepilogo(expense) + '\n\n🏦 In quale conto lo registro?',
    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard } }
  );
}

// L'utente ha scelto il conto sulla tastiera inline.
bot.on('callback_query', async (q) => {
  try {
    const m = (q.data || '').match(/^c:([a-z0-9]+):(\d+)$/i);
    if (!m) { await bot.answerCallbackQuery(q.id); return; }
    const expense = attesaConto.get(m[1]);
    const conto = contiWebapp[Number(m[2])];
    if (!expense || !conto) {
      await bot.answerCallbackQuery(q.id, { text: 'Scelta scaduta: rimanda la foto.' });
      return;
    }
    expense.contoId = conto.id;
    expense.contoNome = conto.nome;
    addPending(expense);
    attesaConto.delete(m[1]);
    await bot.answerCallbackQuery(q.id, { text: `Registrato in ${conto.nome}` });
    await bot.editMessageText(
      riepilogo(expense) + `\n\n🏦 Conto scelto: *${conto.nome}*\n\nRegistrato ✅ — compare nella webapp tra pochi secondi.`,
      { chat_id: q.message.chat.id, message_id: q.message.message_id, parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Errore callback conto:', err);
  }
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '👋 Ciao! Sono il tuo assistente per le spese.\n\n' +
    '📷 Inviami la foto di uno scontrino e lo registro automaticamente nelle tue finanze.\n\n' +
    'Tieni aperta la webapp: il movimento compare da solo entro pochi secondi.'
  );
});

bot.onText(/\/pending/, async (msg) => {
  const items = readPending();
  if (items.length === 0) {
    bot.sendMessage(msg.chat.id, '✅ Nessuna spesa in attesa di importazione.');
    return;
  }
  const lista = items.map(i =>
    `• ${i.descrizione} — €${i.importo.toFixed(2)} (${i.categoria}) [${i.data}]`
  ).join('\n');
  bot.sendMessage(msg.chat.id, `📋 Spese in attesa (${items.length}):\n${lista}`);
});

bot.onText(/\/cancella (.+)/, (msg, match) => {
  const id = match[1].trim();
  removePending(id);
  bot.sendMessage(msg.chat.id, `🗑️ Spesa rimossa dalla coda.`);
});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const waitMsg = await bot.sendMessage(chatId, '⏳ Analizzo lo scontrino…');

  try {
    // Prendi la versione più grande della foto
    const photo = msg.photo[msg.photo.length - 1];
    const fileInfo = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

    const base64 = await downloadImageAsBase64(fileUrl);
    const dati = await analizzaScontrino(base64);
    const expense = makeExpense(dati);
    await proponiConto(chatId, waitMsg.message_id, expense);

  } catch (err) {
    console.error('Errore analisi scontrino:', err);
    await bot.editMessageText(
      '❌ Non sono riuscito a leggere lo scontrino. Riprova con una foto più nitida.',
      { chat_id: chatId, message_id: waitMsg.message_id }
    );
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const doc = msg.document;
  if (!doc.mime_type?.startsWith('image/')) {
    bot.sendMessage(chatId, '📎 Inviami una foto dello scontrino, non un documento generico.');
    return;
  }
  // Tratta i documenti immagine come foto
  const waitMsg = await bot.sendMessage(chatId, '⏳ Analizzo lo scontrino…');
  try {
    const fileInfo = await bot.getFile(doc.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
    const base64 = await downloadImageAsBase64(fileUrl);
    const dati = await analizzaScontrino(base64, doc.mime_type);
    const expense = makeExpense(dati);
    await proponiConto(chatId, waitMsg.message_id, expense);
  } catch (err) {
    console.error('Errore:', err);
    bot.editMessageText('❌ Errore nell\'analisi. Riprova.', { chat_id: chatId, message_id: waitMsg.message_id });
  }
});

// ── API locale per la webapp ──────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// POST /conti — la webapp sincronizza i suoi conti [{ id, nome }] così il bot
// può farli scegliere su Telegram.
app.post('/conti', (req, res) => {
  const list = Array.isArray(req.body) ? req.body : (req.body && req.body.conti) || [];
  contiWebapp = list
    .filter((c) => c && c.id && c.nome)
    .map((c) => ({ id: String(c.id), nome: String(c.nome) }));
  res.json({ ok: true, count: contiWebapp.length });
});

// GET /pending — lista spese in attesa
app.get('/pending', (req, res) => {
  res.json(readPending());
});

// DELETE /pending/:id — marca come importata (rimuove dalla coda)
app.delete('/pending/:id', (req, res) => {
  removePending(req.params.id);
  res.json({ ok: true });
});

// DELETE /pending — svuota tutto
app.delete('/pending', (req, res) => {
  writePending([]);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🤖 Bot Telegram avviato (polling)`);
  console.log(`🧠 Lettura scontrini via askclaude → CLI 'claude' locale (nessuna API key)`);
  console.log(`🌐 API locale su http://localhost:${PORT}`);
  console.log(`📋 Endpoint webapp: GET http://localhost:${PORT}/pending`);
  console.log('\nInvia /start al bot su Telegram per iniziare.\n');
});
