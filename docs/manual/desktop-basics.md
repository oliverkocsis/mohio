# Desktop Basics

This guide covers the workflows that are currently available in the desktop app.

## Start the App

1. Open a terminal in `desktop/`.
2. Run `npm install` if dependencies are not installed yet.
3. Run `npm run dev`.

## Open a Workspace

You can open a workspace in either of these ways:

- Click the workspace selector in the top bar.
- Use `File > Open Workspace...`
- Use the shortcut `CmdOrCtrl+O`

After you choose a folder, Mohio shows its Markdown documents in the left sidebar.

When no workspace is open, the main empty-state button is labeled `Open Workspace`.
When a workspace is open, the workspace sidebar `New Note` button creates a new note in the currently selected note folder.
If no note is selected yet, `New Note` creates the file at workspace root.

## Browse Documents

- Folders appear before documents.
- Click a folder row to expand or collapse it.
- Click a document row to open it.
- If a document has a visible title, Mohio shows that title in the sidebar.
- Right-click a document row to open the context menu and choose `Delete Note`.

## Edit a Document

- Select a document from the left sidebar.
- Edit the title at the top of the page.
  - If the note starts with a linked first H1 (`# ...`) that matches the filename, the title reflects that H1.
  - If the first H1 is missing or mismatched, the title reflects the filename instead.
- Edit the body in the main editor, which displays Markdown as formatted text while still saving Markdown source underneath.
- Use the toolbar for headings, lists, quotes, links, images, code, and other basic formatting.

## How Saving Works

- Mohio saves your changes automatically after a short pause.
- You do not need to click a save button.
- Changing the title can also rename the file on disk.

## If a File Changes Outside Mohio

- Mohio watches the document that is currently open.
- If that file changes on disk, Mohio reloads it when it can do so safely.

## Use the Assistant Panel

- Open a workspace and select a note.
- Use the right sidebar to browse Codex chats for the current workspace.
- The assistant opens in a chat-list view first.
- Click an existing chat to open it, or click `New Chat` to start another parallel conversation.
- The quick actions and composer stay at the bottom of the sidebar while you browse the chat list.
- If you trigger a quick action or send a message from the list view, Mohio automatically starts a new chat first.
- When a chat is open, use the back button to return to the list.
- Use the `...` menu in an open chat to start another chat, rename the current one, or remove it from the visible workspace list.
- Your own prompts appear as compact bubbles, but Codex replies render as full-width left-aligned responses.
- While Codex is still working, Mohio keeps a muted animated `Thinking...` line at the bottom of the chat during quiet gaps, hides it while fresh text is printing, and leaves streamed text visible once it appears.
- You can type your own request or use the quick actions:
  - summarize the note
  - organize the note
  - suggest related notes from the current workspace
- Mohio sends the current note content along with the wider workspace context for that run.
- The selected note stays the main context for what you send, but the chat history itself comes from Codex and is not tied to one note inside Mohio.
- Use `Cancel` if you want to stop the current assistant response.

## Current Limits

- You cannot rename notes from a dedicated sidebar action yet.
- Search is not active yet.
- Mohio only shows Codex chats whose working folder matches the open workspace.
- The assistant can chat about your workspace, but it cannot apply note edits through Mohio yet.
- There is no rendered preview or split view for Markdown yet.
