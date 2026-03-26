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
- `titleMode` (`h1-linked` or `filename-linked`)
- optional `frontmatterTitle`

The renderer edits two draft fields:

- title
- Markdown body

## Title Resolution

When Mohio reads a Markdown file, it picks one of two title modes:

1. `h1-linked`
   - active when the first H1 (after optional leading blank lines) sanitizes to the same value as the sanitized filename stem
   - visible title comes from that H1
   - the leading H1 is removed from the editable body
2. `filename-linked`
   - active when no first H1 exists, or when sanitized H1 and sanitized filename stem differ
   - visible title comes from the filename stem
   - the body is kept as-is (no title-driven H1 stripping)

`frontmatter.title` is ignored for visible-title resolution.

## Save Behavior

On save, Mohio rebuilds the file with:

- `h1-linked` mode:
  - rewrites the leading H1 from the title field
  - renames the file from the sanitized title
- `filename-linked` mode:
  - renames the file from the sanitized title
  - does not insert or rewrite H1 based on title edits
- existing frontmatter is preserved as-is, including `frontmatter.title` if present

## Note Creation and Deletion

- New notes can be created from the workspace sidebar.
- Mohio writes new notes with a default `# Untitled` heading.
- New notes are created in the selected note's folder.
- If no note is selected, the new note is created at workspace root.
- Name collisions use numeric suffixes (`Untitled.md`, `Untitled 1.md`, ...).
- Notes can be deleted from the workspace tree context menu after explicit confirmation.

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
- Save-time body normalization only standardizes line endings and otherwise preserves Markdown whitespace such as hard line breaks, fenced code indentation, and intentional blank lines in the body source.
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
- No in-app rename action outside editing the title of an existing file
- No publish workflow
- No search workflow in the UI yet

## Code Anchors

- Main process document reads and saves: `desktop/src/main/document-store.ts`
- Shared document formats: `desktop/src/shared/document-format.ts`
- Renderer editor shell: `desktop/src/renderer/App.tsx`
- Markdown editor implementation: `desktop/src/renderer/markdown-editor.tsx`
