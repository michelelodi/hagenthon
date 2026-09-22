# QC Report
Progetto: Finanze di Famiglia
Eseguito: 2026-09-22 Europe/Rome
Cartella output: /Users/fabio.casiero/Documents/Hackhaton/hagenthon/ui-output_20260922_1132_md3/

## Artefatti Verificati
| Artefatto | Disponibile | Note |
|-----------|-------------|------|
| Documento funzionale | sì | validated-output_20260922_1112/validated-spec.md |
| validated-spec.md | sì | validated-output_20260922_1112/validated-spec.md |
| style-config.md | sì | ui-output_20260922_1132_md3/style-config.md |
| File HTML | sì — 9 file | login, home, home-empty, nuovo-conto, dettaglio-conto, dettaglio-conto-empty, nuovo-movimento, dashboard, dashboard-empty |
| styles.css | no | — |
| navigation-report.md | sì | ui-output_20260922_1132_md3/navigation-report.md |
| Preview PNG Figma | no | — |

## Categorie Verificate
| Cat. | Descrizione | Stato | Incongruenze |
|------|-------------|-------|-------------|
| A | Documento → HTML | ✅ OK | 1 |
| B | Navigazione | ✅ OK | 1 |
| C | Token di design | ✅ OK | 3 |
| D | Varianti condizionali | ✅ OK | 0 |
| E | Figma ↔ HTML | ❌ N/A | — |

## Incongruenze Risolte
| # | Cat. | Problema | Soluzione applicata | File modificati |
|---|------|----------|---------------------|----------------|
| 1 | A | Testo empty state errato: "Nessun conto ancora" invece di "Non hai ancora nessun conto" | Testo allineato a validated-spec.md | home-empty.html |
| 2 | B | Filter chip in dashboard-empty.html usava `<a href="#">` invece di `<div>`, causando scroll-to-top indesiderato | Sostituito con `<div class="filter-chip">` come in dashboard.html | dashboard-empty.html |
| 3 | C | `--shape-full: 50px` (px fissi) invece di `50%` in 4 file | Sostituito con `--shape-full: 50%` in tutti i file interessati | home-empty.html, nuovo-conto.html, nuovo-movimento.html, dashboard.html |
| 4 | C | `.btn-filled` in login.html usava `border-radius: 20px` (valore hardcoded) invece di `var(--shape-full)` | Sostituito con `var(--shape-full)` | login.html |
| 5 | C | Breakpoint MD3 840px e 1240px mancanti in 6 file; 1240px mancante in 2 file; 840px+1240px mancanti in 1 file | Aggiunti `@media (min-width: 840px)` e/o `@media (min-width: 1240px)` con progressione `max-width` | login.html, home.html, nuovo-conto.html, dettaglio-conto.html, dettaglio-conto-empty.html, nuovo-movimento.html, dashboard.html, dashboard-empty.html |

## Incongruenze Non Risolte
Nessuna.

## Esito Finale
✅ Tutti gli output sono coerenti con il documento funzionale, la mappa di navigazione e i token MD3.
Il prototipo è pronto per la consegna.
