import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PENDING_FILE = join(__dirname, 'pending-expenses.json');

// ── Categorie uscite (speculari alla webapp) ──────────────────────────────────
const CATEGORIE_USCITA = [
  'Casa', 'Spesa', 'Ristoranti', 'Trasporti',
  'Salute', 'Abbigliamento', 'Svago', 'Istruzione',
  'Abbonamenti', 'Altro'
];

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

// ── Analisi scontrino con Claude Vision ───────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analizzaScontrino(base64Image, mimeType = 'image/jpeg') {
  const msg = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64Image }
        },
        {
          type: 'text',
          text: `Analizza questo scontrino e restituisci SOLO un oggetto JSON valido con questi campi:
{
  "importo": <numero float, es. 12.50>,
  "descrizione": "<negozio o descrizione breve, max 40 caratteri>",
  "data": "<data nel formato YYYY-MM-DD, usa oggi se non leggibile>",
  "categoria": "<una tra: ${CATEGORIE_USCITA.join(', ')}>",
  "fiducia": <numero 0-1 che indica quanto sei sicuro dell'estrazione>
}
Rispondi SOLO con il JSON, senza markdown, senza spiegazioni.`
        }
      ]
    }]
  });

  const text = msg.content[0].text.trim();
  return JSON.parse(text);
}

// ── Bot Telegram (polling) ────────────────────────────────────────────────────
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '👋 Ciao! Sono il tuo assistente per le spese.\n\n' +
    '📷 Inviami la foto di uno scontrino e lo aggiungerò automaticamente alle tue finanze.\n\n' +
    'Poi apri la webapp e clicca su "Importa da Telegram" per confermare.'
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

    const id = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const expense = {
      id,
      importo: dati.importo,
      descrizione: dati.descrizione,
      data: dati.data,
      categoria: dati.categoria,
      tipo: 'uscita',
      fiducia: dati.fiducia,
      fonte: 'telegram',
      timestamp: new Date().toISOString()
    };

    addPending(expense);

    const fiduciaEmoji = dati.fiducia >= 0.8 ? '✅' : dati.fiducia >= 0.5 ? '⚠️' : '❓';

    await bot.editMessageText(
      `${fiduciaEmoji} Scontrino letto!\n\n` +
      `📍 *${expense.descrizione}*\n` +
      `💶 €${expense.importo.toFixed(2)}\n` +
      `🏷️ ${expense.categoria}\n` +
      `📅 ${expense.data}\n\n` +
      `Apri la webapp e clicca su *"Importa da Telegram"* per confermare.`,
      { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
    );

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

    const id = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const expense = {
      id, importo: dati.importo, descrizione: dati.descrizione,
      data: dati.data, categoria: dati.categoria, tipo: 'uscita',
      fiducia: dati.fiducia, fonte: 'telegram', timestamp: new Date().toISOString()
    };
    addPending(expense);

    await bot.editMessageText(
      `✅ Scontrino letto!\n\n📍 *${expense.descrizione}*\n💶 €${expense.importo.toFixed(2)}\n🏷️ ${expense.categoria}\n📅 ${expense.data}\n\nApri la webapp e clicca *"Importa da Telegram"*.`,
      { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Errore:', err);
    bot.editMessageText('❌ Errore nell\'analisi. Riprova.', { chat_id: chatId, message_id: waitMsg.message_id });
  }
});

// ── API locale per la webapp ──────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

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
  console.log(`🌐 API locale su http://localhost:${PORT}`);
  console.log(`📋 Endpoint webapp: GET http://localhost:${PORT}/pending`);
  console.log('\nInvia /start al bot su Telegram per iniziare.\n');
});
