---
name: finish-feature
description: Finalize a Mohio feature branch for review and merge. Use when a feature is nearly complete, needs final cleanup, documentation updates, test and lint verification, PR preparation, code review follow-up, merge readiness checks, merge cleanup, or when the user asks for a reusable Codex task or command to finish feature development and sync `main` afterward.
---

# Finish Feature

Use this skill to finish a Mohio feature branch cleanly and safely.

Read [.codex/skills/software-engineer/SKILL.md](.codex/skills/software-engineer/SKILL.md) first and follow its repository-level Mohio workflow expectations before running this finalization workflow.

## Workflow

1. Start with the default assumptions below instead of asking routine questions up front.
2. Detect the current branch with `git branch --show-current` and treat it as the feature branch.
3. Assume the merge target is `main`.
4. Check the worktree and branch state with `git status --short --branch`.
5. Detect whether the default assumptions are false. Ask targeted clarification questions only if they are false or ambiguous.
6. Detect the project verification commands from the repo setup before running checks.
7. Check whether a PR or MR exists for the current branch. If not, create one when tooling and permissions allow; otherwise prepare the PR content and stop at the handoff.
8. Call `update_plan` after the automatic detection work and any needed follow-up questions so the session starts with a short visible plan.
9. Perform local cleanup and final polishing.
10. Run a code review on the final diff before merge, even if no human review has happened yet.
11. Implement code review fixes, update documentation if needed, and repeat local cleanup and final polishing.
12. Merge as part of this skill when approvals, checks, and documentation are complete.
13. Clean up the merged branch only when it is safe to do so.
14. Switch to `main`, fetch, and pull the latest version after merge cleanup.

## Default Assumptions

Assume all of the following unless the repository state proves otherwise:

- the branch to finalize is the current branch
- the merge target is `main`
- the feature has not already been merged yet
- the skill should handle merge completion as part of the workflow
- a PR should exist for the current branch, so check for one and open it if it does not exist
- a code review must happen even if no human reviewer has commented yet
- verification commands should be inferred from the current project setup rather than asked from the user

For the current Mohio desktop app setup, default verification from `desktop/` is:

- `npm test`
- `npm run typecheck`
- `npm run build`

Do not invent lint or format commands. Only run them if matching scripts actually exist in the active project files.

## Targeted Clarifications Only

Do not ask the user the routine questions above unless detection shows the assumptions are false or unclear.

Ask targeted clarification questions only in cases like these:

- the current branch is empty, detached, `main`, or does not look like a feature branch
- the worktree contains unrelated or risky local changes
- the feature appears to be already merged
- multiple subprojects were changed and verification commands are not obvious from the touched files
- PR creation or lookup cannot be completed because remote tooling or permissions are unavailable
- merge strategy or branch cleanup would be risky

If the user explicitly asks to "switch to Plan mode", explain briefly that a repo skill cannot change Codex collaboration mode. Still emulate the behavior by doing the automatic detection first, asking only the needed clarifications, and then calling `update_plan`.

## Local Cleanup and Final Polishing

Always include these checks before review or merge:

- update the relevant docs listed in `README.md`
- consolidate the final changelog into `docs/changelog/feature-yyyymmdd-descriptive-feature-name.md` when the feature is ready for merge
- review the diff and remove dead code, debug code, stray logs, and temporary comments
- run the relevant test suite
- run linting and formatting only if the project actually defines them
- run any relevant build or packaging checks when the feature affects shipped surfaces
- rebase onto or merge the latest `main` into the feature branch and resolve conflicts early
- rerun verification after conflict resolution

Also check these items before merge:

- make sure the implementation, docs, and PR description agree on the final behavior
- make sure manual testing notes or screenshots exist when the change affects UI or workflows
- make sure CI or equivalent checks are green if the repo uses them
- make sure no known blocker, failing test, or unresolved TODO is being silently carried into merge

## Pull Request or Merge Request

Always check whether a PR or MR already exists for the current branch.

When the PR or MR does not exist yet:

- prepare a concise summary of the feature
- list the verification performed
- list the documentation updated
- list any follow-up work or known limitations
- open the PR or MR if the environment supports it

When the PR or MR already exists:

- review whether the description still matches the final implementation
- update the summary, testing notes, and docs list if they are stale

If the environment does not allow remote Git hosting operations, prepare the PR content and stop at the point where the user must open or merge it manually.

## Code Review

Treat code review as a real gate, not a formality.

- always perform a code review on the final diff, even before external reviewer feedback exists
- use a code-review mindset: prioritize bugs, regressions, missing tests, documentation gaps, and merge risks first
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
