# Add Codex AI Assistance Panel

## Date

2026-03-22

## Context

Mohio already had a three-panel desktop shell, but the right sidebar was only visual scaffolding. The roadmap called for embedded AI assistance inside the workspace, and the desktop app needed a real first assistant workflow that matched the existing bring-your-own-AI direction without letting the assistant silently change workspace files.

## Change

- Replaced the earlier `codex exec`-per-note runtime with a long-lived `codex app-server` client in the Electron main process.
- Added assistant IPC methods and shared types for listing Codex chats, creating a new chat, loading a specific Codex thread, sending note-aware prompts into that thread, cancelling active runs, and receiving streamed assistant updates.
- Implemented the right sidebar as a working Codex chat panel with a workspace-filtered history list, `New chat` action, parallel chat selection, transcript bubbles, quick actions, composer input, cancel behavior, and panel-local error handling.
- Refined the assistant sidebar into a two-stage flow: a first screen for browsing Codex sessions, and a dedicated chat screen with back navigation plus per-thread `New chat`, rename, and delete actions.
- Simplified the assistant empty-state copy to `Open a folder to chat with the assistant`.
- Normalized visible button labels to Title Case, including `Open Folder`, `New Chat`, `Rename Chat`, `Delete Chat`, and the assistant quick actions.
- Fixed two assistant chat regressions: new chats now stay open in the detail view before the first message, and existing Codex chats are resumed before Mohio starts a new turn on them.
- Updated the chat presentation so back and new-chat controls use simple unframed icons, assistant replies render full-width without bubble chrome, and in-progress placeholder text uses a muted animated state.
- Updated the `...` menu trigger to use the same unframed text-icon style as the other assistant header controls.
- Kept assistant quick-action chips in sentence case as an intentional exception to the Title Case button rule.
- Updated the empty-workspace CTA wording during assistant polish, removed the extra new-chat helper paragraph, switched the list-view action to a square-pen icon, and updated the chat back icon to a true left-arrow.
- Replaced the remaining hand-drawn app-shell icons with `lucide-react` so the assistant panel and shell use the same icon system as the editor toolbar.
- Simplified the assistant session list into a plain text title list without card borders, backgrounds, or preview text.
- Swapped the assistant `New Chat` control to `message-square-plus` and added a matching link-style `New Note` square-pen control to the workspace sidebar header.
- Refined streaming transcript behavior so `Thinking...` stays as a separate last-line status during quiet gaps in an active Codex run, disappears while fresh text is printing, and never replaces already rendered assistant content.
- Moved the assistant footer to the bottom of the right sidebar in both list and thread views, and changed list-view quick actions/composer sends to auto-create a new chat before dispatching the first prompt.
- Fixed a fresh-thread Codex error by retrying `turn/start` after `thread/resume` when Codex reports that no rollout exists yet for the new chat.
- Hardened fresh-thread startup by allowing multiple bounded `turn/start` retries after `thread/resume` when Codex still reports no rollout, reducing first-message failures on new chats.
- Reused Codex's existing config, auth state, and on-disk session history instead of maintaining a Mohio-owned assistant history store.
- Kept every Codex run scoped to the active workspace root while still sending the current note title, note body, workspace path, workspace name, and note path as the primary prompt context.
- Removed Mohio-specific note-thread migration logic because Codex now owns session identity and history.
- Added main-process and renderer coverage for Codex thread listing, streamed updates, app-server startup, and assistant UI behavior.
- Updated feature, architecture, design, and manual documentation to reflect the live assistant workflow.

## Decision

Shipped the first assistant integration as chat-only, read-only workspace assistance on top of Codex's native session ecosystem instead of inventing a Mohio-owned history layer. This keeps Mohio aligned with the user's existing Codex setup while still making the assistant useful inside the existing workspace flow.

## Impact

Mohio now includes a real embedded Codex assistant in the desktop shell. Users can browse existing Codex chats for the current workspace, run multiple chats in parallel, and keep using note-first prompts without leaving the app, while the product still avoids silent assistant-driven file mutations.
