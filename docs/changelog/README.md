# Mohio Changelog

This folder contains the detailed change history for Mohio.

Every software change must be recorded here in its own Markdown file.

## Filename Format

Use this format:

`YYYYMMDD_description-of-the-change.md`

Examples:

- `20260319_add-changelog-process.md`
- `20260319_switch-desktop-shell-to-electron.md`
- `20260320_add-checkpoint-history-panel.md`

## Required Contents

Each changelog entry should explain:

- why the change was made
- what changed exactly
- which parts of the product or codebase were affected

## Suggested Entry Structure

```md
# Short Change Title

## Date

YYYY-MM-DD

## Why

Explain the reason for the change, including the problem, goal, or decision behind it.

## What Changed

List the exact product, code, architecture, or design changes that were made.

## Impact

Describe any user-facing, design, or engineering consequences.
```

## Rules

- Create the changelog entry in the same PR as the software change.
- Do not batch unrelated changes into one file.
- Prefer specific descriptions over vague summaries.
- If the same area changes multiple times, create multiple entries.
