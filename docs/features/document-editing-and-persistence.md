# Document Editing and Persistence

This document covers how Mohio currently reads, edits, saves, renames, and re-syncs Markdown documents.

## Scope

- Markdown parsing
- document title handling
- rich-text editing
- Markdown serialization
- autosave
- filename normalization
- external file-change handling

## Document Model

Each loaded document currently returns:

- `relativePath`
- `fileName`
- `displayTitle`
- `markdown`
- optional `frontmatterTitle`

The renderer edits two draft fields:

- title
- Markdown body

## Title Resolution

When Mohio reads a Markdown file, the visible title is resolved in this order:

1. frontmatter `title`
2. leading H1
3. filename without Markdown extension
4. `Untitled`

The leading H1 is removed from the editable body so the body editor does not duplicate the title field.

## Save Behavior

On save, Mohio rebuilds the file with:

- a normalized H1 generated from the title field
- preserved non-title frontmatter
- optional frontmatter `title` only when the filesystem-safe filename would need to differ from the visible title

## Filename Rules

- Illegal cross-platform filename characters are removed.
- Trailing spaces and trailing dots are removed.
- Windows reserved basenames are rewritten with a ` Note` suffix.
- Empty titles fall back to `Untitled`.
- When a renamed filename collides with an existing file in the same folder, Mohio appends a numeric suffix such as ` 1`, ` 2`, and so on.

## Editor Surface

- Editor implementation: `Quill`
- Title field: auto-resizing textarea
- Toolbar actions currently implemented:
  - H1
  - H2
  - H3
  - bold
  - italic
  - strikethrough
  - inline code
  - block quote
  - bulleted list
  - numbered list
  - code block
  - link insertion by prompt
  - image insertion by prompt
  - horizontal rule
  - clear formatting

## Markdown Conversion

- `marked` converts Markdown into editor HTML.
- `turndown` converts editor HTML back into Markdown.
- Output normalizes to fenced code blocks, ATX headings, `-` list markers, and trimmed spacing.

## Preserved Blocks

Task lists and tables are not fully editable in rich-text mode yet.

Current behavior:

- Mohio detects those blocks in Markdown before rendering.
- They are inserted into the editor as protected preserved blocks.
- Their original Markdown is stored in dataset attributes and round-tripped back to the saved file.

## Autosave

- Autosave runs after `1000ms` of idle time when the draft differs from the last saved snapshot.
- Saving updates the selected document path if the title changed the filename.
- Save failures are surfaced in the editor panel as a local error state.

## External File Changes

- The selected document is watched through the Electron main process.
- If the file changes on disk, Mohio reloads the current workspace summary and current document.
- If the file disappears, the renderer clears the document and selects the next available document when possible.
- If the incoming version is safe to apply, the renderer refreshes the visible title and body automatically.

## Current Limitations

- No explicit save history or checkpoint UI yet
- No source-mode editor yet
- No create-note flow yet
- No in-app rename action outside editing the title of an existing file
- No publish workflow
- No search workflow in the UI yet

## Code Anchors

- Main process document reads and saves: `desktop/src/main/document-store.ts`
- Shared document formats: `desktop/src/shared/document-format.ts`
- Renderer editor shell: `desktop/src/renderer/App.tsx`
- Rich-text editor implementation: `desktop/src/renderer/rich-text-editor.tsx`
- Markdown conversion helpers: `desktop/src/renderer/editor-markdown.ts`
