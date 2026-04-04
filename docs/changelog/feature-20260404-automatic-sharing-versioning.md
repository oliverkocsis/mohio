# feature-20260404-automatic-sharing-versioning

## Date

- 2026-04-04

## Context

The desktop collaboration flow still exposed technical publish concepts (`Unpublished`, manual publish-first workflow, mixed commit message types) and did not guarantee that workspace syncing happened at key transition points like assistant dispatch, app blur, or app exit.

## Change

- Standardized Mohio-created Git commit messages to one format:
  - `Snapshot: <ISO date>`
- Updated collaboration commit behavior so commits are attempted for key heuristics:
  - idle pulse (~3 minutes after draft changes)
  - document context switch
  - assistant dispatch
  - safety guard points (rename/move save, delete, incoming merge preflight)
  - app focus loss
  - app exit
- Added automatic background syncing after Mohio-created commits by attempting `git push` (or `git push -u origin <branch>` for first upstream setup).
- Kept manual explicit syncing and moved it to the top-right shell controls as a `Sync` status action immediately left of the right-panel toggle.
- Replaced the manual sync CTA with a minimal borderless status-action control (text + icon) that triggers immediate sync when uncommitted changes exist.
- Updated top-bar sync status copy and icon states:
  - `Synced <relative time>` with refresh icon
  - `Syncing...` with spinning refresh icon
  - `Sync paused` with alert icon
  - `Offline (last synced <relative time>)` with muted globe-off icon
- Simplified sidebar UI:
  - removed the left `Unpublished` tab and related filtered-tree workflow
  - renamed right sidebar `History` tab label to `Versions`
- Updated renderer and collaboration tests to assert snapshot-style commit subjects.
- Updated product/design/manual/feature documentation to match the new collaboration and shell behavior.

## Decision

Prefer a non-technical default collaboration model: snapshot often, sync automatically, and keep one manual `Sync` escape hatch for immediate pushes. This reduces user-facing Git complexity while keeping full Git history and remote collaboration integrity under the hood.
