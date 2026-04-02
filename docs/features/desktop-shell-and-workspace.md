# Desktop Shell and Workspace

This document covers the current shell and workspace flow in `desktop/`.

## Scope

- Electron application shell
- window and menu setup
- preload API surface
- workspace opening
- workspace tree rendering
- document selection

## Current State

- The app is a single Electron window.
- The shell layout has:
  - top bar
  - left workspace sidebar
  - center editor panel with a single active document surface
  - right sidebar with assistant and history tabs
- Both side panels can be collapsed and reopened from icon controls in the top bar.
- The renderer is implemented in `React` and `TypeScript`.
- The right sidebar hosts the live Codex assistant panel.

## Menu and Native Entry Points

- `File > Open Folder...` opens the native folder picker.
- Shortcut: `CmdOrCtrl+O`
- The top-bar workspace button triggers the same workspace-opening flow.

## Preload and Shared API

The renderer depends on `window.mohio` and does not access Node APIs directly.

Current API surface:

- `getAppInfo()`
- `getCurrentWorkspace()`
- `openWorkspace()`
- `searchWorkspace(query)`
- `readDocument(relativePath)`
- `createDocument({ directoryRelativePath })`
- `deleteDocument(relativePath)`
- `saveDocument(input)`
- `getPublishSummary()`
- `publishWorkspaceChanges()`
- `syncIncomingChanges(reason)`
- `getSyncState()`
- `resolveSyncConflict(input)`
- `watchDocument(relativePath | null)`
- `listAssistantThreads()`
- `createAssistantThread()`
- `getAssistantThread(threadId)`
- `sendAssistantMessage(input)`
- `cancelAssistantRun(threadId)`
- `renameAssistantThread(input)`
- `deleteAssistantThread(threadId)`
- `onWorkspaceChanged(listener)`
- `onDocumentChanged(listener)`
- `onAssistantEvent(listener)`

## Workspace Enumeration

- A workspace is a local folder selected by the user.
- Indexed document extensions:
  - `.md`
  - `.markdown`
  - `.mdx`
- Ignored directories:
  - `.git`
  - `node_modules`
  - `dist`
  - `build`
  - `coverage`
- Workspace nodes are sorted with directories first, then names alphabetically.

## Workspace Tree Behavior

- The left sidebar renders tabbed views:
  - `Documents` for full tree
  - `Search` for live note search
  - `Unpublished` for non-published documents only
- Tree document open behavior:
  - single-click opens the document in the main editor surface
  - right-click includes `Delete Note`
- The `New Note` action creates a markdown note in the selected note folder.
- If no note is selected, `New Note` creates the note at workspace root.
- Directories are expanded by default after a workspace loads.
- Clicking a directory row toggles expansion.
- Clicking a document row selects that document.
- Right-clicking a document row opens a context menu with `Delete Note`.
- The first document in the tree becomes the default selection after workspace load.
- Document rows display parsed titles when available.

## Workspace States

### No Workspace Open

- Left and right sidebars keep tab structure visible without workspace-empty placeholder copy.
- Center panel shows a single CTA to choose a folder.
- Search tab remains visible; its input is disabled until a folder is open.

### Workspace With No Markdown Documents

- Left sidebar shows `No Markdown documents found.`
- Center panel shows the workspace name and the same empty-content message.

### Workspace With Documents

- The selected document loads into the single editor surface.
- Newly created notes are selected and opened immediately.
- The active row is highlighted in the workspace tree.
- The top bar keeps quick `New Note` and panel visibility controls.
- The right sidebar supports assistant and history flows.

### Search and Discovery

- Left-sidebar `Search` tab includes a dedicated full-width input.
- Search is live and queries:
  - file/path matches
  - content matches with snippets
- Active query text is highlighted in the open editor with yellow in-document marks.
- Search input includes an inline `X` clear control on the right side.
- Internal Markdown and wiki links can be opened directly from the editor with `Cmd/Ctrl+Click`.

## Security Boundary

- The renderer is isolated from direct filesystem access.
- Workspace document access is validated in the main process.
- Paths outside the active workspace root are blocked.

## Current Limitations

- No dedicated rename-note action beyond title-driven file rename
- Panel collapse state is session-local (not persisted across restart)
- History diff is rendered as raw patch text rather than a rich split diff

## Code Anchors

- Main process workspace loading: `desktop/src/main/workspace.ts`
- Menu wiring: `desktop/src/main/menu.ts`
- Main process IPC and workspace state: `desktop/src/main/index.ts`
- Shared API contract: `desktop/src/shared/mohio-api.ts`
- Renderer workspace shell: `desktop/src/renderer/App.tsx`
