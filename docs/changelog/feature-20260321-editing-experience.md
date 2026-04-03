# Add Desktop Editing Experience

## Date

2026-03-21

## Context

Mohio had a desktop shell and workspace browsing flow, but it still lacked a real document editing workflow. Users could open workspaces and browse Markdown files, yet they could not load an existing document, edit it in the app, and save it back to disk through a production-facing editor surface.

## Change

- Added a new document read and save contract to the shared Mohio API, preload bridge, and Electron main process.
- Implemented safe document loading and saving inside the active workspace, including path validation to block access outside the workspace root.
- Added Markdown document parsing utilities that extract the visible title from frontmatter or a leading H1 and rebuild durable Markdown on save.
- Implemented filename sanitization that preserves spaces and capitalization, removes only illegal cross-platform characters, and adds numeric postfixes only when collisions occur.
- Added the first real editing surface in the renderer with a title field, save-state indicator, and a `Quill`-based rich-text editor.
- Replaced the placeholder toolbar with working controls for headings, bold, italic, strikethrough, block quotes, lists, links, images, inline code, code blocks, horizontal rules, and clear formatting.
- Added autosave for title and body changes with a single `1000ms` idle debounce.
- Updated the workspace tree to show parsed document titles instead of only filename stems when frontmatter or H1 titles are available.
- Added active file watching for the selected document so the editor reloads on-disk file changes and stays in sync when the file is overridden outside Mohio.
- Added preservation handling for unsupported task-list and table Markdown blocks so they remain intact through editing and saving.
- Added MIT licensing metadata to the repository with a root `LICENSE` file, a `README` license section, and an explicit `license` field on the desktop package.
- Expanded main-process, shared API, and renderer test coverage for document loading, saving, renaming, autosave, and the updated editor UI.

## Decision

Chose a `Quill`-based WYSIWYG editor with autosave instead of waiting for a fuller Markdown-source workflow so the product could deliver a usable editing experience earlier. Preserved unsupported task-list and table blocks rather than forcing lossy conversion, prioritizing Markdown safety over broader editing coverage in this milestone.

## Impact

Mohio now supports the first end-to-end document editing workflow inside the desktop app. Users can open a workspace, load a real Markdown document, edit it through a rich-text surface, and rely on automatic persistence back to durable Markdown files. The feature also establishes the document API, title/filename rules, and renderer structure needed for later milestones such as new-document creation, source mode, and richer Markdown support.
