# Installation and Usage Guide
## Orchestrator_document_html (SKILL 1 → 2 → 4)

This guide covers the installation and use of the **HTML-only** flow — document
analysis, HTML/CSS generation and quality check, **without Figma generation**.

> ✅ **Lightweight setup:** this flow does not require Playwright, Chromium or
> Penpot. It works in any environment — Claude Code, Claude.ai
> Projects or Claude Desktop — without additional technical dependencies.
>
> If you also need Figma frames, use the separate guide
> **"Orchestrator_document_html_figma"**, which covers the complete flow
> with Playwright and Penpot setup.

---

## TABLE OF CONTENTS

1. [Skills Involved](#1-skills-involved)
2. [Installation in Claude Code](#2-installation-in-claude-code)
3. [Installation in Claude.ai Projects](#3-installation-in-claudeai-projects)
4. [Installation in Claude Desktop](#4-installation-in-claude-desktop)
5. [Working Directory](#5-working-directory)
6. [Usage: Full Flow with Orchestrator_HTML](#6-usage-full-flow-with-orchestrator_html)
7. [Usage: Individual Skills in Standalone Mode](#7-usage-individual-skills-in-standalone-mode)
8. [Adding Figma Later](#8-adding-figma-later)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Skills Involved

This flow uses only 4 of the skills in the complete system:

| Skill | Task | Output |
|-------|------|--------|
| SKILL 1 — Document Analyst | Analyzes the functional document | `validated-spec.md` |
| SKILL 2 — HTML Arch_SA | Generates HTML, CSS, configures the style | HTML + CSS + `style-config.md` |
| SKILL 4 — Quality Checker_SA | Verifies document↔HTML consistency | `qc-report.md` |
| SKILL 5b — Orchestrator_HTML | Coordinates the three skills above in sequence | — |

**SKILL 3 (Figma Arch_SA) is never used in this flow.**

---

## 2. Installation in Claude Code

Claude Code loads skills from two directories, scanned automatically
at session startup:

| Location | Scope | Priority |
|----------|-------|----------|
| `~/.claude/skills/` | All projects (personal) | Lower |
| `.claude/skills/` (in repo) | Current project only | Higher |

### 2.1 — Required Structure

```
~/.claude/skills/
├── document-analyst/
│   └── SKILL.md
├── html-arch-sa/
│   └── SKILL.md
├── quality-checker-sa/
│   └── SKILL.md
├── orchestrator-html/
│   └── SKILL.md
└── design-systems/
    └── designers-italia/
        └── SKILL.md
```

> 📌 **`design-systems/` is not a directly callable skill** — it is the
> catalog that SKILL 2 scans during its Phase 0B to build
> the list of available design systems to propose to the user. It has no
> YAML frontmatter and does not appear in the `/skills` list.

### 2.2 — Installation Procedure

```bash
# Create the skill folders
mkdir -p ~/.claude/skills/document-analyst
mkdir -p ~/.claude/skills/html-arch-sa
mkdir -p ~/.claude/skills/quality-checker-sa
mkdir -p ~/.claude/skills/orchestrator-html

# Create the design system catalog folder
mkdir -p ~/.claude/skills/design-systems/designers-italia

# Copy each downloaded file renaming it SKILL.md
cp SKILL_1__Document_Analyst.md       ~/.claude/skills/document-analyst/SKILL.md
cp SKILL_2__HTML_Arch_SA.md           ~/.claude/skills/html-arch-sa/SKILL.md
cp SKILL_4__Quality_Checker_SA.md     ~/.claude/skills/quality-checker-sa/SKILL.md
cp SKILL_5b__Orchestrator_HTML.md     ~/.claude/skills/orchestrator-html/SKILL.md

# Copia il design system Designers Italia nel catalogo
cp design-systems/designers-italia/SKILL.md \
   ~/.claude/skills/design-systems/designers-italia/SKILL.md
```

### 2.3 — YAML Frontmatter (already included in the files)

The `SKILL_*.md` files you download already include the YAML frontmatter block
(`name` and `description`) at the top, which Claude Code reads to know when
to activate each skill automatically. **You don't need to add anything manually** —
the copy with `cp` shown in [Section 2.2](#22--installation-procedure)
is already sufficient.

If you want to verify it's present, open one of the copied files and check
that the first lines look similar to these:

```yaml
---
name: document-analyst
description: Analizza un documento funzionale, risolve ambiguità con l'utente e produce validated-spec.md. Usa quando l'utente chiede di analizzare requisiti, specifiche funzionali, o di preparare la base per generare un prototipo UI.
---
```

> 📌 If you downloaded the skill files before this revision and don't
> find the frontmatter block at the top, add it manually by copying the
> YAML blocks below, one for each file, before the existing content:
>
> **`document-analyst/SKILL.md`**:
> ```yaml
> ---
> name: document-analyst
> description: Analizza un documento funzionale, risolve ambiguità con l'utente e produce validated-spec.md. Usa quando l'utente chiede di analizzare requisiti, specifiche funzionali, o di preparare la base per generare un prototipo UI.
> ---
> ```
>
> **`html-arch-sa/SKILL.md`**:
> ```yaml
> ---
> name: html-arch-sa
> description: Genera HTML e CSS di un prototipo a partire da validated-spec.md o da un documento funzionale. Usa quando l'utente chiede di generare schermate HTML, un prototipo web, o pagine da un documento di analisi.
> ---
> ```
>
> **`quality-checker-sa/SKILL.md`**:
> ```yaml
> ---
> name: quality-checker-sa
> description: Verifica la coerenza tra documento funzionale, HTML e CSS prodotti, segnala incongruenze e applica correzioni confermate. Usa quando l'utente chiede una verifica di qualità, un controllo di coerenza, o un QC su un prototipo HTML.
> ---
> ```
>
> **`orchestrator-html/SKILL.md`**:
> ```yaml
> ---
> name: orchestrator-html
> description: Coordina la generazione di un prototipo HTML (senza Figma) lanciando in sequenza document-analyst, html-arch-sa e quality-checker-sa. Usa quando l'utente chiede un prototipo HTML rapido senza bisogno dei file Figma.
> ---
> ```

### 2.4 — Design System Catalog (`design-systems/`)

Files inside `design-systems/` **have no YAML frontmatter** and are
never called directly. They are read exclusively by SKILL 2 during
its Phase 0B, which scans the folder to build the list of options to propose.

**To add a new design system in the future:**
1. Create a new subfolder: `~/.claude/skills/design-systems/<new-id>/`
2. Write a `SKILL.md` file following the same structure as
   `designers-italia/SKILL.md` (blocks `## METADATA`, `## DESCRIPTION FOR
   THE USER`, `## CONFIRMATION MESSAGE`, `## COMPLETE TOKENS`)
3. No additional registration required — SKILL 2 detects it
   automatically on the next scan

If the `design-systems/` folder is absent or empty, SKILL 2 only offers
the **"None"** option — the flow still works.

### 2.5 — Verify Installation

```bash
# Restart Claude Code or open a new session, then:
/skills
```

You should see 4 skills listed (document-analyst, html-arch-sa,
quality-checker-sa, orchestrator-html). **The `design-systems/` catalog will not
appear in this list** — this is correct behavior.

If a skill is missing, verify that the path is exactly
`~/.claude/skills/<name>/SKILL.md` and that the YAML frontmatter is valid.

---

## 3. Installation in Claude.ai Projects

In Claude.ai the Claude Code auto-discovery mechanism does not exist: skills
must be loaded as **project files** and referenced explicitly
in the Project system prompt.

### 3.1 — Creating the Project

1. On claude.ai, create a new **Project**
2. Go to **Project knowledge** → **Add content** → **Upload files**
3. Upload: `SKILL_1__Document_Analyst.md`, `SKILL_2__HTML_Arch_SA.md`,
   `SKILL_4__Quality_Checker_SA.md`, `SKILL_5b__Orchestrator_HTML.md`
4. Also upload the Designers Italia design system file:
   it is located inside `design-systems/designers-italia/SKILL.md` in the
   downloaded package. Rename it to `DesignSystem__Designers_Italia.md` before
   uploading it, to distinguish it from the other skill files.

### 3.2 — Configuring Project Instructions

In the **Custom Instructions** of the Project, add:

```
Hai accesso a un sistema di skill caricate nei file di progetto, per la
generazione di prototipi HTML (senza Figma):
- SKILL 1 — Document Analyst
- SKILL 2 — HTML Arch_SA
- SKILL 4 — Quality Checker_SA
- SKILL 5b — Orchestrator_HTML

Inoltre, hai accesso a uno o più file di Design System (es. "Designers
Italia / AgID"). Questi non sono skill autonome: vengono usati solo dalla
SKILL 2 durante la sua Fase 0B, quando deve proporre all'utente il catalogo
dei design system disponibili. Considera "disponibili" tutti i file di
design system presenti nei project knowledge, oltre all'opzione "Nessuno"
che è sempre disponibile.

Quando l'utente chiede di generare un prototipo, di analizzare un documento,
o menziona una di queste skill per nome, leggi il file corrispondente dai
project knowledge e segui le sue istruzioni esattamente come scritte.

Se l'utente non specifica quale skill usare ma la richiesta corrisponde
chiaramente a un flusso completo (documento → HTML → QC), usa
SKILL 5b — Orchestrator_HTML come punto di ingresso.
```

### 3.3 — Compatibility with Claude.ai Projects

SKILL 1, 2 and 4 work in Claude.ai Projects without requiring Playwright
or MCP connections. There is however an important difference compared to Claude Code:

- **In Claude Code:** skills save files to disk in the
  `ui-output_YYYYMMDD_HHMM/` folder, ready to be opened in a browser.
- **In Claude.ai Projects:** there is no writable filesystem. HTML,
  CSS and reports are produced as **artifacts in the conversation** —
  you copy them manually and save them wherever you prefer.

For review and analysis (SKILL 1) or to get the HTML code to paste
elsewhere, Claude.ai Projects is more than sufficient. For a browser-navigable
prototype with all files on disk, use Claude Code.

---

## 4. Installation in Claude Desktop

Claude Desktop reads from the same directory as Claude Code:
```
~/.claude/skills/
```

**If you have already completed Section 2 (Claude Code):** the skills are already
visible in Claude Desktop — there is no need to repeat the installation.

**If you use Claude Desktop without Claude Code** (common case on Windows without WSL):
run the same commands from Section 2.2 from your system's native terminal.
On Windows the equivalent path to `~/.claude/skills/` is:
```
C:\Users\<YourName>\.claude\skills\
```
You can create it and populate the skills from PowerShell using `New-Item` and `Copy-Item`
(same logic as the bash commands in Section 2.2, adapted to PowerShell).

> 📌 For this flow **no additional MCP configuration is required** for the HTML flow.
> The `claude_desktop_config.json` file does not require modifications.

---

## 5. Working Directory

Before starting any skill, always specify the **working directory** —
the directory where all process outputs will be saved
(`validated-spec.md`, `ui-output_*/`, `qc-report.md`).

Without an explicit directory, skills save files in the current
Claude Code directory at startup time, which can vary from session
to session and make it difficult to find the produced files.

### How to specify it

Always include it in the startup message, right after the document:

```
Working directory: /Users/mario/Projects/project-name
```

or on Windows:

```
Working directory: C:/Users/mario/Projects/project-name
```

The directory must already exist — skills do not create it. If it doesn't exist,
create it before starting:

```bash
mkdir -p /Users/mario/Projects/project-name   # macOS / Linux
```
```powershell
New-Item -ItemType Directory "C:\Users\mario\Projects\project-name"   # Windows
```

### What happens

All folders generated by skills (`validated-output_*/`, `ui-output_*/`)
will be created **inside** the specified working directory. At the end you will find:

```
/Users/mario/Projects/project-name/
├── validated-output_YYYYMMDD_HHMM/
│   └── validated-spec.md
└── ui-output_YYYYMMDD_HHMM/
    ├── [screen-name].html  × N
    ├── styles.css
    ├── navigation-report.md
    ├── style-config.md
    └── qc-report.md
```

---

## 6. Usage: Full Flow with Orchestrator_HTML

### Startup Example

```
Working directory: /Users/mario/Projects/project-name

Use the orchestrator-html skill to generate the HTML prototype.
[attach one or more documents: functional, requirements, feasibility]
```

> 📌 Remember to always specify the working directory as the first line
> of the message — see [Section 5](#5-working-directory).
>
> 📄 **Accepted input documents:**
> - Functional document (FAD or equivalent)
> - Requirements document (or excerpt)
> - Feasibility document + requirements document
> You can attach one or more files together.

### What happens

1. **Orchestrator_HTML** detects the document and shows the 3 skills it will launch
2. Launches **SKILL 1** → guides you through resolving critical issues, conditional
   variants and navigation questions, one at a time
3. At completion produces `validated-spec.md` and launches **SKILL 2**
4. Proposes the catalog of available design systems (e.g. "None" or
   "Designers Italia / AgID") and asks whether the screens should be
   responsive
5. You approve the atomic schema → HTML, CSS, navigation report are generated
6. Launches **SKILL 4** → verifies complete consistency between document and HTML/CSS,
   presents any inconsistencies one at a time with proposed solution
   (category E — Figma ↔ HTML — will always be marked ❌ not executable)
7. Final summary with all produced artifacts

### Final Output

```
ui-output_YYYYMMDD_HHMM/
├── [screen-name].html  × N
├── styles.css
├── navigation-report.md
├── style-config.md
└── qc-report.md

validated-output_YYYYMMDD_HHMM/
└── validated-spec.md
```

To open the prototype:
```bash
open ui-output_YYYYMMDD_HHMM/[entry-point].html        # macOS
xdg-open ui-output_YYYYMMDD_HHMM/[entry-point].html    # Linux
start ui-output_YYYYMMDD_HHMM/[entry-point].html       # Windows
```

---

## 7. Usage: Individual Skills in Standalone Mode

Each skill can be used on its own, without Orchestrator_HTML.

### SKILL 1 — Document Analysis Only

```
Working directory: /Users/mario/Projects/project-name

Use the document-analyst skill on these documents.
[attach one or more files: functional, requirements, feasibility]
```

Accepted documents:
- Functional document only
- Requirements document only (or excerpt)
- Requirements document + feasibility document

Output: `validated-spec.md`, no HTML generated.

### SKILL 2 — HTML Only, Starting from an Existing Spec

```
Use the html-arch-sa skill with this validated-spec.md.
[attach the file]
```
Or, without a spec, starting from a raw document:
```
Use the html-arch-sa skill directly on this document,
without going through the analysis skill.
[attach the document]
```

### SKILL 4 — Quality Check Only

```
Use the quality-checker-sa skill on these artifacts:
functional document [path/attachment]
HTML folder [path]
```
The more artifacts you provide (`style-config.md`, `navigation-report.md`), the more
control categories will be active. Category E (Figma ↔ HTML) will always
remain ❌ not executable in this flow, in the absence of Figma frames.

---

## 8. Adding Figma Later

If in the future you want to also generate Penpot frames from the HTML already
produced, you don't need to redo the analysis from scratch: switch to the
**"Orchestrator_document_html_figma" guide** and launch SKILL 3c directly in standalone mode:

```
Working directory: /Users/mario/Projects/project-name

Use the penpot-arch-sa skill on the ui-output_20260630_1530/ folder
that I have already generated.
```

SKILL 3c detects the existing HTML files and proceeds directly to
Penpot generation.

---

## 9. Troubleshooting

### The design system catalog only shows "None"

Verify in order:
1. Does the folder exist? `ls ~/.claude/skills/design-systems/`
2. Does each design system have its own subfolder with a `SKILL.md` file?
   The correct path is `design-systems/<id>/SKILL.md`, not
   `design-systems/<id>.md` directly
3. Is the `## METADATA` block at the top of the file present and well formatted
   (must contain at least `id`, `nome_visualizzato`, `descrizione_breve`)
4. If using Claude.ai Projects: have you uploaded the design system file in the
   Project knowledge and updated the Custom Instructions as indicated
   in [Section 3.2](#32--configuring-project-instructions)?

This behavior (only "None" available) is also the **correct
and expected** behavior if you haven't installed any design system yet.

### The skill is not detected in Claude Code

- Verify the exact path: `~/.claude/skills/<name>/SKILL.md`
  (not nested more deeply)
- Verify that the YAML frontmatter is correctly delimited by `---`
- Restart the Claude Code session (skills are loaded at startup)
- Run `/skills` to see the list of those actually loaded

### Lines end with `\r` or skill doesn't load after editing on Windows

If you edited a `SKILL.md` file with Notepad or another Windows editor and then
use it inside WSL, it may have CRLF line endings instead of LF:

```bash
# Inside WSL — convert line endings
sed -i 's/\r$//' ~/.claude/skills/<name>/SKILL.md
```

Or configure your editor (VS Code, Notepad++) to use LF even for
files inside WSL.

### A skill always asks for the document even if it's attached

Verify that the document is actually in the message (attached or
pasted) and not just mentioned in words. Skills scan attached files
at startup — a textual reference like "the document I sent you
yesterday" is not automatically detected in a new session.
