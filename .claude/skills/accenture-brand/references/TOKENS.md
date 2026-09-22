# Valori esatti

Pronti da incollare. Non inventare tinte intermedie: le scale sono quelle che
seguono e sono chiuse.

## Palette

### Scala viola

Il **core color del brand è `#A100FF`**. Gli altri quattro esistono per dare
flessibilità di tono e, soprattutto, per **garantire il contrasto del testo**.

| Token | HEX | Uso |
|---|---|---|
| viola scuro | `#460073` | testo su fondo chiaro, fondi molto scuri |
| viola medio | `#7500C0` | testo su fondo chiaro, stati premuti |
| **viola core** | **`#A100FF`** | il colore del brand: accenti, display, il simbolo |
| viola chiaro | `#C2A3FF` | testo su fondo scuro, elementi secondari |
| viola tenue | `#E6DCFF` | corpo su fondo scuro, fondi tenui |

### Neutri

| Token | HEX |
|---|---|
| nero | `#000000` |
| grigio | `#818180` |
| grigio chiaro | `#CFCFCF` |
| nebbia | `#F1F1EF` |
| bianco | `#FFFFFF` |

### Secondari

**Solo per infografiche, e con parsimonia.** Non sono colori di interfaccia e
non sostituiscono la scala viola.

| Token | HEX | Nota |
|---|---|---|
| rosa | `#FF50A0` | |
| blu | `#224BFF` | |
| acqua | `#05F2DB` | **non usare in light mode** |

## Contrasto

I rapporti sotto sono **calcolati** secondo la formula WCAG, non stimati. Soglie:
4,5:1 per il corpo del testo, 3:1 per il testo grande (≥ 24 px, o ≥ 19 px in
semibold).

⚠️ Le guidelines contengono una **matrice di contrasto WCAG 2.2** testo/fondo che
nel testo estratto dal PDF risulta illeggibile. Questi valori sono un sostituto
pratico e verificabile; per la matrice ufficiale apri il PDF.

| Colore | HEX | Su bianco | Su nero |
|---|---|---|---|
| viola scuro | `#460073` | **13,93:1** AAA | 1,51:1 ✕ |
| viola medio | `#7500C0` | **8,34:1** AAA | 2,52:1 ✕ |
| viola core | `#A100FF` | **5,30:1** AA | 3,96:1 solo testo grande |
| viola chiaro | `#C2A3FF` | 2,10:1 ✕ | **9,98:1** AAA |
| viola tenue | `#E6DCFF` | 1,31:1 ✕ | **16,05:1** AAA |
| grigio | `#818180` | 3,90:1 solo testo grande | **5,39:1** AA |
| grigio chiaro | `#CFCFCF` | 1,56:1 ✕ | **13,48:1** AAA |
| nebbia | `#F1F1EF` | 1,13:1 ✕ | **18,57:1** AAA |
| rosa | `#FF50A0` | 3,04:1 solo testo grande | **6,91:1** AA |
| blu | `#224BFF` | **5,97:1** AA | 3,52:1 solo testo grande |
| acqua | `#05F2DB` | 1,43:1 ✕ | **14,73:1** AAA |

### Le tre conseguenze pratiche

1. **`#A100FF` non regge il corpo del testo su nero** (3,96:1). Su fondo scuro
   usalo per display e accenti; per il testo scendi a `#C2A3FF` o `#E6DCFF`.
2. **Su bianco, per il testo viola usa `#7500C0` o `#460073`**, non il core.
   Il core passa di misura (5,30:1) ma i due più scuri danno margine.
3. **`#A100FF` come fondo con testo bianco dà 5,30:1**: funziona per i pulsanti.

## Tipografia

### Primaria — Graphik

| Peso | Uso |
|---|---|
| Semibold | headline, sub-heading, section heading |
| Regular | paragraph heading, corpo, didascalie, note e small print |
| Medium | sub-heading e section heading **sotto i 12 pt**, o su fondo scuro |

Graphik è un sistema razionalista a basso contrasto e x-height ampia: versatile
per display, testo, didascalie e UI. Mantieni una **distinzione netta fra i pesi**
— se due livelli si somigliano, la gerarchia non si legge.

### Secondaria — GT Sectra Fine

Serif contemporaneo con dettagli calligrafici, pesi Regular e Bold. **Solo per
call-out text e citazioni.** Dà il tocco umano al messaggio; usato sul corpo lo
annulla.

### Sostituti

| Situazione | Font |
|---|---|
| Graphik non disponibile | **Arial** |
| Giapponese | Hiragino Gothic · Noto Sans |

**Arial è il sostituto previsto dalle guidelines**, non una scorciatoia. In un
file HTML locale non hai Graphik: usa Arial e dichiaralo.

Per GT Sectra Fine le guidelines **non nominano un sostituto**. Se ti serve un
serif, usa una pila di sistema (`Georgia, "Times New Roman", serif`) e dichiara
che non è il font del brand.

## Greater Than symbol

| Regola | Dettaglio |
|---|---|
| Sempre **pieno** | mai contorno, mai riempimenti parziali |
| Colori | `#A100FF` per default; **nero** o **bianco** quando il colore non è un'opzione o il viola non contrasta abbastanza col fondo |
| Accompagna sempre il logo | non vive da solo come se fosse il logo |
| Artwork | usa il file fornito. **Non alterarlo in alcun modo** |
| Integrità | sempre intero, **mai ritagliato**, orientamento originale |
| Dentro il simbolo | **vietati** immagini, gradienti, texture |
| Fondi ammessi | colore pieno, gradienti, fotografia — scegliendo la versione che dà contrasto forte |

## Light e dark mode

- Il **light mode è il default del brand**.
- Il **dark mode chiede spaziatura più generosa** — non è il light invertito.
- In entrambi, il viola è il protagonista e **i colori secondari compaiono
  raramente**.
- `#05F2DB` (acqua) **non va in light mode**.

## Variabili CSS pronte

```css
:root {
  /* Scala viola */
  --acn-viola-scuro:  #460073;
  --acn-viola-medio:  #7500C0;
  --acn-viola:        #A100FF;  /* core */
  --acn-viola-chiaro: #C2A3FF;
  --acn-viola-tenue:  #E6DCFF;

  /* Neutri */
  --acn-nero:          #000000;
  --acn-grigio:        #818180;
  --acn-grigio-chiaro: #CFCFCF;
  --acn-nebbia:        #F1F1EF;
  --acn-bianco:        #FFFFFF;

  /* Secondari — solo infografiche, con parsimonia */
  --acn-rosa:  #FF50A0;
  --acn-blu:   #224BFF;
  --acn-acqua: #05F2DB;  /* non in light mode */

  /* Tipografia: Arial è il sostituto sanzionato di Graphik */
  --acn-sans:  Graphik, Arial, Helvetica, sans-serif;
  --acn-serif: "GT Sectra Fine", Georgia, "Times New Roman", serif;
}
```
