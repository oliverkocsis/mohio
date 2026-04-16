# Mohio Git Sync — Obsidian Plugin

Git-backed snapshot history, manual publish sync, and incoming-change conflict guidance for Mohio workspaces inside Obsidian.

## Feature Spec

See [docs/features/review-history-publish-and-sync.md](../../docs/features/review-history-publish-and-sync.md) for the full feature specification.

## Status

Scaffold only. Implementation not started yet.

**Desktop-only plugin** — requires Node.js child_process access for Git execution. Set `isDesktopOnly: true` in `manifest.json`.

## Planned Capabilities

- Git-backed snapshot commits on manual Sync action
  - Commit message format: `Snapshot: <ISO date-time>`
  - Material-change guard: only commits when Markdown diff is non-empty
- Top-ribbon / status-bar **Sync** button with state indicator
  - States: idle, pulling, syncing, offline, error
- Right-panel version history: list of snapshot commits per active document
- Incoming-change fetch and merge with conflict detection
  - Periodic background fetch (read-only, no commits or pushes)
  - Conflict guidance and per-file resolution flow
- Sync preconditions: Git available, vault is a Git repo, identity configured
- Remote connect flow when no `origin` remote is set

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```

The built `main.js` is output next to `manifest.json`. Copy or symlink this directory into your vault's `.obsidian/plugins/mohio-git-sync/` folder to load it during development.
