# Memory di progetto — Hagenthon

Memory **di progetto**, versionata nel `.claude` e condivisa dal team — regole in [CLAUDE.md](../../CLAUDE.md).
Ogni agente **legge questo indice a inizio sessione** e **scrive/aggiorna qui**, non nella memory personale/utente.

## Convenzione
- **Un fatto = un file**: `.claude/memory/<slug>.md` (kebab-case), corto e autonomo.
- Frontmatter minimale:
  ```
  ---
  name: <slug>
  tipo: tema | idea | persona | decisione | fatto
  ---
  ```
  Poi il fatto in 1-3 righe. Date relative → assolute. Collega fatti correlati con `[[altro-slug]]`.
- Per ogni file, **una riga** nell'indice qui sotto: `- [Titolo](<slug>.md) — <gancio>`.
- Fatto cambiato o sbagliato → **aggiorna o cancella** il file (niente duplicati). Non duplicare ciò che è già in `CLAUDE.md` o nei `docs/`.

## Indice
<!-- Tema specifico: esce il 22/09 — saltato, idea scelta dal team. -->
- [Persona: Sara & Marco](persona-sara-marco.md) — famiglia, un conto; barriera = inserimento manuale
- [Idea: webapp finanze personali](idea-finanze-personali-webapp.md) — conti/movimenti/dashboard, FE + localStorage, senza LLM
- [Decisione: niente LLM (webapp tradizionale)](decisione-no-llm-webapp-tradizionale.md) — rinuncia consapevole al confine #1; vedi ADR-0001
- [Decisione: scontrini via Telegram con LLM](decisione-scontrini-telegram-llm.md) — bot + Claude Vision via askclaude + auto-import; supera in parte ADR-0001, vedi ADR-0002
