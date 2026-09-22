# Navigation Report — Material Design 3
Progetto: Finanze di Famiglia — hagenthon
Generato: 2026-09-22 11:36 Europe/Rome
Design system: Material Design 3
Schermate totali: 9

## Punto di Accesso Principale
**File:** `dashboard.html`
**Motivo:** dopo il login l'utente atterra sulla Dashboard per avere subito il colpo d'occhio su grafici e saldo aggregato.

## Mappa di Navigazione

> ℹ️ Solo collegamenti verso file effettivamente generati e presenti nella cartella di output. Tutti i link sono utilizzabili in demo.

### login.html — Login
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Accedi" | btn | dashboard.html | ✅ |

### dashboard.html — Dashboard
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| nav bar "Conti" | menu | home.html | ✅ |
| nav bar "Dashboard" | menu | dashboard.html | ✅ |

### dashboard-empty.html — Dashboard Empty State
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Aggiungi un movimento" | btn | home.html | ✅ |
| nav bar "Dashboard" | menu | dashboard.html | ✅ |
| nav bar "Conti" | menu | home.html | ✅ |

### home.html — Lista Conti
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Nuovo conto" | btn | nuovo-conto.html | ✅ |
| card conto (click) | card | dettaglio-conto.html | ✅ |
| nav bar "Dashboard" | menu | dashboard.html | ✅ |
| nav bar "Conti" | menu | home.html | ✅ |

### home-empty.html — Lista Conti Empty State
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| button "Crea il tuo primo conto" | btn | nuovo-conto.html | ✅ |
| nav bar "Dashboard" | menu | dashboard.html | ✅ |
| nav bar "Conti" | menu | home.html | ✅ |

### nuovo-conto.html — Nuovo Conto
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| arrow_back | back | home.html | ✅ |
| button "Annulla" | btn | home.html | ✅ |
| button "Crea conto" (submit) | btn | dettaglio-conto-empty.html | ✅ |

### dettaglio-conto.html — Dettaglio Conto Lista Movimenti
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| arrow_back | back | home.html | ✅ |
| FAB "Nuovo movimento" | fab | nuovo-movimento.html | ✅ |
| nav bar "Dashboard" | menu | dashboard.html | ✅ |
| nav bar "Conti" | menu | home.html | ✅ |

### dettaglio-conto-empty.html — Dettaglio Conto Empty State
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| arrow_back | back | home.html | ✅ |
| button "Aggiungi il primo movimento" | btn | nuovo-movimento.html | ✅ |
| nav bar "Dashboard" | menu | dashboard.html | ✅ |
| nav bar "Conti" | menu | home.html | ✅ |

### nuovo-movimento.html — Nuovo Movimento
| Elemento | Tipo | Destinazione | File esistente |
|----------|------|--------------|----------------|
| arrow_back | back | dettaglio-conto.html | ✅ |
| button "Annulla" | btn | dettaglio-conto.html | ✅ |
| button "Salva" (submit) | btn | dettaglio-conto.html | ✅ |

> 🔗 Link utilizzabili in demo: **15 su 15**

## Riepilogo Flusso Completo

L'utente accede tramite `login.html` e atterra su `dashboard.html` per il colpo d'occhio immediato su grafici e saldo aggregato. Da lì naviga via Navigation Bar MD3 (bottom) alla lista conti (`home.html` / `home-empty.html`). Dalla lista può creare un nuovo conto (`nuovo-conto.html`) — al salvataggio arriva su `dettaglio-conto-empty.html` — oppure aprire un conto esistente (`dettaglio-conto.html`). Dal dettaglio conto aggiunge movimenti tramite l'Extended FAB (`nuovo-movimento.html`, con Segmented Button Entrata/Uscita e categorie dinamiche) e può eliminare quelli esistenti con confirm(). La Navigation Bar MD3 è globale su tutte le schermate post-login eccetto i form.

## Schermate Isolate
Nessuna schermata isolata rilevata. Tutte le 9 schermate sono raggiungibili dall'entry point tramite il flusso di navigazione.
