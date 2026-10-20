# Preview controls

## Purpose

Let users inspect bitmap fonts at native resolution, choose readable text rendering, and compare glyph pixels against useful backgrounds without modifying their resources.

## ADDED Requirements

### Requirement: Selectable density-aware text rendering
The application SHALL provide Smooth and Pixel exact text preview modes, default to Smooth and 100% text scale, and render both preview languages at the display pixel density subject to a bounded canvas allocation.

#### Scenario: Use a HiDPI display
- **WHEN** a preview is rendered at device pixel ratio 2
- **THEN** its backing canvas SHALL use twice the CSS dimensions unless constrained by the allocation limit, without changing its displayed size

#### Scenario: Change rendering mode
- **WHEN** the user selects Pixel exact or Smooth
- **THEN** both preview canvases SHALL use the selected sampling mode while retaining text, zoom, and current document edits

### Requirement: Native atlas scale by default
The application SHALL open imported fonts and the demo at 100% atlas zoom and SHALL keep Fit available as an explicit action.

#### Scenario: Open a font after using Fit
- **WHEN** another font is imported
- **THEN** its initial atlas zoom SHALL be 100%

### Requirement: Reveal selected glyphs
The application SHALL scroll the atlas viewport only as needed to reveal a glyph chosen from the list, without changing atlas zoom or scrolling the outer page. A glyph larger than the viewport SHALL be centered as far as scroll bounds permit.

#### Scenario: Select an off-screen glyph
- **WHEN** the chosen glyph rectangle lies outside the current atlas viewport
- **THEN** its rectangle SHALL be brought into view at the current zoom

#### Scenario: Select an already visible glyph
- **WHEN** the chosen glyph rectangle is fully visible
- **THEN** the current atlas scroll position SHALL remain unchanged

### Requirement: Atlas background choices
The application SHALL expose labeled Transparency, Green, and White choices immediately below the atlas, with Transparency initially selected. Selection SHALL survive glyph edits and font switching during the session.

#### Scenario: Change background
- **WHEN** Green or White is selected
- **THEN** the checkerboard SHALL be replaced by the chosen solid background without changing atlas pixels, dirty state, or exported FNT/PNG content
