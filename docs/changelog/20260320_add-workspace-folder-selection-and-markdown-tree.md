# Add workspace folder selection and Markdown tree browsing

## Why

Mohio's desktop app had only a static shell, so the core local-first workflow could not begin. Users could not open a folder, see which workspace was active, or browse Markdown files from the actual filesystem.

## What Changed

- Added Electron main-process workspace handlers that open a local folder and enumerate Markdown documents as a nested tree.
- Added a shared typed workspace contract so the preload bridge and renderer can request the current workspace and open a new one safely.
- Replaced the static left sidebar content with real workspace UI that shows the current workspace name, folder path, document count, and Markdown file tree.
- Added renderer and unit tests for the workspace API and Markdown tree enumeration.
- Updated the architecture documentation to reflect that the desktop shell now includes first-pass local workspace integration.

## Affected Areas

- `desktop/src/main/`
- `desktop/src/preload/`
- `desktop/src/shared/`
- `desktop/src/renderer/`
- `docs/ARCHITECTURE.md`
