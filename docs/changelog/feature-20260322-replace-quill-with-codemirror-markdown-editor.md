# Replace Quill with CodeMirror Markdown Editor

## Date

2026-03-22

## Context

Mohio's first desktop editing milestone used `Quill` to present Markdown through a rich-text model. In practice that conversion layer caused input lag, dropped characters during editing, and forced Mohio to preserve some Markdown structures outside the editor because the rendered model could not represent them safely.

## Change

- Replaced the `Quill` editor with a `CodeMirror` Markdown-source editor in the renderer.
- Removed the HTML round-trip that previously converted Markdown into editor HTML and back on every change.
- Reworked toolbar actions so they transform the current Markdown selection or line range directly for headings, emphasis, lists, links, images, code blocks, horizontal rules, and clear formatting.
- Added a presentation layer that hides Markdown syntax characters in the editor and styles the visible text as headings, emphasis, quotes, lists, rules, links, and fenced code.
- Fixed a list-editing crash where pressing `Enter` in a bullet list could invalidate the decoration builder and make the editor fall back to visible raw Markdown.
- Fixed overlapping inline decoration handling so Markdown images do not collide with link styling and break the editor presentation layer.
- Preserved Markdown body whitespace on save instead of trimming trailing spaces or code-block indentation out of the source.
- Kept the existing title field, autosave behavior, workspace syncing, and document persistence contract unchanged.
- Added focused renderer tests for the new markdown toolbar transformations.
- Updated the architecture, feature, manual, and changelog documentation to describe the new source-editing model.

## Decision

Chose a direct Markdown editor with `CodeMirror` instead of continuing to patch a lossy rich-text abstraction. This keeps the saved Markdown as the single source of truth, makes all Markdown structures editable in place, and removes a fragile conversion path that was degrading typing reliability.

## Impact

Mohio now edits document bodies directly as Markdown text. The editor surface should behave more predictably during typing, while still keeping the existing toolbar and autosave workflow for common formatting actions.
