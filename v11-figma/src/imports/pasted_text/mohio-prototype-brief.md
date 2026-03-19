# Mohio Prototype Brief

Mohio is a local Markdown workspace for writing, organizing, and publishing notes with embedded AI assistance. The product should feel like a writing tool first: calm, focused, and document-centered, not like an IDE or chat app.

## Core UI

Use a desktop three-panel layout with a slim top bar.

### Top Bar

Show:

- workspace name
- current file title
- search entry point
- `New note`
- `Create checkpoint`
- `Publish`

### Left Sidebar

Use the left side for workspace navigation:

- search field
- `New note` button
- file list
- recent or pinned notes
- rename and delete actions on file rows or in a file menu

The active file should be clearly highlighted.

### Center Panel

Make the center panel the largest area. It contains:

- document title field
- styled Markdown editor
- optional lightweight inline formatting toolbar

Users edit raw Markdown directly, but the editor should visually style headings, lists, blockquotes, links, emphasis, inline code, and fenced code blocks so the document is readable while still fully editable.

### Right Sidebar

Use the right side for document assistance and status:

- agent chat thread
- suggested agent actions
- checkpoint list for the current file
- publish status or last published state

## Key Features

Mohio should support these visible user flows:

- Open a local folder as a workspace.
- Show Markdown files as notes in the sidebar.
- Switch between notes quickly.
- Create a new note and open it immediately.
- Rename and delete notes inside the app.
- Search by file name and note content.
- Edit Markdown directly in a styled source editor.
- Recognize local Markdown links and open linked notes.
- Save edits continuously without a manual save flow.
- Create named checkpoints for the current note.
- Browse and restore earlier checkpoints.
- Publish the current note as a deliberate action separate from editing.
- Use an embedded agent to summarize, rewrite, organize, expand, update the current note, or create a new one.
- Clearly show what the agent changed.

## Interface Priorities

The screen should prioritize:

1. current document content
2. file navigation and search
3. checkpoints and publish actions
4. agent assistance

The editor should always remain the center of gravity.

## Layout Guidance

Suggested desktop proportions:

- left sidebar: `280px` to `320px`
- center editor: flexible, with readable width around `760px` to `960px`
- right sidebar: `340px` to `420px`
- top bar: `56px` to `64px`

## Mobile or Narrow Screens

On smaller screens, collapse to an editor-first layout:

- left sidebar becomes a workspace drawer
- right sidebar becomes an agent drawer or tab
- editor stays visible by default
- `Create checkpoint` and `Publish` stay accessible in the top bar

## Example Flow

1. Open a workspace.
2. Pick a note from the sidebar.
3. Edit it in the center panel.
4. Search or follow links to other notes.
5. Ask the agent for help.
6. Review the result.
7. Create a checkpoint.
8. Publish when ready.
