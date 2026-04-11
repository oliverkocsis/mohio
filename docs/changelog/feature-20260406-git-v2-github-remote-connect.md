# 2026-04-06: Git v2 Remote URL Connect and Workspace Git Bootstrap

## Date

2026-04-06

## Context

Mohio already used Git-backed snapshots and sync, but remote onboarding had become provider-specific and more complex than needed. The desktop app included GitHub OAuth and repository listing/creation flows that were not required for standard Git collaboration.

## Change

- Removed all GitHub-specific connect/auth implementation from the desktop app:
  - deleted GitHub OAuth/connect services,
  - removed GitHub IPC/API methods and renderer flows,
  - removed GitHub-specific tests and configuration paths.
- Removed `keytar` dependency and all token-storage code paths.
- Added a provider-agnostic remote flow based on standard Git URLs:
  - `Open Remote Repository` now asks for a remote Git URL + clone destination,
  - `Sync` without a remote now opens a connect dialog that asks for remote Git URL only.
- Added a distraction-free no-workspace entry point:
  - top bar is hidden,
  - left/right panels are not rendered,
  - centered welcome card with in-place `Welcome` and `Connect to a workspace` states,
  - welcome state uses two link-style CTAs (`Open a folder as workspace`, `Connect to a remote workspace`) with no sublabels,
  - welcome state conditionally shows up to 5 recent workspaces from local app storage, including muted missing-folder entries,
  - connect form includes address + save-location inputs, derived path preview, and validation-gated confirm action.
- Added generic remote IPC/API methods:
  - `connectRemoteRepository(input)`
  - `cloneRemoteRepository(input)`
  - `chooseCloneDestination()`
- Kept existing safety policy for local workspaces:
  - connect/attach is allowed only for empty remotes,
  - non-empty remotes must be opened via clone flow.
- Updated sync/install messaging to reference remote Git, not GitHub.
- Updated docs and tests to reflect provider-agnostic remote behavior.

## Decision

- Standardize on plain Git remote URLs for remote operations instead of provider-specific OAuth.
- Keep local snapshots durable even when remote connect is required.
- Keep repository-local identity (`user.name`, `user.email`) as a required precondition for Mohio-managed commits.
- Preserve empty-remote-only attach policy for non-cloned local workspaces to avoid implicit unrelated-history merges.
