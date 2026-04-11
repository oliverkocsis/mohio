# 2026-04-11: WYSIWYG Markdown Stability and Manual Sync Hardening

## Date

2026-04-11

## Context

The desktop editor and collaboration flow had two reliability gaps:

- Markdown decoration could become unstable in edge cases (inline syntax visibility, nested lists, Enter/Tab continuation behavior, and code-span styling boundaries).
- Sync behavior needed stricter, more predictable manual publish rules with clearer status visibility, especially around dirty working trees, incoming/outgoing divergence, and merge finalization.

## Change

- Hardened WYSIWYG markdown rendering and interactions:
  - stabilized inline decoration ordering to prevent raw syntax leaks,
  - kept markdown markers visible while selected and hidden otherwise,
  - prevented italic/bold/strikethrough decoration inside inline code and fenced code blocks,
  - improved nested list and blockquote rendering (depth, continuation, and visual grouping),
  - refined Enter/Tab continuation rules for lists and quotes.
- Strengthened sync workflow correctness:
  - manual sync now follows Commit-Pull-Push order,
  - automatic incoming sync runs fetch-only when the working tree is dirty,
  - sync state reports incoming/outgoing counts for clearer operator feedback,
  - merge lifecycle handling now finalizes pending merge commits to avoid lingering `MERGE_HEAD` state.
- Streamlined top-bar sync status wording:
  - status label now emphasizes counts (`Remote Changes` and `Local Changes`) while keeping icon states and dot signaling.

## Affected Areas

- `desktop/src/renderer/markdown-editor.tsx`
- `desktop/src/renderer/styles.css`
- `desktop/src/renderer/App.tsx`
- `desktop/src/main/git-collaboration.ts`
- `desktop/src/main/index.ts`

## Decision

- Keep markdown-as-source while improving readability via safe, context-aware decoration rather than introducing a separate preview mode.
- Keep publish actions explicit (`Sync now`) and deterministic, while preserving automatic incoming awareness.
- Prefer merge commits in manual sync when divergence requires integration, so history reflects collaboration joins instead of rebased rewrites.
