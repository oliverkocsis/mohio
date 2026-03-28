# feature-20260328-git-backed-collaboration-workflow

Date: 2026-03-28

## Context

Mohio needed a recovery-first collaboration flow that keeps Git under the hood while making history, publish readiness, and incoming changes understandable in product language. The app previously had autosave and document watching, but no visible checkpoint timeline, no explicit publish workflow, and no guided overlap resolution for incoming shared edits.

## Change

- Added a new main-process collaboration module at `desktop/src/main/git-collaboration.ts` to handle:
  - hidden checkpoint refs and checkpoint metadata storage
  - publish-state calculation and explicit publish commits/pushes
  - incoming sync checks, auto-merge for non-overlapping updates, overlap detection, and per-file resolution
- Extended the shared Mohio API and IPC surface with additive methods for checkpointing, publish summary/actions, sync state/actions, and conflict resolution.
- Wired preload and renderer usage for the new collaboration API.
- Updated renderer shell behavior:
  - top bar now includes `Sync` and `Publish` controls
  - left sidebar now includes `Documents | Unpublished` tabs
  - right sidebar now includes `Assistant | History` tabs
  - history timeline supports checkpoint comparison and restore
  - overlap resolution flow supports keep-local, keep-incoming, and manual-combine options
- Added automatic sync triggers on workspace open, one-minute intervals, and document open.
- Added checkpoint triggers for idle editing bursts, document switching after local edits, pre-delete, pre-rename/move, pre-publish, pre/post sync, and pre-restore safety checkpoints.
- Added coverage with `desktop/src/main/git-collaboration.test.ts` and updated API/renderer test scaffolding for new methods and UI surfaces.

## Decision

Use native Git operations in the main process as the source of truth for checkpoints, publish semantics, and incoming sync instead of introducing a separate Mohio snapshot storage model. This keeps recovery and collaboration aligned with real repository state while preserving a non-technical user workflow in the UI.
