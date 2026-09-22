# validated-spec.md

## META
- documento_originale: CONTEXT.md, CLAUDE.md, ADR-0001 (hagenthon repo)
- tipo_documento: requisiti + contesto di dominio
- data_analisi: 2026-09-22 11:12 Europe/Rome
- figma_in_input: no

---

## SCHERMATE

- id: login
  file: login.html
  titolo: Login
  tipo: base

- id: home
  file: home.html
  titolo: Home — Lista Conti
  tipo: base
  varianti:
    - id: home-empty
      file: home-empty.html
      condizione: nessun Conto ancora creato (localStorage privo di conti)

- id: home-empty
  file: home-empty.html
  titolo: Home — Nessun Conto (empty state)
  tipo: variante
  schermata_base: home
  condizione: nessun Conto ancora creato

- id: nuovo-conto
  file: nuovo-conto.html
  titolo: Nuovo Conto
  tipo: base

- id: dettaglio-conto
  file: dettaglio-conto.html
  titolo: Dettaglio Conto — Lista Movimenti
  tipo: base
  varianti:
    - id: dettaglio-conto-empty
      file: dettaglio-conto-empty.html
      condizione: Conto esistente ma senza Movimenti

- id: dettaglio-conto-empty
  file: dettaglio-conto-empty.html
  titolo: Dettaglio Conto — Nessun Movimento (empty state)
  tipo: variante
  schermata_base: dettaglio-conto
  condizione: Conto esiste ma non ha ancora Movimenti

- id: nuovo-movimento
  file: nuovo-movimento.html
  titolo: Nuovo Movimento
  tipo: base

- id: dashboard
  file: dashboard.html
  titolo: Dashboard
  tipo: base
  varianti:
    - id: dashboard-empty
      file: dashboard-empty.html
      condizione: nessun Movimento nel periodo selezionato (o in assoluto)

- id: dashboard-empty
  file: dashboard-empty.html
  titolo: Dashboard — Nessun dato nel periodo (empty state)
  tipo: variante
  schermata_base: dashboard
  condizione: nessun Movimento nel periodo selezionato

---

## SCHEMA ATOMICO

### login.html — Login
- page
  - header
    - logo/titolo app: "Finanze di famiglia"
  - main
    - form#login-form
      - input[type=password] label="Password" placeholder="Inserisci la password"
      - button[type=submit] "Accedi"
  - footer
    - nota: "Accesso locale — i dati restano nel tuo browser"

### home.html — Home Lista Conti
- page
  - header
    - titolo: "I tuoi conti"
    - button "Nuovo conto" (→ nuovo-conto.html)
  - main
    - lista card conti [ripetuta per ogni Conto]
      - card-conto
        - nome conto
        - saldo corrente (formattato €)
        - [click → dettaglio-conto.html]
  - bottom-nav
    - voce "Dashboard" (→ dashboard.html)
    - voce "Conti" [attiva] (→ home.html)

### home-empty.html — Home Empty State
- page
  - header
    - titolo: "I tuoi conti"
  - main
    - empty-state
      - illustrazione/icona conto
      - testo: "Non hai ancora nessun conto"
      - sottotesto: "Crea il tuo primo conto per iniziare a tracciare le spese"
      - button primario "Crea il tuo primo conto" (→ nuovo-conto.html)
  - bottom-nav
    - voce "Dashboard" (→ dashboard.html)
    - voce "Conti" [attiva] (→ home.html)

### nuovo-conto.html — Nuovo Conto
- page
  - header
    - breadcrumb/back: "← Conti" (→ home.html)
    - titolo: "Nuovo conto"
  - main
    - form#nuovo-conto-form
      - input[type=text] label="Nome conto" placeholder="es. Conto familiare"
      - input[type=number] label="Saldo iniziale (€)" placeholder="0,00" min=0
      - row-azioni
        - button[type=button] "Annulla" (→ home.html)
        - button[type=submit] "Crea conto" (→ dettaglio-conto-empty.html)

