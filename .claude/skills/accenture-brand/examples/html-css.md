# HTML e CSS

Pattern estratti da un deck reale prodotto con queste guidelines. Non sono un
template da copiare intero: sono i pezzi che risolvono i problemi ricorrenti.

## Base CSS

```css
:root {
  --acn-viola-scuro: #460073;
  --acn-viola-medio: #7500C0;
  --acn-viola:       #A100FF;
  --acn-viola-chiaro:#C2A3FF;
  --acn-viola-tenue: #E6DCFF;
  --acn-nero:        #000000;
  --acn-grigio:      #818180;
  --acn-grigio-chiaro:#CFCFCF;
  --acn-nebbia:      #F1F1EF;
  --acn-bianco:      #FFFFFF;
  /* Solo infografiche, con parsimonia. Acqua mai in light mode. */
  --acn-rosa:  #FF50A0;
  --acn-blu:   #224BFF;
  --acn-acqua: #05F2DB;

  /* Arial è il sostituto previsto dalle guidelines quando Graphik manca. */
  --acn-sans:  Graphik, Arial, Helvetica, sans-serif;
  --acn-serif: "GT Sectra Fine", Georgia, "Times New Roman", serif;
}

/* Light mode: il default del brand. */
body {
  background: var(--acn-bianco);
  color: var(--acn-nero);
  font-family: var(--acn-sans);
  line-height: 1.55;
}

/* Dark mode: NON è il light invertito — chiede più respiro. */
body.scuro {
  background: var(--acn-nero);
  color: var(--acn-bianco);
  line-height: 1.65;      /* interlinea più ampia */
  letter-spacing: 0.008em; /* il negativo chiude le forme */
}
```

## Gerarchia tipografica

Il peso fa la gerarchia, e i pesi devono distinguersi. `600` per i titoli, `400`
per il corpo.

```css
h1 { font-size: clamp(2.4rem, 6vw, 4.6rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1.02; }
h2 { font-size: clamp(1.7rem, 3.4vw, 2.7rem); font-weight: 600; letter-spacing: -0.02em; }
h3 { font-size: 1.06rem; font-weight: 600; }
p  { font-size: clamp(1rem, 1.35vw, 1.2rem); font-weight: 400; max-width: 62ch; }

/* Sotto i 12 pt, o su fondo scuro, Graphik passa a Medium. */
.nota, body.scuro .piccolo { font-weight: 500; font-size: 0.78rem; }
```

### Colore del testo: la regola che si sbaglia

```css
/* ✕ SBAGLIATO: 3,96:1 su nero, non passa per il corpo */
body.scuro p { color: var(--acn-viola); }

/* ✓ Su fondo scuro, per il testo si scende nella scala */
body.scuro p       { color: var(--acn-viola-tenue); }  /* 16,05:1 */
body.scuro .accento{ color: var(--acn-viola-chiaro); } /* 9,98:1  */

/* ✓ Su bianco, per il testo viola si salgono i toni scuri */
body p .accento { color: var(--acn-viola-medio); }     /* 8,34:1  */

/* ✓ Il core come FONDO con testo bianco funziona: 5,30:1 */
.pulsante { background: var(--acn-viola); color: var(--acn-bianco); }
```

## Citazioni e call-out

L'unico posto dove va il serif. Sul corpo lo annulla.

```css
blockquote {
  font-family: var(--acn-serif);
  font-size: clamp(1.3rem, 2.6vw, 2rem);
  line-height: 1.32;
  border-left: 4px solid var(--acn-viola);
  padding-left: 1.6rem;
  max-width: 46ch;
}
```

## Il Greater Than symbol

**Senza l'asset ufficiale non riprodurre il logo.** Il `>` tipografico è ammesso
come elemento grafico, non come sostituto del logo.

```html
<!-- Lockup testuale: il logo NON è riprodotto, e va dichiarato -->
<span class="prodotto">Nome del prodotto<span class="marchio">&gt;</span></span>
<span class="org">
  <span class="a">Accenture</span><br />
  <span class="b">Nome della practice</span>
</span>
```

```css
.marchio { color: var(--acn-viola); font-weight: 600; }
.org .a { color: var(--acn-viola-chiaro); text-transform: uppercase; letter-spacing: 0.22em; font-weight: 600; font-size: 0.62rem; }
.org .b { color: var(--acn-grigio);      text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.58rem; }
```

Con l'asset vero, invece: `<img>` o `<svg>` inline **non alterato**, e niente
`filter`, `mask`, `opacity` o `transform` sopra.

```css
/* ✕ Tutte violazioni: alterano l'artwork */
.simbolo { filter: hue-rotate(40deg); }
.simbolo { background-image: url(foto.jpg); }
.simbolo { transform: rotate(15deg); }
.simbolo { clip-path: inset(0 0 20% 0); }
```

## Slide

Una slide per schermata, navigazione da tastiera oltre allo scroll.

