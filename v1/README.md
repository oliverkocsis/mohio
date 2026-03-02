# Mohio v1 Demo

This folder contains a standalone browser demo for the app described in the repository root `README.md`.

## Run

Open `index.html` directly, or serve the folder:

```bash
cd v1
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## What the demo shows

- Space + page navigation for Markdown knowledge pages
- Personal drafts branch state (`drafts/<username>`)
- LLM-style diff proposal with explicit approval step
- Publishing draft changes to `main`
- Guided conflict-resolution flow when draft and `main` diverge
- Activity timeline of workspace actions

## Suggested click path

1. Edit a page and click **Save Draft Commit**
2. Enter an assistant instruction and click **Generate Diff**
3. Click **Approve Diff**
4. Click **Publish to main**
5. Click **Simulate conflict** and try publishing again to open merge options
