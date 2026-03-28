# Review, History, Publish, and Sync

This document describes Mohio's current checkpointing, publish-state visibility, and incoming-change sync behavior.

## Scope

- Git-backed automatic checkpoints
- publish-state tracking and explicit publish action
- right-panel history timeline, diff comparison, and checkpoint restore
- automatic incoming-change sync checks and guided conflict resolution

## Collaboration Service

Main-process collaboration behavior is implemented in `desktop/src/main/git-collaboration.ts`.

The service wraps Git operations for:

- creating hidden checkpoints via `git stash create` + `refs/mohio/checkpoints/*`
- storing checkpoint metadata in `.git/mohio/checkpoints.jsonl`
- computing publish states per document
- publishing Markdown updates with explicit commit + push
- fetching/merging incoming updates and detecting overlaps
- applying per-file conflict decisions

## Checkpoints

### Where Checkpoints Are Stored

- Hidden refs: `refs/mohio/checkpoints/<checkpoint-id>`
- Metadata: `.git/mohio/checkpoints.jsonl`

Each checkpoint record includes:

- `id`
- `createdAt`
- `reason`
- `trigger`
- `commit`
- `ref`
- `touchedDocuments`

### Checkpoint Triggers

Mohio currently creates or attempts checkpoints for:

- idle editing bursts (~60 seconds idle after material Markdown edits)
- document switch after recent local edits
- rename/move risk before title-driven path changes
- delete risk before removing a note
- publish flow before staging/committing/pushing
- sync flow before and after incoming updates
- history restore before writing checkpoint content back to disk
- AI apply hook endpoint (`createAiChangeCheckpoint`) for future assistant-apply flows

### Material-Change Heuristic

For non-forced checkpoints, Mohio requires:

- Markdown changes present in `git status --porcelain`
- line delta threshold (`>= 3`) from `git diff --numstat HEAD -- ...`
- changed-state fingerprint different from the latest checkpoint fingerprint

This avoids checkpoint spam on trivial or duplicate states.

## Publish Visibility and Explicit Publish

### Publish Status Model

Each document can be:

- `published`
- `unpublished-changes`
- `never-published`

Mohio also provides `lastPublishedAt` when it can resolve upstream history for the document.

### UI Surface

- top bar `Publish` button with unpublished document badge
- left sidebar tabs:
  - `Documents`
  - `Unpublished` (same hierarchy and sorting, filtered to non-published docs)
- per-selected-document status copy in workspace sidebar

### Publish Flow

When `Publish` is clicked:

1. create a pre-publish checkpoint
2. stage Markdown files (`*.md`, `*.markdown`, `*.mdx`)
3. commit with a publish message when staged Markdown changes exist
4. push to upstream (or `origin <current-branch>` with `-u` when no upstream is set)
5. refresh publish summary and history views

Editing and autosave do not publish automatically.

## Incoming Changes and Conflict Workflow

### Automatic Sync Triggers

Renderer-driven sync checks run:

- when a workspace opens
- every 60 seconds while the workspace stays open
- when a document is opened

### Safe Apply Path

When incoming commits exist and merge cleanly:

- pre-sync checkpoint
- merge incoming updates
- post-sync checkpoint
- UI status update (`Incoming updates were applied successfully.`)

### Overlap Path

When incoming and local edits overlap:

- sync state moves to `conflict`
- history panel shows per-file resolution cards
- options per file:
  - `Keep local`
  - `Keep incoming`
  - `Combine manually` (editable textarea)

After all files are resolved, Mohio finalizes the merge commit and updates state back to `idle`.

## History Panel

Right sidebar tabs:

- `Assistant`
- `History`

History panel capabilities for the selected document:

- commit list from Git history for the selected document
- remote-vs-local diff output for files selected from the `Unpublished` view
- checkpoint timeline with reason, trigger, and timestamp
- compare any two checkpoints and render Git patch output
- restore any checkpoint with a pre-restore safety checkpoint

## API Surface

`window.mohio` now includes collaboration methods:

- `createCheckpoint(input)`
- `createAiChangeCheckpoint(relativePath, reason)`
- `listCheckpoints(relativePath | null)`
- `getCheckpointDiff(input)`
- `revertToCheckpoint(input)`
- `getPublishSummary()`
- `publishWorkspaceChanges()`
- `syncIncomingChanges(reason)`
- `getSyncState()`
- `resolveSyncConflict(input)`

## Current Limitations

- conflict copy and labels are product-friendly but still minimal in guidance depth
- history diff is raw Git patch text (no structured visual split view yet)
- publish currently stages Markdown-only patterns and excludes non-Markdown assets

## Code Anchors

- Main process collaboration logic: `desktop/src/main/git-collaboration.ts`
- IPC wiring: `desktop/src/main/index.ts`
- Shared API/types: `desktop/src/shared/mohio-api.ts`, `desktop/src/shared/mohio-types.ts`
- Renderer UI integration: `desktop/src/renderer/App.tsx`
