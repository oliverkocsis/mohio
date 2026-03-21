# Add Desktop Editing Experience

## Date

2026-03-21

## Why

Mohio needed to move beyond a placeholder editor shell and deliver the first real document editing workflow on top of the new workspace file-system foundation. The goal for this feature was to let users open existing Markdown documents, edit them through a polished WYSIWYG surface, and keep Markdown as the durable source format without introducing a manual save workflow.

## What Changed

- Added a new document read and save contract to the shared Mohio API, preload bridge, and Electron main process.
- Implemented safe document loading and saving inside the active workspace, including path validation to block access outside the workspace root.
- Added Markdown document parsing utilities that extract the visible title from frontmatter or a leading H1 and rebuild durable Markdown on save.
- Implemented filename sanitization that preserves spaces and capitalization, removes only illegal cross-platform characters, and adds numeric postfixes only when collisions occur.
- Added the first real editing surface in the renderer with a title field, save-state indicator, and a `Quill`-based rich-text editor.
- Replaced the placeholder toolbar with working controls for headings, bold, italic, strikethrough, block quotes, lists, links, images, inline code, code blocks, horizontal rules, and clear formatting.
- Added autosave for title and body changes with a single `1000ms` idle debounce.
- Updated the workspace tree to show parsed document titles instead of only filename stems when frontmatter or H1 titles are available.
- Added preservation handling for unsupported task-list and table Markdown blocks so they remain intact through editing and saving.
- Expanded main-process, shared API, and renderer test coverage for document loading, saving, renaming, autosave, and the updated editor UI.

## Impact

Mohio now supports the first end-to-end document editing workflow inside the desktop app. Users can open a workspace, load a real Markdown document, edit it through a rich-text surface, and rely on automatic persistence back to durable Markdown files. The feature also establishes the document API, title/filename rules, and renderer structure needed for later milestones such as new-note creation, source mode, and richer Markdown support.