### dettaglio-conto.html — Dettaglio Conto Lista Movimenti
- page
  - header
    - breadcrumb/back: "← Conti" (→ home.html)
    - nome conto
    - saldo corrente (formattato €)
  - main
    - button "Nuovo movimento" (→ nuovo-movimento.html)
    - lista movimenti [ripetuta per ogni Movimento, ordine cronologico inverso]
      - item-movimento
        - data (gg/mm/aaaa)
        - categoria
        - tipo badge (Entrata | Uscita)
        - importo (€, verde se Entrata, rosso se Uscita)
        - button "Elimina" [icon trash] → confirm dialog → rimuove da localStorage, ricalcola Saldo
  - bottom-nav
    - voce "Dashboard" (→ dashboard.html)
    - voce "Conti" [attiva] (→ home.html)

### dettaglio-conto-empty.html — Dettaglio Conto Empty State
- page
  - header
    - breadcrumb/back: "← Conti" (→ home.html)
    - nome conto
    - saldo corrente (= saldo iniziale, formattato €)
  - main
    - empty-state
      - icona/illustrazione movimento
      - testo: "Nessun movimento ancora"
      - sottotesto: "Aggiungi il primo movimento per questo conto"
      - button primario "Aggiungi il primo movimento" (→ nuovo-movimento.html)
  - bottom-nav
    - voce "Dashboard" (→ dashboard.html)
    - voce "Conti" [attiva] (→ home.html)

### nuovo-movimento.html — Nuovo Movimento
- page
  - header
    - breadcrumb/back: "← [nome conto]" (→ dettaglio-conto.html)
    - titolo: "Nuovo movimento"
  - main
    - form#nuovo-movimento-form
      - field-tipo
        - toggle/radio: "Uscita" | "Entrata" (default: Uscita)
      - input[type=number] label="Importo (€)" placeholder="0,00" min=0.01
      - input[type=date] label="Data" (default: oggi)
      - select label="Categoria"
        [se tipo=Uscita]: Casa · Spesa · Ristoranti · Trasporti · Salute · Abbigliamento · Svago · Istruzione · Abbonamenti · Altro
        [se tipo=Entrata]: Stipendio · Rimborso · Regalo · Altro
      - row-azioni
        - button[type=button] "Annulla" (→ dettaglio-conto.html)
        - button[type=submit] "Salva" (→ dettaglio-conto.html)

### dashboard.html — Dashboard
- page
  - header
    - titolo: "Dashboard"
    - select "Filtra per conto": [Tutti i conti] + [lista conti]
  - main
    - selettore-periodo: tab/pill Mese | Trimestre | Anno
    - sezione-ripartizione
      - titolo: "Spese per categoria"
      - grafico a torta (pie chart) delle Uscite per Categoria nel periodo
      - legenda categorie con importo e percentuale
    - sezione-trend
      - titolo: "Trend"
      - grafico a barre (bar chart) Entrate vs Uscite per sotto-periodo
        (mese → settimane; trimestre → mesi; anno → mesi)
    - sezione-saldo-totale
      - saldo totale aggregato (tutti i conti o conto selezionato)
  - bottom-nav
    - voce "Dashboard" [attiva] (→ dashboard.html)
    - voce "Conti" (→ home.html)

