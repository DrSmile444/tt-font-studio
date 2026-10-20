# Static application

## Purpose

Deliver a maintainable English-first frontend that can be hosted on GitHub Pages and later translated without changing editing logic.

## ADDED Requirements

### Requirement: Browser-only processing
The application SHALL process user files locally without uploading them and SHALL require no application backend.

#### Scenario: Edit after static assets load
- **WHEN** the application has loaded and a local FNT is opened
- **THEN** parsing, previewing, editing, and exporting SHALL execute without network requests for that file

### Requirement: English-first internationalization
All application UI text SHALL use a centralized locale system with English as the default and fallback, and repository code, documentation, and specifications SHALL be English. Ukrainian preview text SHALL remain available independently of interface locale.

#### Scenario: Missing translated key
- **WHEN** a future locale omits a message
- **THEN** the English message SHALL be used

### Requirement: Keyboard and responsive access
The interface SHALL expose labeled controls, visible focus, keyboard glyph selection and import, text alternatives for canvas data, status and error announcements, and a usable stacked layout on narrow screens.

#### Scenario: Use without dragging
- **WHEN** a keyboard user opens the file picker, chooses a font, searches a glyph, and edits metrics
- **THEN** they SHALL complete the same task available through dragging and atlas clicking

### Requirement: Continuous verification and Pages deployment
The repository SHALL include a reproducible build, automated core and browser tests, and a GitHub Actions workflow deploying the built application to GitHub Pages on the default branch.

#### Scenario: Publish a successful build
- **WHEN** changes reach the default branch and required checks pass
- **THEN** the workflow SHALL upload and deploy the static build with correct repository-relative asset paths
