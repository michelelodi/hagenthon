# Errori tipici

## «Uso un font che somiglia a Graphik»

**Sintomo:** Inter, Helvetica Now, Founders Grotesk al posto di Graphik.

**Perché è un errore:** le guidelines nominano **un solo** sostituto, Arial.
Scegliere un font «più simile» sostituisce il giudizio del brand con il proprio.
Arial è meno elegante e più conforme.

## «Ridisegno il logo, tanto è semplice»

**Sintomo:** il wordmark composto con un font, o un `>` tipografico presentato
come il logo.

**Perché è un errore:** il logo è un asset, non una composizione. Senza il file,
la risposta corretta è **non metterlo** e dirlo. Il `>` tipografico è ammesso
come elemento grafico, non come sostituto del logo.

**Come accorgersene:** se non riesci a nominare il file da cui viene il logo,
non ce l'hai.

## «Il viola core per il testo, è il colore del brand»

**Sintomo:** corpo del testo in `#A100FF`.

**Perché è un errore:** 3,96:1 su nero e 5,30:1 su bianco. Sul nero non passa
per il corpo. La scala viola ha cinque toni **proprio** per risolvere questo.

## «Metto un gradiente dentro il simbolo, viene bene»

**Sintomo:** Greater Than symbol con riempimento non uniforme, o ritagliato dal
bordo della slide.

**Perché è un errore:** è la prima cosa esplicitamente vietata. Sempre pieno,
sempre intero.

## «Uso rosa e acqua come colori di accento»

**Sintomo:** secondari usati per pulsanti, bordi, evidenziazioni.

**Perché è un errore:** i secondari servono alle infografiche e vanno usati con
parsimonia. Come accenti di interfaccia diluiscono il viola, che è l'unico
colore che identifica il brand. E `#05F2DB` in light mode non ci va affatto.

## «Il dark mode è il light con i colori invertiti»

**Sintomo:** stessa spaziatura, colori scambiati.

**Perché è un errore:** il dark mode chiede respiro più generoso. E i pesi
tipografici cambiano: sotto i 12 pt o su fondo scuro si passa a Medium, perché
il Regular in negativo perde consistenza.

## «La gen AI si vede un po', ma si capisce che è un mock»

**Sintomo:** immagini con mani sbagliate, volti levigati, texture ripetute,
testo generato riconoscibile.

**Perché è un errore:** il criterio dichiarato è l'invisibilità. Se si nota, è
sbagliato — e il pubblico lo nota sempre meglio.

## «Ho generato l'immagine con l'AI, non serve dirlo»

**Perché è un errore:** le immagini modificate con AI vanno dichiarate in
didascalia. Il documento stesso lo fa sulle proprie.

## «Il colore distingue le due serie del grafico»

**Sintomo:** legenda che si basa solo sulla tinta.

**Perché è un errore:** il colore non deve portare da solo il significato. Serve
anche una differenza di forma, tratteggio, etichetta diretta o pattern.

## «Ho applicato tutto, è conforme»

**Perché è un errore:** questa skill è distillata da **testo estratto**, non
dalle immagini del PDF. Le regole di layout, griglia, fotografia, illustrazione,
icone e motion sono in gran parte visive e **qui non ci sono**. Dire «conforme»
senza dichiararlo è una sovra-affermazione.

## «Mi invento i fondi scuri, la palette non ne ha»

**Sintomo:** in un deck o un'interfaccia dark compaiono `#0A0A0A`, `#141414`,
`#2C2C2C`, `#120021` e simili per fondi di scheda, bordi e livelli di rilievo.

**Perché capita, ed è una tensione reale.** La scala dei neutri va da `#000000`
a `#818180` senza toni intermedi: è una palette pensata per il **light mode**,
che è il default del brand. Costruire una gerarchia di superfici su fondo nero
— scheda, bordo, rilievo — richiede toni che nella palette non esistono.

**Cosa fare invece di inventare esadecimali.** Dichiara la trasparenza sopra un
colore sanzionato: non stai introducendo colori nuovi, stai modulando quelli del
brand.

```css
/* ✕ Colori inventati: 17 esadecimali fuori palette in un solo deck */
.scheda { background: #0a0a0a; border-color: #262626; }
.scheda.evidenza { background: #120021; }

/* ✓ Trasparenze sopra i colori del brand: nessun colore nuovo */
.scheda {
  background: rgb(255 255 255 / 3%);          /* rilievo sul nero */
  border: 1px solid rgb(255 255 255 / 12%);
}
.scheda.evidenza {
  background: color-mix(in srgb, var(--acn-viola) 12%, var(--acn-nero));
  border-color: var(--acn-viola-medio);
}
```

