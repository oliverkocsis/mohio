---
name: finish-feature
description: Finalize a Mohio feature branch for review and merge. Use when a feature is nearly complete, needs final cleanup, documentation updates, test and lint verification, PR preparation, code review follow-up, merge readiness checks, merge cleanup, or when the user asks for a reusable Codex task or command to finish feature development and sync `main` afterward.
---

# Finish Feature

Use this skill to finish a Mohio feature branch cleanly and safely.

Read [.codex/skills/software-engineer/SKILL.md](.codex/skills/software-engineer/SKILL.md) first and follow its repository-level Mohio workflow expectations before running this finalization workflow.

## Workflow

1. Ask clarifying questions before changing code or running Git commands.
2. Call `update_plan` after the answers so the session starts with a short visible plan.
3. Confirm the current feature branch, the target branch, and the current stage:
   - pre-PR
   - in review
   - after review, before merge
   - already merged, only cleanup remaining
4. Check the worktree and branch state with `git status --short --branch`.
5. Stop and ask the user how to proceed if the worktree contains unrelated or risky changes.
6. Perform local cleanup and final polishing.
7. Prepare or refine the PR or MR.
8. Review peer feedback, ask clarification questions about ambiguous review comments, and separate required changes from optional suggestions.
9. Implement review fixes, update documentation if needed, and repeat local cleanup and final polishing.
10. Merge only after approvals, green checks, and documentation are complete.
11. Clean up the merged branch only when it is safe to do so.
12. Switch to `main`, fetch, and pull the latest version after merge cleanup.

## Clarifications

Ask at least these questions every time:

- What branch should be finalized right now?
- What is the target branch for merge, usually `main`?
- Has a PR or MR already been opened?
- Has peer review already happened, and if so, what feedback is still unresolved?
- Which commands should be treated as the source of truth for tests, linting, formatting, build, or other verification in this repo?
- Has the feature already been merged, or should this skill prepare for merge but stop before it?

If the user explicitly asks to "switch to Plan mode", explain briefly that a repo skill cannot change Codex collaboration mode. Still emulate the behavior by asking clarifying questions first and then calling `update_plan`.

## Local Cleanup and Final Polishing

Always include these checks before review or merge:

- update the relevant docs listed in `README.md`
- consolidate the final changelog into `docs/changelog/feature-yyyymmdd-descriptive-feature-name.md` when the feature is ready for merge
- review the diff and remove dead code, debug code, stray logs, and temporary comments
- run the relevant test suite
- run linting and formatting if the project defines them
- run any relevant build or packaging checks when the feature affects shipped surfaces
- rebase onto or merge the latest `main` into the feature branch and resolve conflicts early
- rerun verification after conflict resolution

Also check these items before merge:

- make sure the implementation, docs, and PR description agree on the final behavior
- make sure manual testing notes or screenshots exist when the change affects UI or workflows
- make sure CI or equivalent checks are green if the repo uses them
- make sure no known blocker, failing test, or unresolved TODO is being silently carried into merge

## Pull Request or Merge Request

When the PR or MR does not exist yet:

- prepare a concise summary of the feature
- list the verification performed
- list the documentation updated
- list any follow-up work or known limitations

When the PR or MR already exists:

- review whether the description still matches the final implementation
- update the summary, testing notes, and docs list if they are stale

If the environment does not allow remote Git hosting operations, prepare the PR content and stop at the point where the user must open or merge it manually.

## Peer Code Review

Treat review as a real gate, not a formality.

- collect all review comments and group them into bugs, regressions, documentation gaps, style requests, and open questions
- ask clarification questions when a reviewer comment is ambiguous, conflicts with another comment, or appears to misunderstand the implementation
- do not merge while required review feedback is still unresolved

## Review Fix Loop

After review feedback:

1. implement the required fixes
2. update docs and changelog if behavior or decisions changed
3. rerun the relevant tests, linting, formatting, and build checks
4. recheck the final diff for accidental regressions
5. update the PR description or review response if needed

Repeat this loop until the branch is actually ready.

## Merge and Cleanup

Once all green lights are present:

- merge into the target branch using the repo or platform convention
- delete the temporary feature branch only after the merge is confirmed
- note whether deployment happens immediately or waits for a later release

After merge cleanup:

- switch to `main`
- fetch `origin/main`
- pull the latest `origin/main`

Use non-interactive Git commands throughout. Never discard local changes, force-push, or delete branches without explicit user direction when the action could be risky.
