# Design System: Material Design 3 / Google
# Type: design-system | Callable from: SKILL 2 — HTML Arch_SA

---

## METADATA (for the catalog)

```yaml
id: material-design-3
nome_visualizzato: "Material Design 3 / Google"
descrizione_breve: "Google's latest design system — expressive, adaptive, accessible"
ui_kit_figma: "https://www.figma.com/community/file/1035203688168086460"
ambito_consigliato: "Consumer apps, productivity tools, cross-platform products (Android, Web, Flutter)"
modalita: FLEXIBLE
```

---

## DESCRIPTION FOR THE USER

When this design system is presented as an option in the catalog
(Phase 0B of SKILL 2), use this descriptive text:

> **Material Design 3 / Google** — Google's latest design system (M3, "Material You").
> Expressive, adaptive theming with dynamic color, accessible by default, suited for
> consumer and cross-platform products. Applies the tokens and components from the
> official M3 specification at https://m3.material.io/

---

## CONFIRMATION MESSAGE (shown after selection)

> **[SYSTEM — DESIGN SYSTEM SELECTED: Material Design 3 / Google]**
>
> I will apply the components and tokens of Material Design 3 (M3):
> https://m3.material.io/
>
> The output will be bound to:
> - Typography: `Roboto` (all roles) with the M3 type scale (Display, Headline, Title, Body, Label)
> - Palette: generated from a seed color via M3 tonal palette — primary, secondary, tertiary, error + their on-/container- variants
> - Elevation: M3 surface tones (elevation via tonal color overlay, not shadows alone)
> - Components: M3 component set — FAB, NavigationBar, TopAppBar, Card (Elevated/Filled/Outlined), Button variants (Filled/Tonal/Outlined/Text/Elevated), TextField (Filled/Outlined), Chip, Dialog, SnackBar, etc.
> - Shape: M3 shape scale — Extra Small (4px) → Extra Large (28px) → Full
> - Layer naming: conforming to M3 component names
>
> This design system is in **FLEXIBLE** mode: the palette seed color and shape
> scale can be overridden by the user to reflect a custom brand.

---

## COMPLETE TOKENS (for style-config.md)

