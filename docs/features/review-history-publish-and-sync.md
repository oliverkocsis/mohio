# Review, History, Publish, and Sync

This document describes Mohio's current Git-backed commit history, publish-state visibility, and incoming-change sync behavior.

## Scope

- commit-only safety history (`checkpoint` + `auto-save` commits)
- publish-state tracking and explicit publish action
- right-panel history commit list and unpublished remote-vs-local diff
- automatic incoming-change sync checks and guided conflict resolution

## Collaboration Service

Main-process collaboration behavior is implemented in `desktop/src/main/git-collaboration.ts`.

The service wraps Git operations for:

- writing automatic local commits for safety/history
- computing publish states per document
- publishing Markdown updates with explicit push semantics
- fetching and merging incoming updates with conflict detection
- applying per-file conflict decisions

## Commit-Only Safety Points

Mohio does not store custom checkpoint refs or `.git/mohio` metadata anymore.

History and safety points are regular Git commits with default messages:

- risky transitions: `checkpoint`
- regular saves: `auto-save`

Legacy custom checkpoint artifacts are cleaned up automatically when the collaboration service initializes.

### Material-Change Guard

Mohio only writes commits when there is real Markdown diff material:

- changed Markdown paths present in `git status --porcelain -z -- *.md *.markdown *.mdx`
- non-empty staged Markdown result after `git add`
- fingerprint differs from the last committed fingerprint
- risky commits additionally apply a minimum line-delta threshold when not forced

### Commit Triggers

Risky `checkpoint` commit triggers include:

- before publish
- before rename/move save
- before delete
- after an idle editing burst (~60s)
- on document switch after a recent material edit burst
- before incoming merge application
- when finishing safe incoming merge commits or conflict resolution commits

Non-risk `auto-save` commit triggers include:

- after successful regular document save (non-rename path)
- when a document is opened
- every 60 seconds while the workspace is open
- before assistant message dispatch

## Publish Visibility and Explicit Publish

### Publish Status Model

Each document can be:

- `published`
- `unpublished-changes`
- `never-published`

Mohio also returns `lastPublishedAt` when upstream history for the document exists.

### UI Surface

- left sidebar tabs:
  - `Documents`
  - `Search`
  - `Unpublished` (same hierarchy/sorting, filtered to non-published docs)
- top bar quick note icon control (`New Note`)
- left sidebar bottom action:
  - `Publish` in `Unpublished`

### Publish Flow

When `Publish` is clicked:

1. attempt a forced risky `checkpoint` commit
2. verify there are local commits ahead of upstream
3. push local commits (`git push` or first-time upstream setup)
4. refresh publish summary and history views

Editing and autosave never publish implicitly.

## Incoming Changes and Conflict Workflow

### Automatic Sync Triggers

Sync checks run:

- when a workspace opens
- every 60 seconds while the workspace stays open
- when a document is opened
- before every automatic local commit attempt

### Safe Apply Path

When incoming commits exist and merge cleanly:

- pre-merge `checkpoint` commit attempt
- merge incoming updates (`--no-ff --no-commit`)
- finalize with a `checkpoint` merge commit
- update sync state to idle with success message

### Overlap Path

When incoming and local edits overlap:

- sync state moves to `conflict`
- history panel shows per-file resolution cards
- options per file:
  - `Keep local`
  - `Keep incoming`
  - `Combine manually`

After all files are resolved, Mohio finalizes with a `checkpoint` commit and returns sync state to `idle`.

## History Panel

Right sidebar tabs:

- `Assistant`
- `History`

History panel capabilities for the selected document:

- remote-vs-local diff output for files selected from the `Unpublished` view
- commit list from `git log -- <path>`
- each row shows:
  - commit message
  - localized date/time
  - Git short stats (`--shortstat`)

Checkpoint compare/restore UI is intentionally removed; commits are the only history unit.

## API Surface

`window.mohio` collaboration methods include:

- `recordRiskyCommit(input)`
- `recordAutoSaveCommit()`
- `listCommitHistory(relativePath | null)`
- `getUnpublishedDiff(relativePath)`
- `getPublishSummary()`
- `publishWorkspaceChanges()`
- `syncIncomingChanges(reason)`
- `getSyncState()`
- `resolveSyncConflict(input)`

## Current Limitations

- History currently renders commit metadata and patch text, not a visual side-by-side diff UI.
- Sync conflict guidance uses clear product copy but remains compact and utilitarian.
- Publish currently tracks Markdown files only (`.md`, `.markdown`, `.mdx`).

## Code Anchors

- Main process collaboration logic: `desktop/src/main/git-collaboration.ts`
- IPC wiring: `desktop/src/main/index.ts`
- Shared API/types: `desktop/src/shared/mohio-api.ts`, `desktop/src/shared/mohio-types.ts`
- Renderer UI integration: `desktop/src/renderer/App.tsx`
