---
name: start-feature
description: Start a new Mohio feature branch from the latest main branch. Use when beginning feature development, creating a branch with the required `feature-yyyymmdd-descriptive-feature-name` format, updating `main` before branching, or when the user asks for a reusable Codex task or command to kick off new feature work in this repository.
---

# Start Feature

Use this skill to prepare a clean Mohio feature branch from `main`.

Read [.codex/skills/software-engineer/SKILL.md](.codex/skills/software-engineer/SKILL.md) first and follow its repository-level Mohio workflow expectations before running this feature-branch workflow.

## Workflow

1. Ask clarifying questions before touching Git.
2. Call `update_plan` after the answers so the session starts with a short visible plan.
3. Name the branch using the format `feature-YYYYMMDD-short-description-of-the-feature`.
4. Check whether the worktree is clean with `git status --short`.
5. If the worktree is dirty, stop and ask the user how to proceed. Do not stash, reset, or discard changes on your own.
6. Run `python3 .codex/skills/start-feature/scripts/start_feature.py "<feature description>"` from the repository root.
7. If `git fetch` or `git pull` fails because of sandbox or network restrictions, retry with escalation.
8. Report the created branch name and any next-step reminder that matters.

## Helper Script

Use `python3 .codex/skills/start-feature/scripts/start_feature.py` for the Git operations and branch-name generation.

Arguments:

- Positional argument: feature description in plain language
- Optional `--date YYYYMMDD`: override the date when needed for testing or backfills
- Optional `--base main`: override the base branch if the repository ever changes conventions
- Optional `--dry-run`: print the branch name and intended Git steps without changing the repo

The script:

- slugifies the description
- verifies the worktree is clean
- switches to `main`
- fetches and fast-forwards from `origin/main`
- creates and switches to the new feature branch
- prints the final branch name
