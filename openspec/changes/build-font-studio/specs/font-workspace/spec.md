# Font workspace

## Purpose

Provide a discoverable local editing workspace with independent fonts, precise glyph controls, and bilingual live bitmap previews.

## ADDED Requirements

### Requirement: Accessible multi-file import
The application SHALL support drag and drop of one or several FNT files and an equivalent labeled file picker, with visible drop feedback and independent per-font state.

#### Scenario: Load and switch two fonts
- **WHEN** Font 1 and Font 2 are dropped together and the user switches between them
- **THEN** each font SHALL retain its edits, selection, and undo history

### Requirement: Inspect and edit glyph metrics
The application SHALL expose a searchable glyph list, atlas selection, editable X, Y, and width, shared height and baseline, undo, redo, and per-glyph reset. Numeric edits SHALL reject non-finite and out-of-bounds values without corrupting the font.

#### Scenario: Edit a glyph
- **WHEN** a valid metric edit is committed
- **THEN** the selected rectangle and text previews SHALL update immediately and undo SHALL restore the prior value

### Requirement: English and Ukrainian previews
The application SHALL provide editable English and Ukrainian sample texts, adjustable preview scale and background, and explicit missing-character indicators rendered from the active font atlas.

#### Scenario: Preview edited text
- **WHEN** the active font or a used glyph changes
- **THEN** both previews SHALL reflect that font's current metrics and pixels and missing characters SHALL be identified

### Requirement: Explicit metric normalization
The application SHALL offer reversible rounding of fractional glyph coordinates and widths, describe the operation before applying it, and preserve atlas pixels, Unicode mapping, and baseline.

#### Scenario: Normalize metrics
- **WHEN** the user invokes metric rounding
- **THEN** changed metrics SHALL become integer values and one undo SHALL restore all original values

### Requirement: Recovery and unsaved work
The application SHALL show changed state, allow undoing texture and metric edits, confirm closing an edited font, and warn before navigating away with unexported edits.

#### Scenario: Close edited font
- **WHEN** a user closes a font with unexported edits
- **THEN** the application SHALL request confirmation before discarding that font