`color-mix()` è supportato da tutti i browser correnti e rende **ispezionabile**
la derivazione: chi legge il CSS vede che il fondo viene dal viola del brand, non
da una tinta scelta a occhio.

**Come accorgersene:** estrai tutti gli esadecimali dal file e confrontali con
la palette. Qualunque valore fuori elenco è da giustificare o da convertire.

```bash
grep -oE '#[0-9A-Fa-f]{6}' file.html | tr 'a-f' 'A-F' | sort -u
```

**Nota di merito del light mode.** Questa difficoltà è un argomento in più per
il default del brand: in light mode `#FFFFFF`, `#F1F1EF` e `#CFCFCF` danno già
tre livelli di superficie, e non serve inventare nulla.

## «Non ho ricostruito il logo: ho solo scritto il nome»

**Sintomo:** il nome dell'azienda compare come testo, ma **maiuscolo, con
crenatura allargata e nel viola del brand** — in un angolo dell'intestazione,
dove sta un logo.

**Perché è un errore, anche se nessuno ha disegnato niente.** Quelle tre scelte
insieme — maiuscolo, spaziatura, colore di marchio — non sono formattazione: sono
la ricostruzione del wordmark con il font sostitutivo. È esattamente ciò che la
regola sull'asset vieta, ottenuto per un'altra strada. E il fallback è dichiarato
proprio perché **non** venga usato per approssimare il marchio.

**Cosa fare invece.** Decidere che ruolo ha quel testo, e renderlo di
conseguenza:

| Ruolo | Come si rende |
|---|---|
| **Attribuzione** — «chi ha fatto questa cosa» | tonda, minuscola dopo l'iniziale, in un neutro della palette |
| **Marchio** | serve l'asset. Senza asset, non si mette |

La presenza del brand la portano la palette, la tipografia e il Greater Than
symbol accanto al nome del prodotto. Non una parola travestita.

**Come accorgersene:** guarda gli stili calcolati, non il markup. Se su quel
testo `text-transform` è `uppercase`, `letter-spacing` è maggiore di zero e il
colore viene dalla scala viola, stai guardando un logo finto.

## «Il contrasto che si inverte»

**Sintomo:** un deck dark perfettamente leggibile a schermo, in cui stampando
sparisce metà del testo — occhielli, etichette, righe evidenziate.

**Perché capita.** Un colore scelto per il fondo scuro è scelto *contro il nero*.
Sul bianco lo stesso colore può crollare, e i due rapporti non si somigliano
affatto:

| Colore | Su nero | Su bianco |
|---|---|---|
| `#C2A3FF` | **9,98:1** | 2,10:1 ✕ |
| `#A100FF` | 3,96:1 | **5,30:1** |
| `#460073` | 2,10:1 ✕ | **13,93:1** |

Le due colonne sono quasi **invertite**. Un colore corretto in un contesto è
tipicamente sbagliato nell'altro: non è un caso limite, è la regola.

**Cosa fare invece.** Il blocco `@media print` non è un dettaglio di rifinitura:
è una **seconda tavolozza**, e va verificata come la prima. Ogni colore che a
schermo sta su fondo scuro va riportato al tono che regge sul bianco. Attenzione
in particolare a chi ha appena *corretto* un contrasto su schermo: è il momento
in cui si rompe la stampa, perché la correzione peggiora l'altro lato.

**Come accorgersene:** rileggi `@media print` con la tabella sopra accanto, e
conta se ogni colore da fondo scuro è stato riportato. Se il blocco è più corto
dell'elenco dei colori chiari che usi, ne manca qualcuno.

## «I prossimi passi si leggono come cose che esistono»

**Sintomo:** nella sezione su stato e sviluppi futuri le voci sono al presente
indicativo: «legge il documento dalla fotografia», «supporta più formati».

**Perché è un errore, e non solo di stile.** Un committente o una giuria legge
il presente come una dichiarazione di fatto. Se quella funzionalità non c'è, il
deck ha affermato il falso — e nel momento in cui qualcuno la cerca nella demo,
perdi la credibilità **anche su tutto il resto**, comprese le parti vere.

**Cosa fare invece.** Il tempo verbale separa i mondi: presente per ciò che
esiste, futuro o forma ipotetica per ciò che verrà. E tenere **tre** colonne —
fatto, aperto, prossimi passi — invece di due, perché un debito che conosci e
una scelta che farai non sono la stessa cosa.

**Come accorgersene:** leggi solo quella sezione, a voce alta, chiedendoti a ogni
riga «questo lo posso mostrare adesso?». Se la risposta è no e il verbo è al
presente, riscrivi la riga.

Il pattern di formulazione che regge è in
[STRUTTURA-DECK.md](STRUTTURA-DECK.md) § Momento 5.
