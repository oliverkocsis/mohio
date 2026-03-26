# feature-20260326-note-and-document-management

## Date

2026-03-26

## Context

The desktop workspace already supported opening and editing Markdown files, but note lifecycle actions were missing from the app shell and title behavior still prioritized frontmatter over the intended filename/H1 coupling. Users had to create and delete files outside Mohio, and document titles could drift from filename intent when H1 and file naming diverged.

## Change

- Added document creation and deletion APIs to the shared Mohio contract, preload bridge, and Electron IPC channels.
- Implemented main-process document-store operations for creating notes and deleting notes with workspace-path validation.
- Added unique note-name allocation for `Untitled.md`, `Untitled 1.md`, and subsequent collisions.
- Enabled the sidebar `New Note` action in workspace mode:
  - creates in the selected note's folder
  - falls back to workspace root when no note is selected
  - opens the newly created note immediately
- Added a renderer context menu on workspace document rows with a `Delete Note` action and confirmation flow.
- Updated selection handling so the active note highlight stays correct after create/delete transitions.
- Reworked title parsing and save behavior into two explicit modes:
  - `h1-linked` mode when sanitized first H1 matches sanitized filename stem
  - `filename-linked` mode otherwise
- Stopped using `frontmatter.title` for visible title resolution.
- Updated save behavior so:
  - `h1-linked` mode rewrites the first H1 from the editor title and renames the file
  - `filename-linked` mode renames the file without rewriting/inserting H1
  - existing frontmatter (including `title`) is preserved as-is
- Added `titleMode` to loaded/saved document contracts so mode stays stable during an edit session and only recalculates on reload/file-change refresh.
- Added test coverage for:
  - main document create/delete behavior and safety checks
  - shared API create/delete wiring
  - renderer new-note and delete-note interaction flows
  - H1/filename title-mode parsing and mode-specific save behavior
- Updated feature and manual docs to reflect in-app note creation and deletion.

## Decision

Mohio now treats note creation and deletion as first-class workspace operations in the desktop shell, while keeping safety explicit:

- create defaults to predictable `Untitled` naming
- delete is an explicit confirmed action
- all filesystem operations remain constrained to the active workspace boundary
- visible titles now follow deterministic H1/filename coupling instead of frontmatter precedence
