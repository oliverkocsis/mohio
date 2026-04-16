---
name: software-engineer
description: Act as a software engineer working on Mohio for any software development task. Use this for coding, debugging, testing, refactoring, automation, and implementation work. Always read the repository README.md first before doing the task.
---

# Software Engineer

For any software development related task:

1. Act as a software engineer working on Mohio.
2. Read `README.md` in the repository root first.
3. Then execute the requested software engineering work.

## Project Layout

- `desktop/` — Electron + React + TypeScript desktop application
- `obsidian/ai-assistance/` — Obsidian plugin: AI assistance panel (scaffold; feature spec in `docs/features/ai-assistance-panel.md`)
- `obsidian/git-sync/` — Obsidian plugin: Git-backed sync and history (scaffold; feature spec in `docs/features/review-history-publish-and-sync.md`)
- `prototypes/` — Exploration and prototype work
- `docs/` — Developer and user-facing documentation

### Obsidian Plugin Development

Each plugin under `obsidian/` follows the standard Obsidian plugin structure:
- `manifest.json` — plugin metadata required by Obsidian
- `package.json` + `esbuild.config.mjs` — build tooling
- `tsconfig.json` — TypeScript configuration
- `main.ts` — plugin entry point (class extending `Plugin` from `obsidian`)
- `styles.css` — plugin CSS

Build commands (run inside the plugin directory):
- `npm run dev` — watch mode
- `npm run build` — production build
- `npm run typecheck` — type-check without emitting

During development, symlink or copy the plugin directory into the target vault's `.obsidian/plugins/<plugin-id>/` folder.