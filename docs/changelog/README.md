# Mohio Changelog

This folder contains the merged feature changelogs for Mohio.

Every feature branch that is merged into `main` must have one final changelog file in this folder.

## Filename Format

Use this format:

`feature-yyyymmdd-descriptive-feature-name.md`

Examples:

- `feature-20260319-add-changelog-process.md`
- `feature-20260319-switch-desktop-shell-to-electron.md`
- `feature-20260320-add-checkpoint-history-panel.md`

## Required Contents

Each final changelog should explain:

- why the feature was developed
- what the final merged version contains
- which parts of the product or codebase were affected

## Suggested Entry Structure

```md
# Short Change Title

## Date

YYYY-MM-DD

## Why

Explain the reason for the feature, including the problem, goal, or decision behind it.

## What Changed

List the exact product, code, architecture, or design changes included in the final merged version.

## Impact

Describe any user-facing, design, or engineering consequences.
```

## Rules

- Development must happen on a feature branch named `feature-yyyymmdd-descriptive-feature-name`.
- A code review is required on the feature branch before it is merged into `main`.
- Before merging into `main`, consolidate all branch changelog notes into one final changelog file with the same name as the branch.
- The final changelog should focus on the merged result and why it was developed, not on the full development history.
- Prefer specific descriptions over vague summaries.