### dashboard-empty.html — Dashboard Empty State
- page
  - header
    - titolo: "Dashboard"
    - select "Filtra per conto": [Tutti i conti] + [lista conti]
  - main
    - selettore-periodo: tab/pill Mese | Trimestre | Anno (sempre visibile)
    - empty-state
      - icona/illustrazione grafico
      - testo: "Nessun movimento in questo periodo"
      - link "Aggiungi un movimento" (→ home.html — l'utente sceglie da lì il conto)
  - bottom-nav
    - voce "Dashboard" [attiva] (→ dashboard.html)
    - voce "Conti" (→ home.html)

---

## NAVIGAZIONE

punto_di_accesso: dashboard.html
motivazione: dopo il login l'utente atterra sulla Dashboard per avere subito il colpo d'occhio sul grafico (richiesta esplicita del team)

mappa:
  - da: login.html
    elemento: button "Accedi"
    tipo: redirect
    verso: dashboard.html

  - da: dashboard.html
    elemento: voce bottom-nav "Conti"
    tipo: menu
    verso: home.html

  - da: home.html
    elemento: voce bottom-nav "Dashboard"
    tipo: menu
    verso: dashboard.html

  - da: home.html
    elemento: button "Nuovo conto"
    tipo: btn
    verso: nuovo-conto.html

  - da: home.html
    elemento: card conto (click)
    tipo: card
    verso: dettaglio-conto.html

  - da: home-empty.html
    elemento: button "Crea il tuo primo conto"
    tipo: btn
    verso: nuovo-conto.html

  - da: nuovo-conto.html
    elemento: button "Annulla"
    tipo: btn
    verso: home.html

  - da: nuovo-conto.html
    elemento: button "Crea conto" (submit OK)
    tipo: btn
    verso: dettaglio-conto-empty.html

  - da: dettaglio-conto.html
    elemento: breadcrumb "← Conti"
    tipo: breadcrumb
    verso: home.html

  - da: dettaglio-conto.html
    elemento: button "Nuovo movimento"
    tipo: btn
    verso: nuovo-movimento.html

  - da: dettaglio-conto-empty.html
    elemento: button "Aggiungi il primo movimento"
    tipo: btn
    verso: nuovo-movimento.html

  - da: dettaglio-conto-empty.html
    elemento: breadcrumb "← Conti"
    tipo: breadcrumb
    verso: home.html

  - da: nuovo-movimento.html
    elemento: button "Annulla"
    tipo: btn
    verso: dettaglio-conto.html

  - da: nuovo-movimento.html
    elemento: button "Salva" (submit OK)
    tipo: btn
    verso: dettaglio-conto.html

  - da: dashboard-empty.html
    elemento: link "Aggiungi un movimento"
    tipo: link
    verso: home.html

---

## CRITICITÀ RISOLTE

- criticità_1:
    problema: Prima accesso — nessuna password in localStorage
    soluzione_adottata: "Opzione C — password seedata con i dati demo. In non-demo, primo accesso usa qualsiasi password inserita come imposta-password. Una sola schermata login.html."

- criticità_2:
    problema: Lista categorie non definita nel documento
    soluzione_adottata: "Entrata: Stipendio · Rimborso · Regalo · Altro. Uscita: Casa · Spesa · Ristoranti · Trasporti · Salute · Abbigliamento · Svago · Istruzione · Abbonamenti · Altro."

- criticità_3:
    problema: Scope dashboard (tutti i conti o per conto?)
    soluzione_adottata: "Opzione C — aggregazione globale con selettore conto per filtrare (Tutti i conti | singolo conto)."

- navigazione_1:
    problema: Come si raggiunge la Dashboard?
    soluzione_adottata: "Bottom-nav globale con 2 voci (Dashboard | Conti) su tutte le schermate post-login eccetto i form."

- navigazione_2:
    problema: Punto di accesso post-login
    soluzione_adottata: "Dopo login → dashboard.html (primo colpo d'occhio sul grafico, richiesta del team)."

- navigazione_3:
    problema: Destinazione dopo submit form Nuovo Conto e Nuovo Movimento
    soluzione_adottata: "Nuovo Conto → dettaglio-conto-empty.html. Nuovo Movimento → dettaglio-conto.html."

- navigazione_4:
    problema: Tasto Annulla sui form
    soluzione_adottata: "Annulla Nuovo Conto → home.html. Annulla Nuovo Movimento → dettaglio-conto.html."

- requisito_aggiunto_1:
    problema: Eliminazione di un Movimento non prevista nel documento originale
    soluzione_adottata: "Pulsante Elimina (icona cestino) su ogni item in dettaglio-conto.html. Confirm dialog nativo. Post-eliminazione: ricalcolo Saldo e scrittura in localStorage. Se era l'ultimo movimento → dettaglio-conto-empty.html."

---

## CATEGORIE SEED

entrata:
  - Stipendio
  - Rimborso
  - Regalo
  - Altro

uscita:
  - Casa
  - Spesa
  - Ristoranti
  - Trasporti
  - Salute
  - Abbigliamento
  - Svago
  - Istruzione
  - Abbonamenti
  - Altro

---

## TOKEN FIGMA IN INPUT
(non presente)
