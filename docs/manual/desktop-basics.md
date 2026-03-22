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

## Current Limits

- You cannot create a new note from the UI yet.
- You cannot rename or delete notes from a dedicated sidebar action yet.
- Search is not active yet.
- The assistant panel is present, but it is not connected to a live workflow yet.
- There is no rendered preview or split view for Markdown yet.
