---
name: TT Font Studio
description: A precise bitmap type specimen workbench for classic TT Games fonts.
colors:
  accent: "#f0c246"
  accent-hover: "#e5b534"
  accent-ink: "#30270e"
  page: "#f5f4ee"
  surface: "#fffef9"
  panel: "#f9f9f2"
  ink: "#292c25"
  muted: "#64675e"
  line: "#dcddd3"
  dark: "#22251f"
  focus: "#775800"
  selection: "#f7e8af"
  atlas-green: "#008000"
  atlas-white: "#ffffff"
typography:
  headline:
    fontFamily: '"Public Sans Variable", sans-serif'
    fontSize: "32px"
    fontWeight: 730
    lineHeight: 1.25
    letterSpacing: "-1px"
  title:
    fontFamily: '"Public Sans Variable", sans-serif'
    fontSize: "18px"
    fontWeight: 750
    letterSpacing: "-0.6px"
  body:
    fontFamily: '"Public Sans Variable", sans-serif'
    fontSize: "14px"
    fontWeight: 430
  label:
    fontFamily: '"Public Sans Variable", sans-serif'
    fontSize: "12px"
    fontWeight: 580
  data:
    fontFamily: "ui-monospace, Consolas, monospace"
    fontSize: "11px"
rounded:
  field: "4px"
  control: "6px"
  workspace: "8px"
  drop-zone: "12px"
spacing:
  tight: "4px"
  compact: "8px"
  control: "12px"
  field: "14px"
  group: "16px"
  panel: "20px"
  section: "24px"
  page: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
  glyph-selected:
    backgroundColor: "{colors.selection}"
    rounded: "{rounded.field}"
  workspace:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.workspace}"
---

# Design System: TT Font Studio

## Overview

**Creative North Star: "Type-specimen workbench"**

The interface is a light technical editor whose visual weight belongs to the bitmap content. Warm neutral panels keep controls legible while a dark atlas reveals transparency and letter edges. Yellow connects primary export actions with the current selection rather than competing with the font being edited.

The system is flat, compact, and precise. A single sans-serif family carries interface text; measured values and Unicode identifiers use a restrained monospace voice. Native controls and immediate linked previews make editing feel direct.

**Key Characteristics:**

- Warm light surfaces with a dark pixel-inspection ground.
- Restrained yellow action and selection emphasis.
- Aligned measurements, native fields, and visible keyboard focus.
- Pixel-honest atlas and text rendering.

## Colors

One warm accent sits over a quiet green-tinted neutral family. Frontmatter values are the token authority; the following names describe their jobs.

### Primary

- **Warm Yellow** (`accent`): primary export/import actions, the identity mark, selected atlas outlines, and the active font's narrow top marker.
- **Pressed Gold** (`accent-hover`): pointer feedback on primary actions.
- **Dark Ochre Ink** (`accent-ink`): text and icons on yellow controls.

### Neutral

- **Warm Page** (`page`) separates the workspace from the browser ground.
- **Ivory Surface** (`surface`) carries panels and fields; **Quiet Panel** (`panel`) gently groups the glyph rail.
- **Graphite Green** (`ink`) carries primary text; **Muted Olive Gray** (`muted`) carries secondary labels.
- **Soft Rule** (`line`) separates panels and outlines native controls.
- **Dark Atlas** (`dark`) provides a stable text-preview ground; the atlas itself uses a nearby green-gray checkerboard to reveal alpha.
- **Ochre Focus** (`focus`) makes keyboard focus distinct from hover.
- **Pale Yellow Selection** (`selection`) highlights the active glyph row without competing with the atlas pixels.

**The Linked Selection Rule.** Use the established yellow family to connect the active font, glyph row, and atlas bounds; keep unrelated controls neutral.

## Typography

**Interface Font:** Public Sans Variable, with sans-serif fallback.

**Data Font:** ui-monospace, Consolas, monospace for Unicode identifiers and measurement-like metadata.

The implemented scale is fixed rather than fluid. The empty-state headline is the largest interface text; the working editor uses a close hierarchy to keep attention on glyphs.

### Hierarchy

- **Headline:** the frontmatter headline role is used for the empty-state introduction; it becomes a smaller headline on narrow screens.
- **Title:** the brand title uses the title role and becomes smaller below the tablet breakpoint.
- **Body:** the root body role supports explanations and empty-state prose.
- **Label:** most working labels and numeric fields use compact text; supporting metadata uses a slightly smaller size. Weights distinguish panel headings, actions, and secondary text.
- **Data:** use the data role only where the content is an identifier or measurement, not as a general technical costume.

