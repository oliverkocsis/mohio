# Establish Initial Electron Desktop Shell

## Date

2026-03-19

## Why

Mohio needed a real product foundation instead of only prototypes. The goal for this milestone was to establish the first working Electron application with the most basic layout for the final product, while aligning the documentation with the current product direction.

## What Changed

- Added a standalone `desktop/` application built with `Electron`, `React`, `TypeScript`, `Vite`, and `npm`.
- Established the initial desktop structure for the Electron main process, secure preload bridge, renderer, and shared types.
- Added a typed `window.mohio` preload contract with basic app metadata access through `getAppInfo()`.
- Built the first real Mohio shell with a slim top bar, a left note rail, a centered editor area, and a right assistant panel.
- Finalized the top bar around a Mohio workspace label, a centered search field, and a `New note` primary action.
- Finalized the left sidebar around recent and pinned note placeholders.
- Finalized the editor area around a compact grouped formatting toolbar and a `Hello Mohio` empty state.
- Finalized the right sidebar around assistant suggestion chips and a simple composer area.
- Refined the shell styling into a calm, neutral, document-first interface with matching sidebar surfaces and restrained controls.
- Updated project documentation to reflect that Mohio is in active development and positioned as a bring-your-own AI workspace that works with Codex and Claude Code.
- Added renderer smoke coverage and a shared preload API contract test for the new desktop foundation.

## Impact

Mohio now has a real desktop application foundation in `desktop/` that serves as the starting point for the final product. The repository includes a basic but coherent Electron shell, a secure renderer boundary, a minimal assistant-aware note layout, and documentation that matches the current product direction.
