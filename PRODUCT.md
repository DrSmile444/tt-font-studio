# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript + Vite, explicitly selected by the user. No UI framework. Canvas bitmap rendering; pure TypeScript binary core and a worker for texture export.

## Users

LEGO TT Games modders and translators editing bitmap fonts for classic games of the PS2/HD era, initially PC resource variants.

## Product Purpose

Open a local FNT file, inspect and edit its metrics and atlas, preview English and Ukrainian, and download the edited resource without Python or a backend.

## Operating Context

A standalone public repository under DrSmile444, checked out at D:/Projects/tt-font-studio and deployed to GitHub Pages. Multiple fonts can be open together. Users supply their own game files.

## Capabilities and Constraints

Initial compatibility covers the observed Font 1 UI and Font 2 Adventure classic PC FNT layouts with DDS DXT5. Later TT Games formats are possible future extensions. All UI and repository text is English; i18n supports future locales. English and Ukrainian sample previews are always available. No game assets are distributed.

## Brand Commitments

The user selected a light technical editor with a dark atlas and warm yellow accent. Use Impeccable and Design Engineer for design, and UX Crux for review. Working product name: TT Font Studio, chosen for clarity and future format scope.

## Evidence on Hand

Local reference: lego-indi-1-ukrainizator/tools/fnt_tool.py, check_fnt_layout.py, bc_color_encoder.py, and glyph_viewer. Real Font 1/Font 2 fixtures exist locally but cannot be published as project assets. Synthetic fixtures and a labeled original demo provide redistributable evidence.

## Product Principles

- Keep files on the user's device.
- Preserve original bytes wherever edits do not require a change.
- Make glyph edits immediately visible in both preview languages.
- State observed compatibility and unsupported features precisely.
