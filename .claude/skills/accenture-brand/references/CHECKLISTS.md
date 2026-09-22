# Cancello di verifica

Da passare **prima** di consegnare. Riporta i controlli che non passano, non
solo quelli che passano: un artefatto che tace sulle proprie deviazioni è
peggio di uno che le dichiara.

## Colore

- [ ] La palette usa **solo** i valori di [TOKENS.md](TOKENS.md). Nessuna tinta intermedia inventata
- [ ] I fondi e i bordi scuri derivano da trasparenze o `color-mix()` sui colori
      del brand, non da esadecimali scelti a occhio — vedi
      [PITFALLS.md](PITFALLS.md) § fondi scuri. Controllo rapido:
      `grep -oE '#[0-9A-Fa-f]{6}' file.html | tr 'a-f' 'A-F' | sort -u`
- [ ] Il viola core `#A100FF` non porta **testo** su fondo scuro. 3,96:1 passa
      solo come *testo grande*, cioè ≥ 24 px, oppure ≥ 18,7 px se è bold. Sotto
      quella soglia — etichette, occhielli, righe di tabella — si scende a
      `#C2A3FF` (9,98:1). Il core resta per display e cifre grandi
- [ ] Il testo viola su bianco usa `#7500C0` o `#460073`, non il core
- [ ] I secondari (rosa, blu, acqua) compaiono **solo** in infografiche, e raramente
- [ ] `#05F2DB` non compare in light mode
- [ ] Ogni coppia testo/fondo raggiunge 4,5:1 per il corpo, 3:1 per il testo grande
- [ ] **Nessuna informazione dipende dal solo colore**

## Tipografia

- [ ] Graphik dove disponibile, **Arial** come fallback dichiarato
- [ ] GT Sectra Fine (o serif dichiarato) **solo** su call-out e citazioni
- [ ] Semibold titoli · Regular corpo · Medium sotto i 12 pt o su fondo scuro
- [ ] I pesi adiacenti si distinguono a occhio
- [ ] Il testo si ridimensiona senza rompere il layout

## Logo e simbolo

- [ ] Il logo ufficiale **non è stato ricostruito** senza l'asset
- [ ] Il nome dell'azienda scritto come testo è reso come **attribuzione**, non
      come marchio: né maiuscolo, né spaziato, né nel viola del brand. Quelle tre
      cose insieme sono il wordmark ricomposto con il font sostitutivo
- [ ] Il Greater Than symbol è pieno, intero, non ritagliato, orientamento originale
- [ ] Nessuna immagine, gradiente o texture al suo interno
- [ ] Il colore del simbolo è viola core, oppure nero/bianco **per ragioni di contrasto**
- [ ] Il simbolo non è usato come se fosse il logo

## Voce

- [ ] Voce attiva dove possibile
- [ ] Ogni affermazione porta la sua prova
- [ ] Nessun attacco ai concorrenti
- [ ] Nessun gergo di settore non spiegato
- [ ] Il testo si legge a voce alta senza inciampi

## Generative AI

- [ ] Un umano ha guidato e possiede il risultato
- [ ] Il contenuto generato è stato valutato per accuratezza, autenticità e bias
- [ ] **Non si nota** che è generato
- [ ] Le immagini modificate con AI sono dichiarate in didascalia
- [ ] Gli avatar sintetici, se presenti, sono stilizzati e non fotorealistici

## Struttura

Vedi [STRUTTURA-DECK.md](STRUTTURA-DECK.md) per il perché di ognuno.

- [ ] Il conteggio delle slide è stato messo in discussione almeno una volta.
      Un primo deck ne ha quasi sempre il doppio del necessario
- [ ] Nessuna slide supera **1,20 schermate** alla dimensione di proiezione
- [ ] Nessun dato compare su due slide, se non dove dimostra qualcosa
- [ ] L'arco copre i cinque momenti: problema · prova · come funziona · come è
      stato costruito · dove siamo e dove andiamo
- [ ] Il problema è **concreto**: una persona, un luogo, un istante
- [ ] Ogni diagramma ha `<title>` e `<desc>`, e nessun testo esce dalla sua scatola

