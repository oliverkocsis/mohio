# Review, History, Publish, and Sync

This document describes Mohio's current Git-backed snapshot history, manual publish sync, and incoming-change sync behavior.

## Scope

- snapshot-based Git history for Markdown documents
- manual top-bar sync action for commit and push
- right-panel `Versions` commit list
- incoming-change fetch/merge with conflict guidance

## Collaboration Service

Main-process collaboration behavior is implemented in `desktop/src/main/git-collaboration.ts`.

The service wraps Git operations for:

- checking Git capability and workspace Git readiness
- bootstrapping plain folders into Git repositories
- writing manual local snapshot commits
- pushing commits to the configured remote only for manual sync
- computing per-document publish state metadata
- fetching and merging incoming updates with conflict detection
- applying per-file conflict decisions

## Snapshot Commits

Mohio writes regular Git commits (no custom checkpoint refs or `.git/mohio` metadata).

Every Mohio-created manual snapshot commit uses one message format:

- `Snapshot: <ISO date-time>`

Legacy custom checkpoint artifacts are cleaned up automatically when the collaboration service initializes.

### Material-Change Guard

Mohio only writes commits when there is real Markdown diff material:

- changed Markdown paths present in `git status --porcelain -z -- *.md *.markdown *.mdx`
- non-empty staged Markdown result after `git add`
- fingerprint differs from the last committed fingerprint

### Snapshot Triggers

Snapshot commits are attempted only when the user explicitly clicks `Sync now`.

Automatic background paths no longer create commits.

## Sync Behavior

### Automatic Sync

Mohio performs periodic incoming-only sync checks in the background.

Automatic background sync only runs fetch/pull/merge behavior for incoming updates.

Automatic background sync never creates commits and never pushes.

### Manual Sync

The top bar includes an explicit `Sync` status action (to the left of the right-panel toggle).

When the sync status action is clicked:

1. Mohio saves the active editor draft
2. Mohio attempts a snapshot commit with `Snapshot: <ISO date-time>`
3. Mohio performs incoming fetch/merge using merge commits (no rebase)
4. If no remote is connected, Mohio returns `requiresRemoteConnect` and opens the remote-URL connect flow
5. If identity is missing, Mohio returns `requiresIdentitySetup` and blocks commit/sync
6. Mohio pushes local commits when an upstream is configured
7. Mohio returns a synced timestamp when push succeeds

Top-bar status states:

- `Remote Changes <count> · Local Changes <count>` with icon + dot state
- `Pulling updates...` with blue dot + cloud-download icon
- `Syncing...` with blue dot + spinning refresh icon
- `Offline (last synced <relative time>)` with gray dot + refresh icon
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
- every minute in background
- before manual `Sync now` commit attempts

### Safe Apply Path

When incoming commits exist and merge cleanly, Mohio merges incoming updates and updates sync state without creating any automatic publish commit.

When local uncommitted changes exist, incoming sync degrades to fetch-only and reports divergence counts. Local files are not touched until explicit manual sync.

### Overlap Path

When incoming and local edits overlap:

- sync state reports local changes and conflict guidance
- history panel shows per-file resolution cards
- options per file:
  - `Keep local`
  - `Keep incoming`
  - `Combine manually`

After all files are resolved, Mohio stages the chosen resolutions. The user then uses `Sync now` to create/push the snapshot commit.

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
