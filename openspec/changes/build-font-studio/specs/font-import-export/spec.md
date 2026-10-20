# Font import and export

## Purpose

Let modders read and edit classic TT Games PC bitmap fonts entirely in their browser and save structurally valid resources.

## ADDED Requirements

### Requirement: Import both known classic font layouts
The application SHALL import the Font 1 UI and Font 2 Adventure PC FNT layouts, reading declared metrics, mapping counts, embedded DXT5 DDS data, and relocation information.

#### Scenario: Import either font
- **WHEN** a supported Font 1 or Font 2 file is opened
- **THEN** the atlas, glyph mapping, dimensions, shared height, and baseline SHALL be shown from that file without Python preprocessing

### Requirement: Validate files before use
The application SHALL reject unsupported or truncated resources and invalid table, texture, or relocation ranges with an actionable English error, retaining already loaded fonts.

#### Scenario: Drop an invalid resource
- **WHEN** the user opens a malformed file or an unsupported texture encoding
- **THEN** the application SHALL report the reason and SHALL preserve the existing workspace

### Requirement: Preserve binary data on metric export
The application SHALL preserve unknown bytes, mapping duplicates, sentinel slots, and original DDS bytes when exporting only metric changes.

#### Scenario: Unedited binary round trip
- **WHEN** an imported file is exported without changes
- **THEN** its content SHALL be byte-identical to the input

#### Scenario: Shared glyph aliases
- **WHEN** multiple codepoints reference one glyph index and its metrics are edited
- **THEN** all aliases SHALL preview the same updated metrics and export one updated metrics record

### Requirement: Replace and export atlas pixels
The application SHALL accept a PNG replacement of identical atlas dimensions, encode DXT5 at all original mip levels, and export a valid FNT while retaining the original resource structure.

#### Scenario: Replace atlas
- **WHEN** a same-size PNG is applied to a selected font and exported
- **THEN** the exported FNT SHALL contain the replacement texture with the original mip count

### Requirement: Portable exports
The application SHALL allow downloading the decoded atlas as PNG and mapping and metrics as JSON.

#### Scenario: Export inspection data
- **WHEN** the user selects PNG or JSON export
- **THEN** the selected font's current image or metadata SHALL download locally

### Requirement: Preserve historical opaque pointer values
The application SHALL retain unknown pointer-field values during fixed-size editing. It SHALL warn when an opaque target lies outside the resource, and SHALL reject relocation entries that point to unreadable field locations.

#### Scenario: Historical opaque target
- **WHEN** a supported font has valid editable tables and texture boundaries but an opaque pointer target is out of range
- **THEN** the application SHALL show a source warning, preserve that field unchanged, and permit fixed-size metric editing
