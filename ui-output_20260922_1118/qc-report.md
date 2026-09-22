# QC Report
Progetto: Finanze di Famiglia — hagenthon
Eseguito: 2026-09-22 11:30 Europe/Rome
Cartella output: ui-output_20260922_1118/

## Artefatti Verificati
| Artefatto | Disponibile | Note |
|-----------|-------------|------|
| validated-spec.md | sì | validated-output_20260922_1112/ |
| style-config.md | sì | ui-output_20260922_1118/ |
| File HTML | sì — 9 file | login, home, home-empty, nuovo-conto, dettaglio-conto, dettaglio-conto-empty, nuovo-movimento, dashboard, dashboard-empty |
| styles.css | sì | ui-output_20260922_1118/ |
| navigation-report.md | sì | ui-output_20260922_1118/ |
| Preview PNG Figma | no | Figma/Penpot non connesso in questa sessione |

## Categorie Verificate
| Cat. | Descrizione | Stato | Incongruenze |
|------|-------------|-------|-------------|
| A | Documento → HTML | ✅ OK | 0 |
| B | Navigazione | ✅ OK | 0 |
| C | Token di design | ✅ OK (dopo correzioni) | 3 → 0 |
| D | Varianti condizionali | ✅ OK | 0 |
| E | Figma ↔ HTML | ❌ N/A | — |

## Incongruenze Risolte
| # | Cat. | Problema | Soluzione applicata | File modificati |
|---|------|----------|---------------------|----------------|
| 1 | C | `--border-radius-lg` aveva valore 12px in alcuni file invece di 16px (style-config.md) | Sostituito `12px` con `16px` ovunque | home.html, login.html, dashboard-empty.html, styles.css |
| 2 | C | `--spacing-2xl` espresso come `3rem` invece di `48px` (style-config.md) | Sostituito `3rem` con `48px` | home-empty.html, dettaglio-conto-empty.html, dashboard-empty.html, styles.css |
| 3 | C | Breakpoint MD (1024px) e LG (1280px) assenti in 8/9 file HTML — spec AgID richiede tutti e 4 i breakpoint | Aggiunti `@media (min-width: 1024px)` e `@media (min-width: 1280px)` con max-width progressivo | tutti i 9 file HTML + styles.css |

## Incongruenze Non Risolte
Nessuna.

## Esito Finale
✅ Tutti gli output sono coerenti con il documento funzionale, la mappa di navigazione e i token di design.
Il prototipo è pronto per la consegna.

---
_Categoria E (Figma ↔ HTML) non eseguibile: nessun fileKey Figma disponibile e MCP Penpot non connesso in questa sessione._
