# Workspace File System Integration

## Date

2026-03-21

## Why

Mohio's desktop app needed to move beyond a static shell and support the first real local-first workflow. Users needed a native way to open a folder as a workspace, browse Markdown documents from the filesystem, and see a cleaner workspace-focused interface that felt more like a real desktop knowledge tool than a placeholder frame.

## What Changed

- Added local workspace selection in the Electron main process, including directory picking and Markdown file-tree enumeration for `.md`, `.markdown`, and `.mdx` documents.
- Added a shared typed workspace contract between the main process, preload bridge, and renderer so the app can load the current workspace, open a workspace, and react to workspace changes from both UI actions and the `File` menu.
- Added a `File > Open Workspace...` menu item with the `CmdOrCtrl+O` shortcut and wired it so menu-based workspace changes refresh the renderer immediately.
- Replaced the static left sidebar with a real workspace browser that lists Markdown files in a nested folder tree.
- Added expandable and collapsible folder rows with chevrons that point right when collapsed and down when expanded.
- Tightened the workspace tree spacing into a denser, more Notion-like left-navigation rhythm for faster scanning.
- Simplified the empty workspace state into a single centered folder-selection CTA with minimal copy.
- Removed duplicate workspace context from the left sidebar once the active workspace was already shown in the top bar.
- Hid the `New note` action until a workspace is open.
- Simplified the main document panel so the selected document title remains the primary visible identifier without showing the file path underneath.
- Added or updated tests for workspace enumeration, menu behavior, shared API behavior, and renderer interaction around tree state and workspace loading.
- Updated the architecture and design documentation to reflect the new workspace integration, collapsible navigation tree, and denser left-sidebar direction.

## Affected Areas

- `desktop/src/main/`
- `desktop/src/preload/`
- `desktop/src/shared/`
- `desktop/src/renderer/`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN.md`

## Impact

Mohio now has a usable first-pass workspace flow: users can open a local folder, browse its Markdown documents in a collapsible navigation tree, and interact with a cleaner shell that only exposes actions that make sense for the current workspace state.
