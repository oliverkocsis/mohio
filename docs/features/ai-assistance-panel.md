# AI Assistance Panel

This document covers the current Codex integration in the right sidebar of `desktop/`.

## Scope

- assistant IPC surface
- main-process Codex app-server client
- renderer chat history, transcript, and composer UI
- document-aware prompting on top of Codex-owned threads

## Current State

- The right sidebar is a live assistant panel instead of layout scaffolding.
- Mohio uses the installed `codex` CLI through `codex app-server`.
- Each chat runs from the active workspace root.
- Codex is limited to read-only workspace access in this integration.
- Mohio reuses Codex's existing auth, config, and on-disk session history.
- Mohio does not keep a separate chat-history database or document-thread store.
- Mohio does not let the assistant apply edits, patches, or document proposals yet.

## API Surface

The renderer uses `window.mohio` for assistant behavior:

- `listAssistantThreads()`
- `createAssistantThread()`
- `getAssistantThread(threadId)`
- `sendAssistantMessage(input)`
- `cancelAssistantRun(threadId)`
- `onAssistantEvent(listener)`

Assistant input payload:

- `threadId`
- `documentRelativePath`
- `content`
- `documentTitle`
- `documentMarkdown`

Assistant thread shape:

- Codex thread identity
- workspace path
- title and preview for history rows
- ordered `user` and `assistant` messages
- run status: `idle`, `running`, or `error`
- optional panel-local error message

## Runtime Behavior

- The main process starts a long-lived `codex app-server` child process and talks to it over JSON-RPC.
- Mohio creates and resumes Codex threads with:
  - `cwd` set to the active workspace root
  - `approvalPolicy: never`
  - `sandbox: read-only`
  - Mohio-specific developer instructions
  - persistent Codex thread history enabled
- Mohio lists Codex threads with the current workspace path as the `cwd` filter.
- Mohio loads full transcript history from Codex through `thread/read`.
- Mohio passes the current document title, document body, document path, workspace name, workspace path, and the user's request into each turn prompt.
- Codex may inspect any file in the active workspace during the run.
- Mohio streams assistant text into the sidebar from Codex app-server notifications.
- Failed runs stay local to the assistant panel and do not affect editor state.

## Renderer Behavior

- The sidebar starts in a session-list view for the current workspace.
- The list view shows a simple workspace-filtered title list of Codex chats and no dedicated `New Chat` button.
- Thread titles in the list view are single-line and truncate with ellipsis on overflow.
- Opening a chat switches the sidebar into a dedicated thread view.
- A newly created chat stays in the dedicated thread view even before Codex includes it in the workspace history list.
- The thread view header includes:
  - a back action to return to the session list
  - the current Codex thread title
  - a menu with `New Chat`, `Rename Chat`, and `Delete Chat`
- The thread-view back control and the `...` menu trigger use simple unframed icon buttons.
- Assistant panel icons use `lucide-react` from [Lucide](https://lucide.dev/icons/), matching the rest of the desktop shell, and Mohio does not use custom hand-authored SVG icon shapes.
- Mohio does not show a separate empty helper paragraph inside a brand new chat before the first message.
- Users can switch between existing Codex chats without changing the selected document.
- The transcript renders only in the active thread view.
- The assistant footer stays pinned at the bottom of the right sidebar in both list and thread views, below the chat list when browsing sessions.
- Quick-action pills render directly above the composer input in the sticky footer area.
- User prompts remain compact, while assistant answers render as full-width left-aligned responses instead of chat bubbles.
- Mohio keeps streamed assistant text visible once it appears and never replaces it with a placeholder.
- While a Codex run is active and no new assistant text has arrived yet, Mohio shows a muted animated `Thinking...` line as the last row in the transcript.
- Mohio hides that `Thinking...` line while fresh assistant text is actively streaming, and shows it again only if the run is still active but the stream goes quiet.
- Quick-action pills render above the composer:
  - `Summarise document`
  - `Improve document`
- The composer is a full-width textarea that auto-grows with typed content, up to five visible lines.
- The send control is an icon-only button inside the right side of the composer.
- For single-line composer height, the send icon is vertically centered.
- Once the composer grows to multiple lines, the send icon stays anchored to the bottom-right.
- Pressing `Enter` sends the prompt; `Shift+Enter` inserts a newline.
- The composer is disabled when no workspace is open, no document is selected, or the active Codex thread is already running.
- Sending from the list view footer always starts a fresh chat automatically before dispatching the prompt.
- If no Codex thread is active in thread view, sending a message starts a new one first.
- If the user opens an existing Codex chat from history, Mohio resumes that thread with Codex before starting the next turn.
- If Codex rejects turn startup on a freshly created thread because no rollout exists yet, Mohio resumes the thread and retries turn startup with bounded backoff before surfacing an error.
- The composer does not render a `Cancel` button.
- `Delete Chat` maps to Codex thread archive behavior and removes the thread from Mohio's visible workspace list.

## Current Limitations

- Only Codex is wired today; Claude Code is not yet integrated.
- Mohio does not offer chat search, archive, or fork UI yet.
- There is no review/apply workflow for assistant-generated document changes.
- There is no assistant tool UI for document creation, publish, or history actions yet.
