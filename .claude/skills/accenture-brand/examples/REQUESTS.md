# Come si invoca

## Produrre

```
/accenture-brand fai una presentazione HTML di 10 slide sul progetto X,
con architettura e un diagramma di flusso
```

```
/accenture-brand --slide deck per il comitato: 5 slide, dark mode, proiettato
```

```
/accenture-brand --documento report trimestrale in HTML, light mode, con due
grafici a barre
```

```
/accenture-brand applica il branding a <percorso del file>
```

## Verificare

```
/accenture-brand --verifica <percorso del file>
```

Attesa: il cancello di [CHECKLISTS.md](../references/CHECKLISTS.md) applicato
riga per riga, con l'elenco di **cosa non passa** e perché.

## Riscrittura nella voce del brand

**Prima**

> È stata implementata da parte del team una soluzione di machine learning
> che permette l'ottimizzazione dei processi di back-office, con l'obiettivo
> di non incorrere in inefficienze.

Tre problemi: voce passiva, gergo (`machine learning`, `back-office`), costrutto
negativo (`non incorrere in inefficienze`).

**Dopo**

> Abbiamo insegnato a un sistema a riconoscere da sé le pratiche ricorrenti.
> Ora il team le chiude in metà tempo.

Voce attiva, «weekend language» al posto del gergo, negativo girato in
affermativo, e il claim porta il suo dato.

## Cosa la skill deve rispondere quando mancano gli asset

**Richiesta:** «metti il logo Accenture in alto a sinistra»

**Risposta corretta:**

> Non ho l'asset del logo. Non lo ricostruisco: un logo approssimato è una
> violazione peggiore di un logo assente. Ho messo un lockup testuale —
> «Accenture / *nome della practice*» — che è il pattern usato dai documenti
> ufficiali del team. Se mi passi il file SVG o PNG lo sostituisco.

**Risposta sbagliata:** comporre il wordmark con un font simile e non dirlo.

## Cosa la skill deve dichiarare in chiusura

Sempre, anche quando tutto passa:

```
Font: Graphik non disponibile in un file locale → Arial, che è il sostituto
previsto dalle guidelines. GT Sectra Fine → pila serif di sistema; per questo
le guidelines non indicano un sostituto, quindi non è il font del brand.

Logo: non riprodotto, asset non disponibile. Lockup testuale al suo posto.

Non verificato: layout, griglia, fotografia, illustrazione, icone e motion.
Queste sezioni delle guidelines sono in gran parte visive e non sono coperte
da questa skill.
```
