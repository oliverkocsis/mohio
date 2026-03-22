# Mohio Roadmap

This roadmap is user-facing. It outlines Mohio's current direction and planned phases. It is a planning document, not a fixed delivery contract.

## Current Focus

Mohio is currently focused on validating the core workflow for a lightweight team knowledge workspace:

- capture ideas quickly
- turn rough notes into structured knowledge
- review important changes clearly
- keep shared documentation easy to publish and track

## Phase 1: Core Workspace

The first milestone is a usable foundation for a bring-your-own-AI, Markdown-based team wiki that works with Codex and Claude Code.

Planned focus areas:

- personal scratchpad for quick note capture
- Markdown-based wiki pages for shared knowledge
- AI proposals from connected tools that suggest new pages, edits, and links
- reviewable diffs before shared content changes
- snapshots and visible history for page-level changes
- explicit publish flow for shared updates
- contextual navigation between related pages

### 1. Workspace Management

- Open a local folder as a Mohio workspace.
- Treat Markdown files in that folder as workspace documents.
- Show the current workspace name and context clearly.
- Keep the default experience local-first without requiring a hosted backend.

### 2. Editing Experience

- Default to a polished document editing experience for non-technical users.
- Use `Quill` as the WYSIWYG editor for standard writing workflows.
- Show a clear document title field as part of the editing surface.
- Provide a lightweight formatting toolbar for common writing actions.
- Preserve Markdown as the durable source format.
- Support default Markdown formatting options including paragraphs, headings, ordered and unordered lists, task lists, block quotes, links, images, bold, italic, strikethrough, inline code, code blocks, tables, and horizontal rules.
- Save edits continuously without a manual save workflow.
- Keep the document editor as the visual center of the product.

### 3. AI Assistance

- Provide an embedded AI panel inside the workspace for connected assistants such as Codex and Claude Code.
- Let connected assistants summarize, rewrite, organizeUse, expand, and update the current note.
- Allow the assistant to propose creating new notes when useful.
- Surface suggested assistant actions where they help the current document workflow.
- Keep assistant actions explicit and reviewable.
- Show what the assistant changed instead of hiding modifications.
- Aim for natural product-language interactions even when the connected assistant is Codex or Claude Code.

### 5. Note and Document Management

- Create a new note from inside the app.
- Open a newly created note immediately.
- Rename notes from inside the app.
- Delete notes from inside the app.
- Show a browsable list or tree of workspace documents.
- Support recent or pinned notes for fast return paths.
- Keep the active note clearly highlighted in the workspace browser.

### 4. Navigation and Discovery

- Switch between notes quickly from the workspace browser.
- Search by file name.
- Search by note content.
- Recognize internal Markdown links between documents.
- Open linked notes directly from the editor.
- Support contextual navigation between related pages over time.

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


## Phase 2: Collaboration and Change Awareness

Once the core workflow is stable, the next priority is improving team coordination.

Planned focus areas:

- page comments and lightweight review flows
- mentions and basic notifications
- better visibility into recent changes on relevant pages
- guided conflict resolution in product language
- clearer signals for draft, published, and incoming changes

## Phase 3: Internal Tools From Documented Knowledge

Once the core workspace and collaboration workflows are stable, Mohio should grow beyond ad-hoc AI code generation into a dependable internal-tool builder for small teams.

Planned focus areas:

- turn documented procedures and requirements into structured internal tool proposals
- ground generated software changes in existing workspace documentation, not only prompts
- help users define workflows, data shapes, UI requirements, and acceptance criteria from business context
- produce reviewable implementation plans and code changes with clear traceability back to source documents
- support minimal IT teams with safer iteration, validation, and handoff workflows
- make internal tools easy to version, review, and distribute through Mohio and the existing Git ecosystem

## Phase 4: Mobile and Workflow Expansion

After the desktop-first experience is solid, Mohio can expand the companion workflows that matter most away from the main workspace.

Planned focus areas:

- mobile capture for new notes and ideas
- mobile reading for team documentation
- lightweight proposal review on smaller screens
- faster discovery of related knowledge and backlinks

## Phase 5: Shared Storage and Workspace Connectivity

Once the core local-first workflows are mature, Mohio can expand to support shared storage providers for teams that already organize documents in external file platforms.

Planned focus areas:

- Google Drive workspace support
- OneDrive workspace support
- clear handling of shared-folder document structure
- reliable sync-aware file change detection
- clear product language for connected versus purely local workspaces
- safe handling of publishing, checkpoints, and review flows across shared storage backends

## Ongoing Exploration

- When should a note update an existing page versus create a new one?
- How much AI explanation is needed for users to trust a proposal?
- What is the right balance between local navigation and global orientation?
- How should related-page suggestions be ranked and displayed?
- Which collaboration signals matter most early: comments, mentions, or change notifications?

## Out of Scope for the Initial Release

- real-time collaborative editing
- database-style workspace features
- heavy rich media workflows
- enterprise-grade permissions and compliance
- fully automatic AI publishing
- graph view as the primary interface
