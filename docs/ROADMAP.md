# Mohio Roadmap

This roadmap outlines the project's current direction. It is intended as a public planning document for contributors and early adopters, not a fixed delivery contract.

## Current Focus

Mohio is currently focused on validating the core workflow for a lightweight team knowledge workspace:

- capture ideas quickly,
- turn rough notes into structured knowledge,
- review important changes clearly,
- keep shared documentation easy to publish and track.

## Phase 1: Core Workspace

The first milestone is a usable foundation for a bring-your-own-AI, Markdown-based team wiki that works with Codex and Claude Code.

Planned focus areas:

- Personal scratchpad for quick note capture
- Markdown-based wiki pages for shared knowledge
- AI proposals from connected tools that suggest new pages, edits, and links
- Reviewable diffs before shared content changes
- Snapshots and visible history for page-level changes
- Explicit publish flow for shared updates
- Contextual navigation between related pages

## Phase 2: Collaboration and Change Awareness

Once the core workflow is stable, the next priority is improving team coordination.

Planned focus areas:

- Page comments and lightweight review flows
- Mentions and basic notifications
- Better visibility into recent changes on relevant pages
- Guided conflict resolution in product language
- Clearer signals for draft, published, and incoming changes

## Phase 3: Internal Tools from Documented Knowledge

Once the core workspace and collaboration workflows are stable, Mohio should grow beyond ad-hoc AI code generation into a dependable internal-tool builder for small teams. The product should help teams turn documented procedures, requirements, and business cases into reviewable software that can be maintained and distributed through Mohio's Git-based workflow.

Planned focus areas:

- Turn documented procedures and requirements into structured internal tool proposals
- Ground generated software changes in existing workspace documentation, not only prompts
- Help users define workflows, data shapes, UI requirements, and acceptance criteria from business context
- Produce reviewable implementation plans and code changes with clear traceability back to source documents
- Support minimal IT teams with safer iteration, validation, and handoff workflows
- Make internal tools easy to version, review, and distribute through Mohio and the existing Git ecosystem

## Phase 4: Mobile and Workflow Expansion

After the desktop-first experience is solid, Mohio can expand the companion workflows that matter most away from the main workspace.

Planned focus areas:

- Mobile capture for new notes and ideas
- Mobile reading for team documentation
- Lightweight proposal review on smaller screens
- Faster discovery of related knowledge and backlinks

## Phase 5: Shared Storage and Workspace Connectivity

Once the core local-first workflows are mature, Mohio can expand to support shared storage providers for teams that already organize documents in external file platforms.

Planned focus areas:

- Google Drive workspace support
- OneDrive workspace support
- Clear handling of shared-folder document structure
- Reliable sync-aware file change detection
- Clear product language for connected versus purely local workspaces
- Safe handling of publishing, checkpoints, and review flows across shared storage backends

## Areas of Ongoing Exploration

Several product decisions are still open and will be shaped by prototypes and user feedback.

- When should a note update an existing page versus create a new one?
- How much AI explanation is needed for users to trust a proposal?
- What is the right balance between local navigation and global orientation?
- How should related-page suggestions be ranked and displayed?
- Which collaboration signals matter most early: comments, mentions, or change notifications?

## Out of Scope for the Initial Release

The initial release is intentionally narrow. These areas are not current priorities:

- Real-time collaborative editing
- Database-style workspace features
- Heavy rich media workflows
- Enterprise-grade permissions and compliance
- Fully automatic AI publishing
- Graph view as the primary interface

## How to Read This Roadmap

Mohio is being developed in phases rather than fixed calendar dates. The order reflects current priorities, but scope may change as development continues and the project receives feedback from the open source community.