```yaml
design_system: material-design-3
modalita: FLEXIBLE
riferimento: "https://m3.material.io/"

palette:
  # Default M3 baseline seed: Google Blue #6750A4 (Purple)
  primary:              "#6750A4"
  on_primary:           "#FFFFFF"
  primary_container:    "#EADDFF"
  on_primary_container: "#21005D"
  secondary:            "#625B71"
  on_secondary:         "#FFFFFF"
  secondary_container:  "#E8DEF8"
  on_secondary_container: "#1D192B"
  tertiary:             "#7D5260"
  on_tertiary:          "#FFFFFF"
  tertiary_container:   "#FFD8E4"
  on_tertiary_container: "#31111D"
  error:                "#B3261E"
  on_error:             "#FFFFFF"
  error_container:      "#F9DEDC"
  on_error_container:   "#410E0B"
  background:           "#FFFBFE"
  on_background:        "#1C1B1F"
  surface:              "#FFFBFE"
  on_surface:           "#1C1B1F"
  surface_variant:      "#E7E0EC"
  on_surface_variant:   "#49454F"
  outline:              "#79747E"
  outline_variant:      "#CAC4D0"
  inverse_surface:      "#313033"
  inverse_on_surface:   "#F4EFF4"
  inverse_primary:      "#D0BCFF"
  shadow:               "#000000"
  scrim:                "#000000"
  surface_tint:         "#6750A4"

tipografia:
  font_ui:
    family: "Roboto"
    # M3 type scale
    display_large:   { size: 57, weight: 400, line_height: 64, letter_spacing: -0.25 }
    display_medium:  { size: 45, weight: 400, line_height: 52, letter_spacing: 0 }
    display_small:   { size: 36, weight: 400, line_height: 44, letter_spacing: 0 }
    headline_large:  { size: 32, weight: 400, line_height: 40, letter_spacing: 0 }
    headline_medium: { size: 28, weight: 400, line_height: 36, letter_spacing: 0 }
    headline_small:  { size: 24, weight: 400, line_height: 32, letter_spacing: 0 }
    title_large:     { size: 22, weight: 400, line_height: 28, letter_spacing: 0 }
    title_medium:    { size: 16, weight: 500, line_height: 24, letter_spacing: 0.15 }
    title_small:     { size: 14, weight: 500, line_height: 20, letter_spacing: 0.1 }
    body_large:      { size: 16, weight: 400, line_height: 24, letter_spacing: 0.5 }
    body_medium:     { size: 14, weight: 400, line_height: 20, letter_spacing: 0.25 }
    body_small:      { size: 12, weight: 400, line_height: 16, letter_spacing: 0.4 }
    label_large:     { size: 14, weight: 500, line_height: 20, letter_spacing: 0.1 }
    label_medium:    { size: 12, weight: 500, line_height: 16, letter_spacing: 0.5 }
    label_small:     { size: 11, weight: 500, line_height: 16, letter_spacing: 0.5 }

spaziature:
  spacing_xs:  4
  spacing_sm:  8
  spacing_md:  16
  spacing_lg:  24
  spacing_xl:  32
  spacing_2xl: 48

componenti:
  # M3 shape scale (corner radius)
  shape_extra_small: 4
  shape_small:       8
  shape_medium:      12
  shape_large:       16
  shape_extra_large: 28
  shape_full:        9999

  # M3 elevation levels (surface tint opacity over primary color)
  elevation_0: "0dp  — tint 0%"
  elevation_1: "1dp  — tint 5%"
  elevation_2: "3dp  — tint 8%"
  elevation_3: "6dp  — tint 11%"
  elevation_4: "8dp  — tint 12%"
  elevation_5: "12dp — tint 14%"

naming_convention:
  formato: "md3/[ComponentName]/[Variant]"
  esempi:
    - "md3/Button/Filled"
    - "md3/Button/Tonal"
    - "md3/Card/Elevated"
    - "md3/NavigationBar/Default"
    - "md3/TopAppBar/CenterAligned"
    - "md3/TextField/Outlined"
    - "md3/FAB/Primary"
```

---

## KEY COMPONENTS REFERENCE

Use these M3 components for the corresponding UI patterns:

| Pattern | M3 Component |
|---|---|
| Primary action button | Button / Filled |
| Secondary action | Button / Tonal or Outlined |
| Floating action | FAB / Primary (or Extended FAB) |
| Bottom navigation | Navigation Bar (3–5 destinations) |
| Side navigation | Navigation Drawer / Navigation Rail |
| Page header | Top App Bar (Small / Medium / Large / CenterAligned) |
| Content card | Card / Elevated, Filled, or Outlined |
| Text input | TextField / Filled or Outlined |
| Selection chip | Chip / Filter, Assist, Input, Suggestion |
| Transient message | Snackbar |
| Confirmation dialog | Dialog / Basic or Full-screen |
| Progress | Linear Progress Indicator / Circular Progress Indicator |
| List item | List Item (one-line / two-line / three-line) |

---

## CONSTRAINT RULES (FLEXIBLE MODE)

1. **Default palette:** use the baseline M3 tonal palette above unless the user
   provides a custom seed color — in that case apply the M3 tonal algorithm
   (primary, on-primary, primary-container, etc.) derived from that seed.

2. **Type scale:** always use the M3 type scale roles (Body Large, Title Medium, etc.)
   as CSS custom properties or utility classes; do not invent arbitrary font sizes.

3. **Elevation via tonal overlay:** do not render elevation with box-shadow alone —
   combine with a tinted surface background (surface + surface_tint at the
   appropriate opacity level for that elevation).

4. **Shape scale:** use the M3 shape tokens for border-radius; do not mix arbitrary
   radii outside the scale without explicit user request.

5. **Accessibility:** maintain minimum contrast ratios as defined by M3
   (on-* colors are pre-computed for 4.5:1 on their container counterparts).