**The Content First Rule.** Let imported bitmap letters be the expressive typography; keep interface labels in the quiet sans-serif family.

## Layout

The desktop editor uses a three-column grid: a glyph rail (224px), a flexible atlas with a minimum width (280px), and an inspector (270px). Its default working height is fixed (520px), with independent glyph, atlas, and inspector scrolling. At wide viewports, the outer content is capped (1700px) and the editor grows to wider rails and a taller working area.

At the compact desktop breakpoint (1150px), the rails tighten. At the tablet breakpoint (850px), the glyph rail stays beside the atlas while the inspector occupies the right column beneath it. At the narrow breakpoint (540px), the editor becomes a single column and the glyph list uses two compact columns. The bilingual previews move from two columns to one at the tablet breakpoint.

Keep related control gaps compact and separate larger sections generously. The implementation uses the spacing steps in frontmatter; page gutters reduce on narrow screens. Long filenames truncate, font tabs scroll horizontally, and raster previews scroll inside their own containers.

## Elevation & Depth

Surfaces are flat. Tonal differences, hairline borders, and panel grouping establish depth; there are no ambient drop shadows. The active font tab uses an inset top line as a selection marker rather than simulated elevation. The drag overlay is a functional temporary state with a dashed boundary.

**The Flat Workbench Rule.** Prefer borders and tonal grouping to decorative elevation so the imported font remains the visual focus.

## Shapes

Fields and glyph rows have gently rounded corners; buttons are slightly softer, and workspace containers use the next radius step. The large empty-state drop target is more open and rounded. Small SVG icons share a consistent unfilled stroke language. The checkerboard appears only on pixel-inspection surfaces where it communicates transparency.

## Components

### Buttons

Buttons are compact and explicit. Primary actions use the yellow treatment; secondary and icon actions remain quiet. Default buttons have a minimum height (34px), with compact history controls kept distinct from large import actions. Hover changes fill and border, active state darkens the surface, disabled state reduces opacity, and keyboard focus adds the shared outline. Color and border transitions are short (160ms) and disabled for reduced-motion preference.

### Inputs / Fields

Use native inputs, selects, checkboxes, and textareas. Numeric fields align with their labels and show pixel units; values use tabular numerals. Error states mark the field and accompany an actionable message. The shared focus indicator is an outline (3px) offset from the control (3px). Updating numeric values preserves the focused field rather than rebuilding it.

### Navigation

Open fonts form a horizontally scrollable rail. The active font uses the ivory surface, a visible outline, and the narrow yellow marker. File names remain readable through truncation; close actions have explicit accessible names. A small changed-state marker supplements the current document's edit status.

### Glyph Selection

Each row aligns the character, Unicode identifier, glyph index, and edit marker. The current row uses pale yellow and a visible pressed state. Atlas selection uses a stronger yellow outline; the selected glyph specimen and both text previews update from the same metrics. The searchable list provides a keyboard alternative to clicking atlas rectangles.

### Containers and Format Tag

The working surface is one bordered container, not a dashboard of decorative cards. Preview containers use the same ivory surface and soft borders. The small format tag is an outlined metadata label rather than a filled badge competing with actions.

### Preview Presentation

The atlas opens at 100% with Fit as an explicit action. Selecting an off-screen glyph reveals it by scrolling only the atlas viewport. Under the atlas, labeled Transparency, Green, and White buttons use pressed states; these are presentation backgrounds, never exported pixels.

Text previews default to Smooth at 1x and use density-aware backing buffers while retaining CSS dimensions. Pixel exact is available for sampling inspection. The native selects use explicit accessible names and wrap on narrow screens. Atlas inspection remains pixelated.

### Messages and Recovery

Status notices use a quiet green-tinted surface; errors use a warm red-tinted surface with explanatory text. Both have labeled dismissal. File import has a visible drop overlay and a file-picker alternative. Destructive close actions use the browser's confirmation dialog.

## Do's and Don'ts

### Do:

- **Do** use the yellow family for primary actions and linked selection states.
- **Do** retain native field behavior, visible focus, and the searchable alternative to atlas clicking.
- **Do** preserve pixel-exact atlas inspection, offer Smooth and Pixel exact text previews, and keep overflow inside inspection surfaces.
- **Do** use warm surfaces and hairline rules to group dense editing controls.

### Don't:

- **Don't** turn the editor into a decorative game-themed dashboard.
- **Don't** replace the imported font's visual character with expressive interface typography.
- **Don't** add motion that interrupts repeated editing or ignores reduced-motion preference.
- **Don't** hide an essential editing action behind dragging alone.
