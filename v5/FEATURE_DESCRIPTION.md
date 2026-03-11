# Mohio v5 Feature Description

This document defines the minimum viable feature set for a local Markdown workspace editor.

The goal for `v5` is a usable editor for a folder of Markdown files with a stronger writing experience than the earlier prototypes. The product should feel close to Obsidian's source editing model: users edit Markdown directly, but the text is styled so headings, lists, links, emphasis, and code feel readable while still remaining raw Markdown.

## Core Product Goal

Mohio `v5` should let a user open a local workspace, move between Markdown files, edit them directly, and trust that every change is persisted automatically without manual saving.

## Minimum Features

### 1. Open local workspace

- Open a local folder as the workspace
- Treat Markdown files in that folder as editable documents
- Keep the experience local-first, with no required backend

### 2. Workspace file navigation

- Show Markdown files in a sidebar or file list
- Let users switch between files quickly
- Keep the current file and recent context obvious

### 3. Direct Markdown editing

- Open and edit `.md` files as plain Markdown
- Preserve the raw Markdown syntax in the editor
- Support normal text selection, cursor movement, and multiline editing

### 4. Styled source editor

- Do not rely on a separate preview as the main reading experience
- Render Markdown source with strong visual styling in the editor itself
- Make headings, lists, blockquotes, links, inline code, fenced code, and emphasis visually distinct
- Keep the underlying text fully editable at all times

This should copy the general behavior of Obsidian's styled editing experience: the user is still editing Markdown code, but the code has proper visual hierarchy and readability.

### 5. Automatic persistence

- Persist every edit to the local file system automatically
- Do not require a manual save action during normal editing
- Treat continuous saving as a built-in behavior rather than a visible primary workflow

### 6. Checkpoints

- Let users create a named checkpoint for the current file state
- Position checkpoints as a user-friendly way to mark important progress, larger edits, or pre-publish states
- Make checkpoints easy to browse and restore later

### 7. Publish

- Let users publish the current file so others in the same workspace can see the updated shared version
- Keep publish as an explicit action separate from local editing
- Make the difference between private ongoing edits and published shared content clear

### 8. Create new Markdown files

- Create a new note inside the current workspace
- Open the new file immediately after creation

### 9. Rename and delete files

- Rename notes from inside the app
- Delete notes from inside the app
- Keep these actions simple and explicit

### 10. Local Markdown links

- Support relative Markdown links between files
- Recognize links in the editor
- Let users open linked files from the workspace

### 11. Search

- Search by file name
- Search text across Markdown files in the workspace

### 12. Agent chat

- Provide an embedded agent chat similar to Codex or Claude Code
- Let users ask the agent to summarize, rewrite, organize, or expand workspace content in plain language
- Allow the agent to modify existing Markdown files or create new ones in the workspace
- Keep agent actions explicit and reviewable so users can understand what changed
- Make the chat feel useful for non-technical users, not like a developer console

## Explicit v5 decisions

- Continuous automatic persistence is required
- `Checkpoints` is the user-facing term for named file states before or between larger changes
- `Publish` is the user-facing term for sharing updated content with others in the same workspace
- `Styled source editing` replaces a traditional preview-first requirement
- Agent chat is a core workspace capability, not a separate power-user tool
- A separate read-only preview can exist later, but it is not required for the `v5` minimum

## Not required for v5

- Real-time collaboration
- Git UI
- Graph view
- Comments
- Mobile support
- Rich text editing that hides Markdown syntax
