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

## Browse Documents

- Folders appear before documents.
- Click a folder row to expand or collapse it.
- Click a document row to open it.
- If a document has a visible title, Mohio shows that title in the sidebar.

## Edit a Document

- Select a document from the left sidebar.
- Edit the title at the top of the page.
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
- Use the right sidebar to chat with Codex about the current note.
- You can type your own request or use the quick actions:
  - summarize the note
  - organize the note
  - suggest related notes from the current workspace
- Mohio sends the current note content along with the wider workspace context for that run.
- The conversation stays attached to the selected note while the app is open.
- Use `Cancel` if you want to stop the current assistant response.

## Current Limits

- You cannot create a new note from the UI yet.
- You cannot rename or delete notes from a dedicated sidebar action yet.
- Search is not active yet.
- Assistant history is not saved across app restarts yet.
- The assistant can chat about your workspace, but it cannot apply note edits through Mohio yet.
- There is no rendered preview or split view for Markdown yet.
