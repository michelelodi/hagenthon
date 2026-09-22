# Provenienza e copertura

## Source Map

| Source | Used for |
|--------|----------|
| `Accenture Brand Guidelines.pdf` — «Accenture Branding guidelines», edizione **luglio 2026**, 99 pagine | palette e valori esatti, scala e pesi tipografici, regole del Greater Than symbol, voce del brand, principi sulla generative AI, riferimenti WCAG |
| Un deck HTML prodotto applicando le guidelines, e poi rifatto a metà delle slide | pattern CSS, struttura di slide, diagrammi SVG, CSS di stampa |
| **Esperienza d'uso della skill stessa**, non il PDF | [STRUTTURA-DECK.md](STRUTTURA-DECK.md) per intero, la § Verifica meccanica di [CHECKLISTS.md](CHECKLISTS.md), e gli ultimi tre casi di [PITFALLS.md](PITFALLS.md) |

⚠️ **Una parte di questa skill non viene dalle guidelines.** Le guidelines non
dicono quante slide fare, in che ordine, né come si scrive una sezione su stato e
sviluppi futuri: quel materiale nasce da errori osservati usando la skill, ed è
segnalato come tale nella riga qui sopra e in testa a
[STRUTTURA-DECK.md](STRUTTURA-DECK.md). Sono regole di mestiere: se il
committente ha un formato proprio, vince il suo.

La distillazione è **sintesi**, non citazione: le regole qui sono riformulate in
forma operativa. Le uniche citazioni letterali sono due frasi brevi in
[CORE-PRINCIPLES.md](CORE-PRINCIPLES.md), attribuite.

## Come è stata letta la fonte

Il PDF **non è stato letto come immagini**: in questo ambiente `pdftoppm` non è
installato, quindi il rendering delle pagine non era disponibile. Il testo è
stato estratto con `pdftotext -layout`, ottenendo 99 pagine e circa 170 000
caratteri.

**Conseguenza da tenere presente:** `pdftotext -layout` interleava le colonne
del layout originale. Righe contigue nel testo estratto possono appartenere a
colonne diverse della stessa pagina. Ogni regola in questa skill è stata
verificata per coerenza semantica prima di essere scritta, ma la ricostruzione
di passaggi lunghi non è affidabile.

## Copertura per sezione

| Sezione della fonte | Pagine | Copertura | Dove |
|---|---|---|---|
| Logo | 16 | **buona** sulle regole testuali del Greater Than symbol; nulla sulle proporzioni e sullo spazio di rispetto, che sono espressi graficamente | TOKENS, CORE-PRINCIPLES |
| Motion | 13 | **assente** — interamente visiva | — |
| Reinvented with Accenture | 12 | **non distillata** — campagna, fuori dallo scopo di questa skill | — |
| Our voice | 8 | **buona** | CORE-PRINCIPLES § Voce |
| Illustration | 8 | **superficiale** — in gran parte visiva | — |
| Color | 8 | **buona** sui valori e sulle regole d'uso; la matrice di contrasto WCAG 2.2 risulta illeggibile nel testo estratto | TOKENS |
| Typography | 7 | **buona** | TOKENS, CORE-PRINCIPLES |
| Photography | 7 | **superficiale** — in gran parte visiva | — |
| Icons | 5 | **superficiale** — in gran parte visiva | — |
| Gradients | 3 | **superficiale** | — |
| Brand aesthetic | 3 | **superficiale** | — |
| Generative AI | 2 | **buona** — i quattro principi e la regola di dichiarazione | CORE-PRINCIPLES § Generative AI |
| Sustainable brand merchandise | 3 | **non distillata** — fuori scopo | — |

## Cosa è stato aggiunto, e non viene dalla fonte

I **rapporti di contrasto** in [TOKENS.md](TOKENS.md) sono calcolati con la
formula WCAG sui valori HEX delle guidelines, non letti dal documento. Servono
come sostituto pratico della matrice ufficiale, che nel testo estratto non è
recuperabile. Se divergono dalla matrice del PDF, **vince il PDF**.

## Copertura degli esempi

| Area della fonte | Esempio distillato |
|---|---|
| Colore e tipografia applicati | `examples/html-css.md` § Base CSS |
| Struttura di una presentazione | `examples/html-css.md` § Slide |
| Greater Than symbol in HTML | `examples/html-css.md` § Il simbolo |
| Diagrammi e infografiche | `examples/html-css.md` § Diagrammi SVG |
| Stampa | `examples/html-css.md` § Stampa |
| Voce del brand | `examples/REQUESTS.md` § Riscrittura |
| Motion, Illustration, Photography, Icons | **nessuno**: contenuto visivo non accessibile dal testo estratto |
