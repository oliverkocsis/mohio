# Review, History, Publish, and Sync

This document describes Mohio's current Git-backed snapshot history, automatic syncing, and incoming-change sync behavior.

## Scope

- snapshot-based Git history for Markdown documents
- automatic background syncing after Mohio-created commits
- manual top-bar sync action for immediate push
- right-panel `Versions` commit list
- incoming-change fetch/merge with conflict guidance

## Collaboration Service

Main-process collaboration behavior is implemented in `desktop/src/main/git-collaboration.ts`.

The service wraps Git operations for:

- checking Git capability and workspace Git readiness
- bootstrapping plain folders into Git repositories
- writing automatic local snapshot commits
- pushing commits to the configured remote
- computing per-document publish state metadata
- fetching and merging incoming updates with conflict detection
- applying per-file conflict decisions

## Snapshot Commits

Mohio writes regular Git commits (no custom checkpoint refs or `.git/mohio` metadata).

Every Mohio-created commit uses one message format:

- `Snapshot: <ISO date>`

Legacy custom checkpoint artifacts are cleaned up automatically when the collaboration service initializes.

### Material-Change Guard

Mohio only writes commits when there is real Markdown diff material:

- changed Markdown paths present in `git status --porcelain -z -- *.md *.markdown *.mdx`
- non-empty staged Markdown result after `git add`
- fingerprint differs from the last committed fingerprint

### Snapshot Triggers

Snapshot commits are attempted at these moments:

- `Idle Pulse`: after ~3 minutes of editor inactivity following draft changes
- `Context Switch`: before switching to another document
- `Assistant Dispatch`: before sending a message to Codex
- `Safety Guard`: before delete, before rename/move save, and before incoming merge apply
- `Focus Loss`: when the app window loses focus
- `Application Exit`: before quit

## Sync Behavior

### Automatic Sync

When Mohio writes a snapshot commit, it immediately attempts a background push:

- `git push` when an upstream is configured and local branch is ahead
- `git push -u origin <branch>` when upstream is not configured yet

If syncing fails, the local commit is still kept.

### Manual Sync

The top bar includes an explicit `Sync` status action (to the left of the right-panel toggle).

When the sync status action is clicked:

1. Mohio attempts a forced snapshot commit
2. If no remote is connected, Mohio returns `requiresRemoteConnect` and opens the remote-URL connect flow
3. If identity is missing, Mohio returns `requiresIdentitySetup` and blocks commit/sync
4. Mohio pushes local commits if there is anything ahead
5. Mohio returns a synced timestamp when a push succeeds

Top-bar status states:

- `Synced <relative time>` with refresh icon
- `Syncing...` with spinning refresh icon
- `Sync paused` with alert icon
- `Offline (last synced <relative time>)` with muted globe-off icon
- `Install Git` when Git is unavailable
- `Set Git identity` when local identity is missing

### Sync Preconditions

- Git must be available on the system.
- The workspace must be a Git repository (Mohio auto-initializes when possible).
- Repository-local `user.name` and `user.email` must be configured.
- Remote sync requires an `origin` remote connection.

## Incoming Changes and Conflict Workflow

### Sync Triggers

Incoming sync checks run:

- when a workspace opens
- when a document opens
- before automatic local commit attempts (unless explicitly skipped for merge preflight)

### Safe Apply Path

When incoming commits exist and merge cleanly:

- pre-merge snapshot commit attempt
- merge incoming updates (`--no-ff --no-commit`)
- finalize with a snapshot merge commit
- return sync state to `idle`

### Overlap Path

When incoming and local edits overlap:

- sync state moves to `conflict`
- history panel shows per-file resolution cards
- options per file:
  - `Keep local`
  - `Keep incoming`
  - `Combine manually`

After all files are resolved, Mohio finalizes with a snapshot commit and returns sync state to `idle`.

## Versions Panel

Right sidebar tabs:

- `Assistant`
- `Versions`

`Versions` panel capabilities for the selected document:

- commit list from `git log -- <path>`
- each row shows:
  - commit message
  - localized date/time
  - commit author
  - files changed count

## API Surface

`window.mohio` collaboration methods include:

- `recordRiskyCommit(input)`
- `recordAutoSaveCommit()`
- `listCommitHistory(relativePath | null)`
- `getUnpublishedDiff(relativePath)`
- `getPublishSummary()`
- `getGitCapabilityState()`
- `getWorkspaceGitStatus()`
- `setWorkspaceGitIdentity(input)`
- `syncWorkspaceChanges()`
- `getAutoSyncStatus()`
- `syncIncomingChanges(reason)`
- `getSyncState()`
- `resolveSyncConflict(input)`
- `connectRemoteRepository(input)`
- `chooseCloneDestination()`
- `cloneRemoteRepository(input)`

## Current Limitations

- Version history currently renders commit metadata only (no rich side-by-side diff UI)
- Sync conflict guidance is compact and utilitarian
- Collaboration behavior targets Markdown files only (`.md`, `.markdown`, `.mdx`)
- Remote integration uses standard Git remote URLs (no provider-specific OAuth in-app)

## Code Anchors

- Main process collaboration logic: `desktop/src/main/git-collaboration.ts`
- IPC wiring and app lifecycle triggers: `desktop/src/main/index.ts`
- Shared API/types: `desktop/src/shared/mohio-api.ts`, `desktop/src/shared/mohio-types.ts`
- Renderer UI integration: `desktop/src/renderer/App.tsx`
