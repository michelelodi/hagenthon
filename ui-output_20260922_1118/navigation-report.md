# Navigation Report
Progetto: Finanze di Famiglia — hagenthon
Generato: 2026-09-22 11:25 Europe/Rome
Schermate totali: 9

## Punto di Accesso Principale
**File:** `dashboard.html`
**Motivo:** dopo il login l'utente atterra sulla Dashboard per avere subito il colpo d'occhio sul grafico (richiesta del team).

## Mappa di Navigazione

> ℹ️ Solo collegamenti verso file effettivamente generati e presenti nella cartella di output. Tutti i link sono utilizzabili in demo.

### login.html — Login
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Accedi" | btn | dashboard.html | ✅ |

### dashboard.html — Dashboard
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| bottom-nav "Conti" | menu | home.html | ✅ |
| bottom-nav "Dashboard" | menu | dashboard.html | ✅ |

### dashboard-empty.html — Dashboard Empty State
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| link "Aggiungi un movimento" | link | home.html | ✅ |
| bottom-nav "Dashboard" | menu | dashboard.html | ✅ |
| bottom-nav "Conti" | menu | home.html | ✅ |

### home.html — Lista Conti
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Nuovo conto" | btn | nuovo-conto.html | ✅ |
| card conto (click) | card | dettaglio-conto.html | ✅ |
| bottom-nav "Dashboard" | menu | dashboard.html | ✅ |
| bottom-nav "Conti" | menu | home.html | ✅ |

### home-empty.html — Lista Conti Empty State
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Crea il tuo primo conto" | btn | nuovo-conto.html | ✅ |
| bottom-nav "Dashboard" | menu | dashboard.html | ✅ |
| bottom-nav "Conti" | menu | home.html | ✅ |

### nuovo-conto.html — Nuovo Conto
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| breadcrumb "← Conti" | breadcrumb | home.html | ✅ |
| button "Annulla" | btn | home.html | ✅ |
| button "Crea conto" (submit) | btn | dettaglio-conto-empty.html | ✅ |

### dettaglio-conto.html — Dettaglio Conto Lista Movimenti
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| breadcrumb "← Conti" | breadcrumb | home.html | ✅ |
| button "Nuovo movimento" | btn | nuovo-movimento.html | ✅ |
| bottom-nav "Dashboard" | menu | dashboard.html | ✅ |
| bottom-nav "Conti" | menu | home.html | ✅ |

### dettaglio-conto-empty.html — Dettaglio Conto Empty State
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| breadcrumb "← Conti" | breadcrumb | home.html | ✅ |
| button "Aggiungi il primo movimento" | btn | nuovo-movimento.html | ✅ |
| bottom-nav "Dashboard" | menu | dashboard.html | ✅ |
| bottom-nav "Conti" | menu | home.html | ✅ |

### nuovo-movimento.html — Nuovo Movimento
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| breadcrumb "← Conto familiare" | breadcrumb | dettaglio-conto.html | ✅ |
| button "Annulla" | btn | dettaglio-conto.html | ✅ |
| button "Salva" (submit) | btn | dettaglio-conto.html | ✅ |

> 🔗 Link utilizzabili in demo: **15 su 15**

## Riepilogo Flusso Completo

L'utente accede tramite `login.html` e atterra su `dashboard.html` per il colpo d'occhio immediato su grafici e saldo aggregato. Da lì può navigare alla lista conti (`home.html` / `home-empty.html`). Dalla lista conti può creare un nuovo conto (`nuovo-conto.html`) — al salvataggio finisce su `dettaglio-conto-empty.html` — oppure aprire un conto esistente (`dettaglio-conto.html`). Dal dettaglio conto può aggiungere movimenti (`nuovo-movimento.html`, con toggle Entrata/Uscita e categorie dinamiche) ed eliminare quelli esistenti. La bottom navigation è globale su tutte le schermate post-login eccetto i form.

## Schermate Isolate
Nessuna schermata isolata rilevata. Tutte le 9 schermate sono raggiungibili dall'entry point tramite il flusso di navigazione.
