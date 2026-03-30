# feature-20260328-git-backed-collaboration-workflow

Date: 2026-03-30

## Context

Mohio needed a collaboration workflow that keeps Git as the source of truth while presenting non-technical, recovery-friendly behavior in the UI. The branch also needed clearer publish visibility, automatic sync timing, conflict resolution guidance, and a simplified assistant + history panel layout.

## Change

- Replaced custom checkpoint storage with commit-only safety points:
  - risky moments commit with message `checkpoint`
  - regular save moments commit with message `auto-save`
- Removed custom checkpoint refs/metadata workflows from renderer/main API surfaces and kept commit history as the only history mechanism.
- Implemented commit history UI in the right `History` tab showing all commits for the selected document path:
  - commit message
  - localized date/time
  - Git short stats
- Kept `Unpublished` flow in the left sidebar and added remote-vs-local diff view when an unpublished file is selected.
- Updated publish UX to explicit action surfaces:
  - quick publish icon near workspace name
  - full-width publish action at the bottom of the `Unpublished` tab
- Updated new note UX similarly:
  - quick new note icon near workspace name
  - full-width new note action at the bottom of the `Documents` tab
- Added automatic sync and commit triggers:
  - workspace open
  - document open
  - 1-minute interval while workspace is open
  - before assistant message send
  - before commit operations
- Kept merge-safe incoming update handling and guided overlap resolution in `History`.
- Fixed publish runtime issues and commit path handling:
  - resolved `publishedAt` publish handler crash
  - corrected Git path staging/commit behavior for paths with spaces
- Refined right/left panel tab layout and footer composition:
  - full-width aligned tab headers
  - assistant composer with icon-only send control inside a growing textarea
  - restored quick-action prompt pills above the composer
- Updated docs across `docs/features/`, `docs/manual/`, `docs/design.md`, and `docs/architecture.md` to match final behavior.

## Decision

Use regular Git commits as the sole recovery/history checkpoint unit instead of maintaining parallel checkpoint refs/metadata. This keeps collaboration state understandable, reduces hidden storage complexity, and aligns user-visible history with actual repository history.

## Affected Areas

- Main collaboration logic: `desktop/src/main/git-collaboration.ts`
- Main IPC wiring: `desktop/src/main/index.ts`
- Shared API/types: `desktop/src/shared/mohio-api.ts`, `desktop/src/shared/mohio-types.ts`
- Renderer shell/history/assistant UI: `desktop/src/renderer/App.tsx`, `desktop/src/renderer/styles.css`
- Documentation: `docs/features/review-history-publish-and-sync.md`, `docs/features/ai-assistance-panel.md`, `docs/features/document-editing-and-persistence.md`, `docs/manual/desktop-basics.md`, `docs/design.md`, `docs/architecture.md`

## Decision Follow-Up

- Keep publish explicit (no silent auto-publish).
- Keep commit messages fixed (`checkpoint` / `auto-save`) for predictable history scanning.
- Keep conflict resolution in product language and avoid exposing Git internals to end users.
