# Hagenthon — Perimetro di progetto

Hackathon di **agentic coding** (Accenture · team da 2 · ~5h). Questo file è il **perimetro condiviso da tutti gli agenti**: rispettalo prima di proporre o scrivere qualsiasi cosa. Dettagli operativi → skill. Idea scelta e decisioni → memory. Tienilo minimale: non mettere qui ciò che va altrove.

## Obiettivo
Costruire e presentare un prodotto che **risolve un problema concreto di una persona reale** con un servizio digitale.
Si vince su **(1) idea** e **(2) qualità della costruzione agentica**. Tra i **primi 5**, decide la **presentazione**: slide HTML + **demo live ~90s**.

## Confini non negoziabili

> ⚠️ **Deviazione di progetto — vedi [ADR-0001](docs/adr/0001-webapp-tradizionale-senza-llm.md).** Questo progetto costruisce una **webapp tradizionale di finanze personali, SENZA LLM a runtime**, **solo frontend + `localStorage`**, offline nel browser. I confini "LLM nel prodotto", "Solo Claude / inferenza offline" e "capability che chiude il loop fino all'azione" **NON si applicano** e sono superati da quell'ADR. `tools/askclaude/` resta inutilizzato dal prodotto.

- **Una persona, una difficoltà.** Sempre ancorati a *un* profilo concreto e *una* barriera precisa in uno scenario reale/realistico. Mai "utente generico". → **Persona scelta: Sara & Marco** (famiglia, un conto familiare); barriera = onere dell'inserimento manuale.
- **Semplificare senza tradire.** Non alterare il significato delle informazioni originali. Niente consulenza professionale personalizzata (finanziaria, medica, legale).
- **Demo offline su dati locali.** La demo di ~90s gira **100% offline** su `localStorage` pre-seedato — nessuna rete.

## Come lavoriamo
- **Tutto punta all'MVP e2e reale.** Prima un **flusso completo che funziona davvero**: login → crea conto → aggiungi movimenti categorizzati → **dashboard si aggiorna** (prima → dopo dell'utente: "non so dove vanno i soldi" → "vedo ripartizione e trend"). La **demo di 90s** è una *fetta fedele* estratta **dopo** dall'MVP, che **mocka il necessario** (es. dati pre-seedati) per stare nei tempi — non la si progetta prima del flusso.
- **Time-box duro: MVP e2e su UN flusso, non il prodotto completo.** La cosa più piccola che fa **girare il flusso e2e per davvero** (non la cosa più piccola che fa atterrare la demo).
- **Il `.claude/` è valutato.** Minimale, ordinato, **spiegabile**: ogni skill/agent ha una ragione d'essere difendibile a voce. Sappi *dove* l'AI contribuisce e *dove* serve revisione umana.

## Definition of done
- **MVP e2e realmente funzionante** su un flusso (login → conto → movimenti → dashboard, prima → dopo, su scenario realistico); da esso si **estrae** una **demo live di ~90s** (con dati pre-seedati).
- **Slide HTML** di presentazione.
- Sappiamo **motivare** idea e struttura del `.claude`.

## Dove stanno le cose
- **CLAUDE.md** (questo): perimetro e confini.
- **Skill** `.claude/skills/`: procedure ripetibili
- **Memory** `.claude/memory/`: memory **di progetto**: tema/idea/persona del giorno, decisioni, fatti di progetto. Ogni agente scrive/aggiorna **qui**, non nella memory personale/utente. Indice: `.claude/memory/MEMORY.md`.
- **Tema specifico**: esce il **22/09** → in `.claude/memory/`, non qui.

## Agent skills
Config delle skill di engineering (plugin `mattpocock-skills`) che leggono da `docs/agents/`. La skill `triage` è **vendored** in `.claude/skills/triage/` (invocabile con `/triage`).

### Issue tracker
GitHub Issues via `gh` CLI, **account personale `michelelodi`** (forzato in questo repo: identità git locale + `gh auth switch --user michelelodi`). Fallback a markdown locali in `.scratch/` se GitHub è irraggiungibile/non autenticato o su richiesta. Consegna: **1 PR per issue** (`Closes #N`). Vedi `docs/agents/issue-tracker.md`.

### Triage labels
Cinque ruoli canonici: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Vedi `docs/agents/triage-labels.md`.

### Domain docs
Single-context: `CONTEXT.md` + `docs/adr/` alla radice, creati lazy dalle skill. Vedi `docs/agents/domain.md`.
