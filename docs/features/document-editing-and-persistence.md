# Document Editing and Persistence

This document covers how Mohio currently reads, edits, saves, renames, and re-syncs Markdown documents.

## Scope

- Markdown parsing
- document title handling
- Markdown-source editing
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

- Editor implementation: `CodeMirror`
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

## Markdown Editing Model

- The body editor works directly on the saved Markdown source.
- `CodeMirror` owns the editing surface, selection state, syntax highlighting, and keyboard interaction.
- Toolbar actions rewrite the current selection or line range into Markdown instead of converting through HTML.
- The editor presentation hides Markdown control characters for headings, emphasis, lists, links, rules, and fenced code so the body reads as formatted text while preserving the original source underneath.
- Hidden Markdown control ranges are treated as atomic in the editor so list continuation and cursor movement do not temporarily reveal raw syntax or break the WYSIWYG presentation.
- Empty continued list items such as `- ` and `1. ` are still classified as list rows so adjacent list spacing stays stable before the user types content.
- Tables, task lists, and other Markdown structures stay editable because Mohio no longer maps the document into a separate rich-text model.

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
- No rendered preview or split-view editor yet
- No create-note flow yet
- No in-app rename action outside editing the title of an existing file
- No publish workflow
- No search workflow in the UI yet

## Code Anchors

- Main process document reads and saves: `desktop/src/main/document-store.ts`
- Shared document formats: `desktop/src/shared/document-format.ts`
- Renderer editor shell: `desktop/src/renderer/App.tsx`
- Markdown editor implementation: `desktop/src/renderer/markdown-editor.tsx`
