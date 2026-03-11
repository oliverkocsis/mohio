# Mohio v5 Layout

This document recommends the default desktop layout for `v5` based on the feature set in [FEATURE_DESCRIPTION.md](/Users/oliverkocsis/Workspace/mohio/v5/FEATURE_DESCRIPTION.md).

The layout should prioritize writing first. File navigation, checkpoints, publish, and agent chat need to be available without turning the app into a crowded IDE. The center of gravity should remain the document.

## Layout recommendation

Use a three-panel desktop layout:

1. Left sidebar for workspace navigation
2. Center editor for the active Markdown file
3. Right sidebar for agent chat and document actions

This is the best fit for `v5` because it keeps the writing surface central while still making agent chat a first-class feature.

## Default desktop structure

### 1. Top bar

The top bar should be slim and stable across the app.

Recommended contents:

- workspace name
- file title
- search entry point
- `New note`
- `Create checkpoint`
- `Publish`

Why this works:

- `Create checkpoint` and `Publish` are document-level actions, so they should sit in the top bar near the file title
- they stay visible without competing with the editor body
- users can understand them as high-trust actions, separate from normal typing

## 2. Left sidebar: workspace navigation

The left sidebar should handle browsing and switching files.

Recommended sections:

- search input
- `New note` button
- file list
- recent files or pinned files

Behavior:

- selecting a file opens it in the center editor
- current file is clearly highlighted
- rename and delete actions live on each file row or in a small file menu

Why this works:

- navigation stays predictable
- search and note creation are close to the file list
- non-technical users can understand the workspace as a simple list of notes

## 3. Center panel: styled Markdown editor

The center panel should be the largest area in the interface.

Recommended contents:

- document title field at the top of the page
- styled source Markdown editor below
- optional inline formatting toolbar only if it is lightweight

Behavior:

- every edit persists automatically
- the editor shows Markdown syntax, but with strong typographic styling
- local links are recognizable and can be opened directly

Why this works:

- the editor remains the main experience
- it matches the product goal of a local Markdown workspace
- it supports the Obsidian-like styled-source model described in the feature list

## 4. Right sidebar: agent and file context

The right sidebar should combine agent chat with document-level context rather than acting as a generic info dump.

Recommended sections:

- agent chat thread
- suggested agent actions
- checkpoint list for the current file
- publish status or last published state

Behavior:

- users can ask the agent to edit the current file or create a new one
- agent-proposed changes should be shown clearly before or after application
- checkpoints are visible in the same area because they are part of the edit-review-publish workflow

Why this works:

- agent chat feels integrated into the writing workflow
- checkpoints and publish state are close to the place where users ask for large changes
- the right side becomes a "work with this document" panel rather than a second navigation column

## Recommended information hierarchy

From highest to lowest priority:

1. Current document content
2. File switching and search
3. Checkpoint and publish actions
4. Agent assistance

This priority matters. If the agent panel dominates the screen, the product will feel like a chat tool with files attached. `v5` should feel like a document workspace with agent assistance.

## Suggested dimensions

For desktop:

- left sidebar: `280px` to `320px`
- center editor: flexible, target `760px` to `960px` readable content width
- right sidebar: `340px` to `420px`
- top bar: `56px` to `64px`

These proportions keep the editor wide enough for comfortable reading and writing while leaving enough space for a useful agent panel.

## Why not other layouts

### Full-width editor with modal chat

This keeps focus high, but it weakens the agent feature. Since agent chat is part of the `v5` core, hiding it behind a modal makes it feel secondary.

### Left navigation plus bottom chat

This works for code editors, but it is weaker for long-form documents. A bottom panel reduces vertical reading space too aggressively.

### Two-panel layout with collapsible utilities

This is simpler, but it creates too much competition in one side panel. Navigation and agent chat serve different mental models and should not share the same space by default.

## Recommended user flow in this layout

1. User opens the workspace
2. User selects a file from the left sidebar
3. User edits in the center panel
4. User optionally asks the agent for help in the right sidebar
5. User creates a checkpoint when reaching a meaningful state
6. User publishes when the update is ready to share

This flow matches the product model cleanly:

- editing is continuous
- checkpoints mark meaningful internal progress
- publish is the explicit shared action

## Mobile and narrow screens

For narrower screens, collapse from three panels to one main editor with drawers.

Recommended behavior:

- left sidebar becomes a slide-over workspace drawer
- right sidebar becomes an agent drawer or tab
- top bar keeps `Create checkpoint` and `Publish`

The editor should always remain the default visible surface.

## Final recommendation

Use this default shell:

- top bar for workspace and high-trust actions
- left sidebar for files and search
- center panel for the styled Markdown editor
- right sidebar for agent chat, checkpoints, and publish context

This is the strongest layout for `v5` because it supports the full feature set without sacrificing the core writing experience.
