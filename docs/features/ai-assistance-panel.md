# AI Assistance Panel

This document covers the current Codex integration in the right sidebar of `desktop/`.

## Scope

- assistant IPC surface
- main-process Codex execution
- renderer transcript and composer UI
- note-scoped in-session conversation state

## Current State

- The right sidebar is a live assistant panel instead of layout scaffolding.
- Mohio uses the installed `codex` CLI through `codex exec`.
- Each assistant run executes from the active workspace root.
- Codex is limited to read-only workspace access in this integration.
- Assistant conversations are kept separately per note for the current app session only.
- Mohio does not persist assistant history across restarts.
- Mohio does not let the assistant apply edits, patches, or note proposals yet.

## API Surface

The renderer uses `window.mohio` for assistant behavior:

- `getAssistantThread(noteRelativePath)`
- `sendAssistantMessage(input)`
- `cancelAssistantRun(noteRelativePath)`
- `onAssistantEvent(listener)`

Assistant input payload:

- `noteRelativePath`
- `content`
- `documentTitle`
- `documentMarkdown`

Assistant thread shape:

- note-relative thread identity
- ordered `user` and `assistant` messages
- run status: `idle`, `running`, or `error`
- optional panel-local error message

## Runtime Behavior

- The main process spawns `codex` with JSON event output enabled.
- Mohio runs Codex from the active workspace root with:
  - `exec`
  - `--json`
  - `--ephemeral`
  - `--skip-git-repo-check`
  - `--sandbox read-only`
- Mohio passes the current note title, note body, note path, workspace name, workspace path, and note-thread history in the prompt.
- Codex may inspect any file in the active workspace during the run.
- Mohio streams assistant text into the sidebar as JSONL events arrive.
- Non-fatal stderr output is treated as diagnostics.
- Failed runs stay local to the assistant panel and do not affect editor state.

## Renderer Behavior

- The header shows the assistant label plus the current note and workspace context.
- The transcript renders chat bubbles for the current note thread only.
- Quick actions send:
  - `Summarize this note`
  - `Organize this note`
  - `Suggest related notes from this workspace`
- The composer is disabled when no workspace is open, no note is selected, or a run is already active.
- The cancel button stops the current note-thread run.

## Rename Handling

- If a note rename changes the relative path during save, main migrates the existing assistant thread to the new note path.
- This preserves the in-session conversation when the file name changes from the title edit flow.

## Current Limitations

- Only Codex is wired today; Claude Code is not yet integrated.
- Assistant history is not stored on disk.
- There is no review/apply workflow for assistant-generated document changes.
- There is no assistant tool UI for note creation, publish, or history actions yet.
