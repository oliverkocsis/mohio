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
