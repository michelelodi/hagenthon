# Design System: Designers Italia / AgID
# Type: design-system | Callable from: SKILL 2 — HTML Arch_SA

---

## METADATA (for the catalog)

```yaml
id: designers-italia
nome_visualizzato: "Designers Italia / AgID"
descrizione_breve: "Official guidelines for the Italian Public Administration"
ui_kit_figma: "https://www.figma.com/design/TM72SHwVQMswD2OjGiYUNv/UI-Kit-Italia--Community-?node-id=162-1109&p=f&t=K9w8sAvExIVuDDXa-0"
ambito_consigliato: "Italian Public Administration, regulated health and public services"
modalita: STRICT
```

---

## DESCRIPTION FOR THE USER

When this design system is presented as an option in the catalog
(Phase 0B of SKILL 2), use this descriptive text:

> **Designers Italia / AgID** — Official guidelines for the Italian Public
> Administration. Applies the components and tokens of the official UI Kit Italia.
> Binding: once selected, fonts, palette, and components
> cannot be overridden.

---

## CONFIRMATION MESSAGE (shown after selection)

> **[SYSTEM — DESIGN SYSTEM SELECTED: Designers Italia / AgID]**
>
> I will apply the components and tokens of the official UI Kit Italia:
> https://www.figma.com/design/TM72SHwVQMswD2OjGiYUNv/UI-Kit-Italia--Community-?node-id=162-1109&p=f&t=K9w8sAvExIVuDDXa-0
>
> The output will be absolutely bound to:
> - Typography: `Titillium Web` (UI/input) · `Lora` (editorial sections)
> - Palette: Primary Blue Italia `#0066CC` · Dark Nav `#002244` · backgrounds `#FFFFFF` / `#F2F7FC`
> - Components: Institutional Header, Breadcrumb, PA Footer, WCAG-compliant states
> - Layer naming: conforming to the UI Kit Italia definitions
>
> This design system is in **STRICT** mode: I will firmly refuse
> any request for fonts, colors, or components not compliant with
> AgID specifications, explaining the regulatory motivation.

---

## COMPLETE TOKENS (for style-config.md)

```yaml
design_system: designers-italia
modalita: STRICT
ui_kit_figma: "https://www.figma.com/design/TM72SHwVQMswD2OjGiYUNv/UI-Kit-Italia--Community-?node-id=162-1109&p=f&t=K9w8sAvExIVuDDXa-0"

palette:
  primary:       "#0066CC"
  primary_dark:  "#002244"
  background:    "#FFFFFF"
  surface:       "#F2F7FC"
  text:          "#0E1B26"
  text_muted:    "#5A6772"
  border:        "#CCD8E0"
  error:         "#D32F2F"
  success:       "#2E7D32"
  warning:       "#E65100"

tipografia:
  font_ui:
    family: "Titillium Web"
    size_xs:  12
    size_sm:  14
    size_md:  16
    size_lg:  20
    size_xl:  24
    weight_regular: 400
    weight_medium:  600
    weight_bold:    700
    line_height: 1.5
  font_editorial:
    family: "Lora"
    size_md: 18
    weight_regular: 400

spaziature:
  spacing_xs:  4
  spacing_sm:  8
  spacing_md:  16
  spacing_lg:  24
  spacing_xl:  32
  spacing_2xl: 48

componenti:
  border_radius_sm: 4
  border_radius_md: 8
  border_radius_lg: 16
  border_width: 1
  border_color: "#CCD8E0"

naming_convention:
  formato: "Component: [NomeUIKit] / [Variante]"
  prefisso_obbligatorio: "Component:"
  esempi:
    - "Component: Card / Servizio"
    - "Component: Alert / Error"
    - "Component: Header / Istituzionale"
    - "Component: Breadcrumb / Default"
```

---

## MANDATORY COMPONENTS ARCHITECTURE

When this design system is selected, the generated HTML must include
(where relevant to the screen):

- **Institutional Header:** skip-to-content link, SPID/CIE digital identity
  login area, Republic of Italy texture
- **Breadcrumb:** mandatory on every internal screen (not on the home page)
- **Standard Footer:** transparent administration and privacy sections
- **Accessibility states:** error, success, warning compliant with WCAG 2.1 AA

---

## CONSTRAINT RULES (STRICT MODE)

1. **No exceptions:** if this design system is selected, firmly refuse
   any user request to use palettes, fonts, or components different from those
   specified above, explaining that the output must pass the validation checks
   of designers.italia.it.

2. **Interaction patterns:** every UX solution proposed in Phase 1
   (sanity check) must comply with the interaction and accessibility patterns
   described on designers.italia.it — e.g. form validation flows,
   PA information architecture.

3. **Binding nomenclature:** the names of HTML layers (CSS classes) and
   future Figma layers must use the naming convention `Component: [Name] /
   [Variant]` for components that have a counterpart in the UI Kit Italia.
