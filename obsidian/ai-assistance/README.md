# Mohio AI Assistance — Obsidian Plugin

Bring-your-own-AI assistance panel for Mohio workspaces inside Obsidian.

## Feature Spec

See [docs/features/ai-assistance-panel.md](../../docs/features/ai-assistance-panel.md) for the full feature specification.

## Status

Scaffold only. Implementation not started yet.

## Planned Capabilities

- Right-sidebar AI assistant panel using the active note as document context
- Codex-backed chat (requires the `codex` CLI installed locally)
- Per-vault chat session history stored in Codex's own session store
- Document-aware prompting: passes active note title, path, and Markdown body
- Streaming assistant responses in the sidebar
- Quick-action prompts: *Summarise document*, *Improve document*
- Composer: auto-growing textarea, Enter to send, Shift+Enter for newline

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```

The built `main.js` is output next to `manifest.json`. Copy or symlink this directory into your vault's `.obsidian/plugins/mohio-ai-assistance/` folder to load it during development.