```css
.slide {
  min-height: 100vh;
  padding: 6vh 7vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  scroll-snap-align: start;
}
main { scroll-snap-type: y proximity; }

@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

```js
// Le frecce sono un'aggiunta per la proiezione: lo scroll resta la via
// principale, così la pagina funziona anche senza JavaScript.
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); vaiA(corrente() + 1) }
  if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); vaiA(corrente() - 1) }
})
```

## Stato e prossimi passi

La slide che chiude l'arco (vedi
[../references/STRUTTURA-DECK.md](../references/STRUTTURA-DECK.md) § Momento 5).
**Tre** colonne, non due: ciò che esiste, ciò che manca, ciò che verrà.

Il pattern che tiene le regole al loro posto è la marcatura del **tempo
verbale**: la terza colonna è l'unica con i verbi al futuro, e si vede.

```html
<section class="slide">
  <div class="interno">
    <div class="eyebrow">Dove siamo e dove andiamo</div>
    <h2>&lt;una frase che dice la linea, non il titolo della sezione&gt;</h2>

    <div class="griglia g3">
      <!-- 1. FATTO — presente indicativo, e ogni voce porta la sua prova -->
      <div class="scheda">
        <div class="num">FUNZIONA ADESSO</div>
        <ul class="punti">
          <li><strong>&lt;capacità&gt;.</strong> &lt;la prova: una cifra, un comando, un artefatto&gt;</li>
        </ul>
      </div>

      <!-- 2. APERTO — ogni voce porta il suo perché, senza scusarsi -->
      <div class="scheda">
        <div class="num">APERTO, E LO DICIAMO</div>
        <ul class="punti no">
          <li><strong>&lt;lacuna&gt;.</strong> &lt;perché è aperta: il vincolo, non la scusa&gt;</li>
        </ul>
      </div>

      <!-- 3. PROSSIMI PASSI — futuro, ordine di dipendenza, nessuna data -->
      <div class="scheda evidenza">
        <div class="num">I PROSSIMI PASSI</div>
        <ul class="punti">
          <li><strong>&lt;passo&gt;.</strong> Oggi &lt;come si fa adesso&gt;; &lt;cosa cambierebbe&gt;.</li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

Sulle classi: `punti` per gli elenchi affermativi, `punti no` per quelli che
elencano assenze (il marcatore diventa `×`), `scheda evidenza` sulla colonna che
vuoi far leggere per prima. Sono le stesse classi delle altre slide: la sezione
non ha bisogno di uno stile proprio, e darglielo la farebbe sembrare un'appendice.

### Se lo spazio non basta per tre colonne

Non comprimere il testo: **togli la colonna «aperto» dalla slide** e portala
dove stanno i limiti dichiarati. Fatto e prossimi passi devono restare
affiancati, perché è il loro accostamento che comunica la direzione.

## Diagrammi SVG

Inline, con `<title>` e `<desc>`: un diagramma senza alternativa testuale è
un'informazione che esiste solo per chi vede.

```html
<figure>
  <svg viewBox="0 0 1100 340" role="img" aria-labelledby="t-x d-x">
    <title id="t-x">Cosa mostra il diagramma, in una riga</title>
    <desc id="d-x">La descrizione che sostituisce il diagramma per chi non lo vede.</desc>

    <rect x="8" y="96" width="150" height="112" rx="10"
          fill="#0a0a0a" stroke="#333"/>
    <text x="83" y="140" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="12"
          fill="#FFFFFF" font-weight="bold">Etichetta</text>

    <path d="M162 152 h34" stroke="#818180" stroke-width="1.5"
          fill="none" marker-end="url(#fr)"/>
    <defs>
      <marker id="fr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" fill="#818180"/>
      </marker>
    </defs>
  </svg>
  <figcaption>Cosa deve capire chi guarda, non cosa c'è disegnato.</figcaption>
</figure>
```

**Nelle infografiche il colore non basta.** Se due serie si distinguono solo per
tinta, aggiungi tratteggio, forma o etichetta diretta.

```css
.serie-a { fill: var(--acn-viola); }
.serie-b { fill: var(--acn-rosa); stroke-dasharray: 4 3; } /* anche il tratto */
```

## Numeri

```css
.cifra {
  font-size: clamp(2rem, 5vw, 3.4rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums; /* incolonna le cifre */
}
```

## Stampa

Un deck finisce sempre stampato o in PDF. Una slide per pagina, e i fondi scuri
diventano chiari.

```css
@media print {
  body { background: #fff; color: #000; }
  header, .contatore, .aiuto { display: none; }
  .slide { min-height: auto; page-break-after: always; border: none; padding: 2cm; }
  h1, h2, .cifra { color: #000; }
  p, figcaption { color: #333; }
  pre code, code { color: var(--acn-viola-scuro); } /* 13,93:1 su bianco */
}
```
