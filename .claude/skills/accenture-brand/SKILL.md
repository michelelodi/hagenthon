---
name: accenture-brand
description: >-
  Genera e verifica presentazioni, pagine HTML e documenti conformi al brand
  Accenture: palette esatta, tipografia, regole del Greater Than symbol, voce
  del brand e principi sull'uso della gen AI. Usare quando si deve produrre o
  revisionare un artefatto con l'identità Accenture — slide, deck HTML, report,
  landing page, diagrammi — o quando si chiede «fai una presentazione
  Accenture», «applica il branding», «è conforme alle brand guidelines?».
argument-hint: "[--verifica <percorso>] [--slide] [--documento]"
license: MIT
metadata:
  author: ai-factory · aif-distillation
  version: "1.0"
  category: brand-design
---

# Accenture brand

Distillata dalle **Accenture Branding guidelines, edizione luglio 2026** (99 pagine).

## Cosa fa questa skill

Produce artefatti che un brand manager riconoscerebbe come conformi, e li
verifica prima della consegna. Non è un riassunto delle guidelines: è la parte
operativa — valori esatti da incollare, regole di do/don't, e un punto di
partenza CSS.

**Quando usarla:** qualsiasi artefatto con l'identità Accenture — deck,
presentazione HTML, documento, report, pagina, diagramma — sia da produrre sia
da revisionare.

**Cosa deve produrre:** l'artefatto richiesto, più una dichiarazione esplicita
di **cosa non hai potuto rispettare** e perché (tipicamente: i font commerciali
e il logo ufficiale). Un artefatto che tace sulle proprie deviazioni è peggio di
uno che le dichiara.

## Le tre cose che si sbagliano sempre

Leggile prima di scrivere una riga di CSS.

1. **Graphik e GT Sectra Fine sono font commerciali.** In un file locale non li
   hai. Il fallback corretto è **Arial**, perché è quello che le guidelines
   stesse prevedono — non una scorciatoia tua. Dichiaralo.
2. **Non riprodurre il logo Accenture se non hai l'asset.** Ridisegnarlo o
   approssimarlo è una violazione. Senza il file, usa un lockup testuale e dillo.
3. **Il Greater Than symbol è sempre pieno e non si altera.** Niente gradienti,
   immagini o texture al suo interno, niente ritagli, niente rotazioni.

## Workflow

### 1. Stabilisci il contesto

| Domanda | Perché cambia l'output |
|---|---|
| Light o dark mode? | Il **light mode è il default del brand**; il dark chiede spaziatura più generosa |
| Hai gli asset ufficiali (logo, font)? | Decide se dichiarare le sostituzioni |
| È per schermo, stampa o proiezione? | Cambia scala tipografica e contrasto |
| Ci sono dati o infografiche? | I colori secondari servono **solo** a quello, e con parsimonia |
| È un deck, o un documento a lettura libera? | Un deck ha un arco e un limite di densità per slide |
| Deve dire anche **dove va** il lavoro, non solo dov'è arrivato? | Aggiunge la sezione su stato e prossimi passi, che ha regole di scrittura proprie |

### 2. Struttura il documento, prima di scriverlo

[references/STRUTTURA-DECK.md](references/STRUTTURA-DECK.md). Le guidelines non
dicono quante slide fare: quella pagina sì, ed è la differenza fra un artefatto
conforme e uno leggibile. In breve: **un primo deck ha quasi sempre il doppio
delle slide che servono**, una slide sta in una schermata, e l'arco copre cinque
momenti — l'ultimo dei quali è *dove siamo e dove andiamo*, che manca quasi
sempre e cambia come viene letto tutto il resto.

### 3. Applica i valori

Copia da [references/TOKENS.md](references/TOKENS.md) — palette, scala
tipografica, specifiche del simbolo. **Non inventare tinte intermedie:** la
scala viola ha cinque valori e sono quelli.

### 4. Scrivi nella voce del brand

[references/CORE-PRINCIPLES.md](references/CORE-PRINCIPLES.md) § Voce. In breve:
voce attiva, frasi che si leggono a voce alta, zero gergo. Il brand chiama
«weekend language» il registro da usare quando si parla di tecnologia.

### 5. Se usi gen AI per immagini o testo

[references/CORE-PRINCIPLES.md](references/CORE-PRINCIPLES.md) § Generative AI.
La regola che decide: **se si nota, è sbagliato.** E le immagini modificate con
AI vanno dichiarate in didascalia.

### 6. Verifica prima di consegnare

[references/CHECKLISTS.md](references/CHECKLISTS.md). Riporta i controlli che
**non** passano, non solo quelli che passano.

**Esegui la § Verifica meccanica, non limitarti a rileggere.** Le regole di
questa skill si sono già dimostrate insufficienti da sole: sono state scritte,
lette e violate comunque, perché un principio si parafrasa mentre un comando
restituisce un numero. I controlli che tornano vuoti o con una cifra sono nel
cancello, con il comando accanto.

## File di questa skill

| File | Contenuto |
|---|---|
| [references/TOKENS.md](references/TOKENS.md) | Valori esatti: palette, tipografia, simbolo. Pronti da incollare |
| [references/CORE-PRINCIPLES.md](references/CORE-PRINCIPLES.md) | Le regole che decidono: colore, tipografia, logo, voce, gen AI |
| [references/STRUTTURA-DECK.md](references/STRUTTURA-DECK.md) | Quante slide, in che ordine, e come si scrive «stato e prossimi passi» |
| [references/CHECKLISTS.md](references/CHECKLISTS.md) | Il cancello di verifica pre-consegna, con i controlli eseguibili |
| [references/PITFALLS.md](references/PITFALLS.md) | Errori tipici e come accorgersene |
| [examples/html-css.md](examples/html-css.md) | Base CSS, pattern di slide, diagrammi SVG |
| [examples/REQUESTS.md](examples/REQUESTS.md) | Come si invoca, con esempi |
| [references/SOURCE-MAP.md](references/SOURCE-MAP.md) | Provenienza e copertura |

## Limiti di questa distillazione

Dichiarali se qualcuno chiede quanto è affidabile:

- La fonte è stata letta come **testo estratto**, non come immagini. Le regole
  espresse solo graficamente — proporzioni di layout, esempi visivi, griglie —
  **non sono in questa skill**.
- L'estrazione interleava le colonne del layout originale: le regole qui sono
  state verificate una per una per coerenza semantica, ma le sezioni **Motion**,
  **Illustration**, **Photography** e **Icons** sono coperte solo in superficie
  perché il loro contenuto è in gran parte visivo.
- Le guidelines contengono una **matrice di contrasto WCAG 2.2** testo/fondo che
  nel testo estratto risulta illeggibile. Per le combinazioni di colore usa i
  rapporti calcolati in [references/TOKENS.md](references/TOKENS.md), e per la
  matrice ufficiale apri il PDF.

## Ownership

- **Scrive:** solo gli artefatti richiesti dall'utente (file HTML, CSS, documenti).
- **Non scrive:** niente in `.ai-factory/`, niente configurazione, niente altre skill.
- **Config:** legge `language.ui` e `language.artifacts` da `.ai-factory/config.yaml`
  quando esiste, per decidere la lingua dei testi generati.
