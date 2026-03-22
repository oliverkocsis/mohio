# Add Codex AI Assistance Panel

## Date

2026-03-22

## Context

Mohio already had a three-panel desktop shell, but the right sidebar was only visual scaffolding. The roadmap called for embedded AI assistance inside the workspace, and the desktop app needed a real first assistant workflow that matched the existing bring-your-own-AI direction without letting the assistant silently change workspace files.

## Change

- Added a live assistant runtime in the Electron main process that starts the installed `codex` CLI with JSON event streaming.
- Added assistant IPC methods and shared types for loading note threads, sending note-scoped messages, cancelling active runs, and receiving streamed assistant updates.
- Implemented the right sidebar as a working Codex chat panel with transcript bubbles, quick actions, composer input, cancel behavior, and panel-local error handling.
- Scoped conversations per note for the current app session while still running each Codex call from the active workspace root.
- Passed the current note title, note body, workspace path, workspace name, and note-thread history into each assistant prompt.
- Migrated in-memory assistant thread state when note saves rename a file through the title edit flow.
- Added main-process and renderer coverage for Codex command startup, streamed updates, cancellation, rename migration, and assistant UI behavior.
- Updated feature, architecture, design, and manual documentation to reflect the live assistant workflow.

## Decision

Shipped the first assistant integration as chat-only, read-only workspace assistance through `codex exec` instead of jumping directly to structured document edits or a deeper persistent Codex protocol. This keeps the product behavior explicit and reviewable while still making the assistant useful inside the existing workspace flow.

## Impact

Mohio now includes a real embedded Codex assistant in the desktop shell. Users can ask for note and workspace help from the right sidebar without leaving the app, while the product still avoids silent assistant-driven file mutations.