### Se il deck contiene stato e prossimi passi

- [ ] **Fatto**, **aperto** e **prossimi passi** sono tre colonne distinte, non due
- [ ] Ciò che esiste è al presente; ciò che verrà è al futuro o dichiaratamente
      ipotetico. **Nessuna funzionalità futura scritta al presente**
- [ ] Ogni voce di «fatto» porta una prova rilanciabile
- [ ] Ogni voce di «aperto» porta il suo perché
- [ ] Nessuna data e nessuna stima: l'ordine è di dipendenza
- [ ] Il tono è constatativo — non si scusa e non promette

## Verifica meccanica

Le regole sopra si sono già dimostrate insufficienti da sole: sono state
**scritte, lette e violate comunque**, perché un principio si parafrasa mentre
un comando restituisce un numero. Esegui questi controlli, non affidarti alla
lettura.

**Colori fuori palette** — deve restituire vuoto:

```bash
grep -oE '#[0-9A-Fa-f]{3,6}' file.html | tr 'a-f' 'A-F' | sort -u | grep -viE   '^#(460073|7500C0|A100FF|C2A3FF|E6DCFF|000000|818180|CFCFCF|F1F1EF|FFFFFF|FF50A0|224BFF|05F2DB)$'
```

**Esadecimali crudi fuori dalla dichiarazione dei token** — se ce ne sono, una
modifica alla palette non si propaga: i valori vanno nominati una volta sola.

**Viola core su testo piccolo** — nel browser, deve restituire vuoto:

```js
[...document.querySelectorAll('*')].filter(e => {
  if (e.children.length || !e.textContent.trim()) return false
  const cs = getComputedStyle(e), px = parseFloat(cs.fontSize)
  const grande = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700)
  return cs.color === 'rgb(161, 0, 255)' && !grande
}).map(e => e.textContent.trim().slice(0, 40))
```

**Il nome dell'azienda non è un marchio** — attesi `textTransform: none`,
`letterSpacing: normal` e un neutro:

```js
const e = document.querySelector('<selettore dell-attribuzione>')
getComputedStyle(e).textTransform + ' / ' + getComputedStyle(e).letterSpacing
```

**Il contrasto non si inverte in stampa.** Un colore scelto per il fondo scuro
può essere illeggibile su carta: `#C2A3FF` dà 9,98:1 sul nero e **2,10:1** sul
bianco. Rileggi il blocco `@media print` cercando ogni colore che su schermo sta
su fondo scuro, e verifica che lì sia stato riportato a un tono che regge sul
bianco. Vedi [PITFALLS.md](PITFALLS.md) § il contrasto che si inverte.

**Densità delle slide** — vedi [STRUTTURA-DECK.md](STRUTTURA-DECK.md) § Densità.

**Testi dentro le loro scatole, nei diagrammi SVG:**

```js
const svg = document.querySelector('svg')
const rects = [...svg.querySelectorAll('rect')].map(r => ({
  x: +r.getAttribute('x'), y: +r.getAttribute('y'),
  w: +r.getAttribute('width'), h: +r.getAttribute('height') }))
;[...svg.querySelectorAll('text')].filter(t => {
  const b = t.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2
  const c = rects.filter(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h)
               .sort((a, z) => a.w * a.h - z.w * z.h)[0]
  return c && (b.x < c.x + 2 || b.x + b.width > c.x + c.w - 2)
}).map(t => t.textContent)
```

⚠️ **Gli screenshot non sono la verifica del colore.** Una compressione o una
scala cambiano i pixel, e un pannello che non dipinge restituisce un timeout che
sembra un difetto. Per i colori usa gli stili calcolati: sono la fonte, non una
riproduzione.

## Dichiarazione finale

Elenca sempre, in chiusura:

- Quali font sono stati sostituiti e con cosa
- Se il logo è assente e perché
- Quali regole visive non hai potuto verificare (le sezioni Motion,
  Illustration, Photography e Icons sono coperte solo in superficie)
- Qualsiasi controllo della lista sopra che non passa
