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

### Notes and Documents

- Seperate notes and documents
- Notes are used to capture quick thoughts, ideas.
- Documents are used to capture structured knowledge that is shared with the team.
- Notes are private to the user and are not shared with the team.
- Documents are shared with the team and are visible to all members of the workspace.
- Notes are order by last modified time and are not organized in a hierarchy.
- Documents are organized in a hierarchy and are shared with the team.
- Notes can be promoted to documents when they are ready to be shared with the team.
- The left panel has 2 tabs: Notes and Documents. The Notes tab shows the user's private notes in a list with a timestamp prefix.
- The notes can be order by modified time or created time. The user can switch between the two sorting options. (A-Z or Z-A)
- The documents tab shows the shared documents in a folder hierarchical structure.
- The documents can be ordered by name or modified time. The user can switch between the two sorting options. (A-Z or Z-A)
- Notes are created with a timestamp prefix in the title to make it easy to find them later in the _notes folder. The format of the timestamp is `yyyymmdd-hhmmss` + the standard document title algorithm (e.g. `20231001-143000 This is the first h1 if the note`).

### Apps

Create internal tools with AI assistance that are grounded in the team's existing knowledge and documentation.
- Create tools that can be opened in the main editor page and have access to the workspace context.
- Text based database is used
- 

### Canvas

Text based canvas for freeform note-taking, brainstorming, and visual organization.
- support for basic shapes, connectors, and text boxes
- fixed grid layout with drag-and-drop positioning
- fixed sized elements and spacing for simplicity

### Navigation and Discovery

- Switch between notes quickly from the workspace browser.
- Search by file name.
- Search by note content.
- Recognize internal Markdown links between documents.
- Open linked notes directly from the editor.
- Support contextual navigation between related pages over time.

### Review, History, and Checkpoints

- Create checkpoints automatically in the background instead of asking users to manage them manually.
- Create a checkpoint before any AI-generated change is applied.
- Create a checkpoint after a meaningful local editing burst followed by a pause, rather than on a fixed short timer.
- Use a safer heuristic than a simple 60-second idle rule:
  create a checkpoint only when there has been material document change and the user has been idle for around 90 seconds.
- Optionally create checkpoints before other high-risk transitions such as publish or destructive note actions.
- Keep checkpoints primarily as a recovery and safety mechanism rather than a visible workflow step.
- Preserve visible page-level history over time.
- Support reviewable diffs before important shared changes are accepted.

### Publishing and Shared Knowledge

- Separate ongoing editing from deliberate publishing.
- Let users publish the current note when it is ready to share.
- Make published state or last published status visible.
- Keep publishing an explicit action rather than an automatic side effect of editing.

### 9. Collaboration and Change Awareness

These are planned feature areas beyond the earliest core workspace milestone:

- Page comments and lightweight review flows.
- Mentions and basic notifications.
- Better visibility into recent changes on relevant pages.
- Guided conflict resolution in product language.
- Clearer signals for draft, published, and incoming changes.

### 10. Mobile and Companion Workflows

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
