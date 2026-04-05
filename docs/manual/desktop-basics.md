# Desktop Basics

This guide covers the workflows that are currently available in the desktop app.

## Start the App

1. Open a terminal in `desktop/`.
2. Run `npm install` if dependencies are not installed yet.
3. Run `npm run dev`.

## Open a Workspace

You can open a workspace in either of these ways:

- Click the workspace selector in the top bar.
- Use `File > Open Folder...`
- Use the shortcut `CmdOrCtrl+O`

After you choose a folder, Mohio shows its Markdown documents in the left sidebar.

When no workspace is open, the main empty-state button is labeled `Open Folder`.
When a workspace is open, the top-bar quick `New Document` action creates a new document in the currently selected document folder.
If no document is selected yet, `New Document` creates the file at workspace root.

## Browse Documents

- Folders appear before documents.
- Click a folder row to expand or collapse it.
- Click a document row to open it in the editor.
- If a document has a visible title, Mohio shows that title in the sidebar.
- Right-click a document row to open the context menu:
  - `Delete Document`
- Use the left sidebar tabs:
  - `Documents` to browse all documents
  - `Search` to run live workspace search

## Search Documents

- Open the left sidebar `Search` tab.
- Use the full-width search field at the top of that tab to find documents by:
  - file name/path
  - document content
- Results update while you type.
- Matching text in the open document is highlighted in yellow while a search query is active.
- Use the search field's built-in clear control (when available) to clear the query quickly.

## Edit a Document

- Select a document from the left sidebar.
- Edit the title at the top of the page.
  - If the document starts with a linked first H1 (`# ...`) that matches the filename, the title reflects that H1.
  - If the first H1 is missing or mismatched, the title reflects the filename instead.
- Edit the body in the main editor, which displays Markdown as formatted text while still saving Markdown source underneath.
- Use the toolbar for headings, lists, quotes, links, images, code, and other basic formatting.
- Hold `Cmd/Ctrl` and click an internal link in the editor to open that linked document directly.

## Collapse and Reopen Side Panels

- Use the top-left panel icon to collapse/reopen the left workspace panel.
- Use the top-right panel icon to collapse/reopen the right panel.
- The center editor expands automatically when a side panel is collapsed.

## How Saving Works

- Mohio saves your changes automatically after a short pause.
- You do not need to click a save button.
- Changing the title can also rename the file on disk.
- Mohio records local Git safety snapshots in the background with one commit format:
  - `Snapshot: <ISO date>`
- Snapshot commits are triggered before high-risk actions (such as rename, delete, assistant send, app blur/exit) and after an idle pulse.
- Mohio automatically syncs snapshot commits in the background when remote push succeeds.

## Sync Now

- Sync runs automatically in the background after Mohio creates snapshot commits.
- Use the top-bar sync status control (left of the right-panel toggle) when you want to force an immediate push.
- Status labels:
  - `Synced <relative time>`
  - `Syncing...`
  - `Sync paused`
  - `Offline (last synced <relative time>)`

## Versions

- Open the right sidebar `Versions` tab while a document is selected.
- Review the commit list for that document.
- Each version row shows:
  - commit message
  - date/time
  - author
  - files changed count

## If a File Changes Outside Mohio

- Mohio watches the document that is currently open.
- If that file changes on disk, Mohio reloads it when it can do so safely.

## Incoming Changes and Overlaps

- Mohio checks for incoming shared updates:
  - when you open a workspace
  - when you open a document
- If incoming updates are safe, Mohio applies them automatically.
- If local and incoming edits overlap, Mohio shows guided choices in `History`:
  - keep local
  - keep incoming
  - combine manually

## Use the Assistant Panel

- Open a folder and select a document.
- Use the right sidebar `Assistant` tab to browse Codex chats for the current workspace.
- The assistant opens in a chat-list view first.
- Click an existing chat to open it.
- The quick actions and composer stay at the bottom of the sidebar while you browse the chat list.
- If you trigger a quick action or send a message from the list view, Mohio automatically starts a new chat first.
- When a chat is open, use the back button to return to the list.
- Use the `...` menu in an open chat to start another chat, rename the current one, or remove it from the visible workspace list.
- Your own prompts appear as compact bubbles, but Codex replies render as full-width left-aligned responses.
- While Codex is still working, Mohio keeps a muted animated `Thinking...` line at the bottom of the chat during quiet gaps, hides it while fresh text is printing, and leaves streamed text visible once it appears.
- You can type your own request or use the quick actions:
  - summarise document
  - improve document
- The composer is a growing text area (up to 5 lines) with an icon-only send control inside the field.
- Press `Enter` to send, or `Shift+Enter` to insert a new line.
- Mohio sends the current document content along with the wider workspace context for that run.
- The selected document stays the main context for what you send, but the chat history itself comes from Codex and is not tied to one document inside Mohio.

## Current Limits

- You cannot rename documents from a dedicated sidebar action yet.
- Mohio only shows Codex chats whose working folder matches the open workspace.
- The assistant can chat about your workspace, but it cannot apply document edits through Mohio yet.
- There is no rendered preview mode for Markdown yet.
