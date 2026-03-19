# Mohio Features

`FEATURES.md` is the living product feature inventory for Mohio.

Update this document whenever a user-visible capability is added, removed, renamed, split, merged, or meaningfully re-scoped.

## Purpose

Mohio is a local-first knowledge workspace for small teams. It combines fast note capture, structured shared documentation, and bring-your-own AI-assisted editing that works with Codex and Claude Code while keeping content portable as plain Markdown in a Git-backed workspace.

This document describes the intended product feature set. It is broader than any single prototype and should stay aligned with the product as development continues.

## Core Product Goals

- Make note capture fast and low-friction.
- Help teams turn rough notes into structured knowledge.
- Keep shared documentation readable, reviewable, and easy to publish.
- Let connected AI tools assist with drafting and organization without silently taking control.
- Preserve content ownership through durable Markdown files.

## Feature Areas

### 1. Workspace Management

- Open a local folder as a Mohio workspace.
- Treat Markdown files in that folder as workspace documents.
- Show the current workspace name and context clearly.
- Keep the default experience local-first without requiring a hosted backend.

### 2. Note and Document Management

- Create a new note from inside the app.
- Open a newly created note immediately.
- Rename notes from inside the app.
- Delete notes from inside the app.
- Show a browsable list or tree of workspace documents.
- Support recent or pinned notes for fast return paths.
- Keep the active note clearly highlighted in the workspace browser.

### 3. Editing Experience

- Default to a polished document editing experience for non-technical users.
- Provide a formatted WYSIWYG editing mode for standard writing workflows.
- Show a clear document title field as part of the editing surface.
- Provide a lightweight formatting toolbar for common writing actions.
- Preserve Markdown as the durable source format.
- Provide a source editing mode for advanced Markdown editing.
- Support headings, lists, quotes, links, emphasis, and code blocks.
- Save edits continuously without a manual save workflow.
- Keep the document editor as the visual center of the product.

### 4. Navigation and Discovery

- Switch between notes quickly from the workspace browser.
- Search by file name.
- Search by note content.
- Recognize internal Markdown links between documents.
- Open linked notes directly from the editor.
- Support contextual navigation between related pages over time.

### 5. AI Assistance

- Provide an embedded AI panel inside the workspace for connected assistants such as Codex and Claude Code.
- Let connected assistants summarize, rewrite, organize, expand, and update the current note.
- Allow the assistant to propose creating new notes when useful.
- Surface suggested assistant actions where they help the current document workflow.
- Keep assistant actions explicit and reviewable.
- Show what the assistant changed instead of hiding modifications.
- Aim for natural product-language interactions even when the connected assistant is Codex or Claude Code.

### 6. Review, History, and Checkpoints

- Create checkpoints automatically in the background instead of asking users to manage them manually.
- Create a checkpoint before any AI-generated change is applied.
- Create a checkpoint after a meaningful local editing burst followed by a pause, rather than on a fixed short timer.
- Use a safer heuristic than a simple 60-second idle rule:
  create a checkpoint only when there has been material document change and the user has been idle for around 90 seconds.
- Optionally create checkpoints before other high-risk transitions such as publish or destructive note actions.
- Keep checkpoints primarily as a recovery and safety mechanism rather than a visible workflow step.
- Preserve visible page-level history over time.
- Support reviewable diffs before important shared changes are accepted.

### 7. Publishing and Shared Knowledge

- Separate ongoing editing from deliberate publishing.
- Let users publish the current note when it is ready to share.
- Make published state or last published status visible.
- Keep publishing an explicit action rather than an automatic side effect of editing.

### 8. Collaboration and Change Awareness

These are planned feature areas beyond the earliest core workspace milestone:

- Page comments and lightweight review flows.
- Mentions and basic notifications.
- Better visibility into recent changes on relevant pages.
- Guided conflict resolution in product language.
- Clearer signals for draft, published, and incoming changes.

### 9. Mobile and Companion Workflows

These are planned after the desktop-first core workflow is stable:

- Mobile capture for new notes and ideas.
- Mobile reading for shared team documentation.
- Lightweight proposal review on smaller screens.
- Faster discovery of related knowledge away from the main workspace.

## Interface Priorities

The product should consistently prioritize:

1. Current document content.
2. Workspace browsing and search.
3. Chat and publish actions.

The editor should remain the center of gravity in the interface.

## Core User Flow

Mohio's core workflow should support this sequence cleanly:

1. Open a workspace.
2. Pick a note from the workspace browser.
3. Edit it in the main editor.
4. Search or follow links to related notes.
5. Ask the assistant for help.
6. Review the proposed result.
7. Publish when ready.

## Out of Scope for the Initial Release

- Real-time collaborative editing.
- Database-style workspace features.
- Heavy rich media workflows.
- Enterprise-grade permissions and compliance.
- Fully automatic AI publishing.
- Graph view as the primary interface.

## Maintenance Rules

- Update this file in the same PR as any user-visible feature change.
- Keep feature names aligned with the current UI language.
- Move implementation detail to `docs/ARCHITECTURE.md` instead of expanding this file into an engineering spec.
