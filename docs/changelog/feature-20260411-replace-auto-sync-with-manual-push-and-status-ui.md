# 2026-04-11: Manual-Only Publish Sync with Improved Status UI

## Date

2026-04-11

## Context

Mohio's previous snapshot and sync behavior mixed automatic background actions with publish actions, which made it hard to predict when commits and pushes would happen. The top-bar sync signal also did not clearly distinguish synced, local-change, and pull-only states.

## Change

- Enforced manual-only commit and push behavior:
  - automatic commit entry points were removed from app lifecycle and document workflows,
  - non-manual commit helpers now no-op,
  - commit and push are only triggered by explicit `Sync now` action.
- Kept automatic incoming updates, but narrowed them to fetch/pull/merge only:
  - periodic background incoming sync runs every minute,
  - incoming checks also run on workspace/document open,
  - incoming apply no longer auto-commits or auto-pushes.
- Added accurate local-change counting for top-bar status:
  - `changedFileCount` now reflects Markdown file changes from Git status,
  - renderer combines persisted change count with dirty editor state.
- Updated sync status UI for stronger visibility:
  - status dot colors for synced/local changes/syncing/offline,
  - status icons now use CloudCheck, CloudUpload, CloudDownload, and RefreshCw,
  - label styling stays muted by default and becomes prominent when local changes exist.
- Updated snapshot commit subject format to include full timestamp:
  - `Snapshot: <ISO date-time>`.

## Decision

- Separate transport and publish responsibilities:
  - automatic flows can pull incoming work,
  - only explicit user intent can publish local work.
- Prefer clear, glanceable status signaling over neutral indicators so users can quickly see when local changes still need manual sync.
- Keep snapshot naming machine-sortable and audit-friendly with full ISO timestamps.
