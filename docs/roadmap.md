# Mohio Roadmap

This roadmap is user-facing. It outlines Mohio's current direction and planned phases. It is a planning document, not a fixed delivery contract.

## Current Focus

Mohio is currently focused on validating the core workflow for a lightweight team knowledge workspace:

- capture ideas quickly
- turn rough documents into structured knowledge
- review important changes clearly
- keep shared documentation easy to publish and track

## Phase 1: Core Workspace

The first milestone is a usable foundation for a bring-your-own-AI, Markdown-based team wiki that works with Codex and Claude Code.

Planned focus areas:

- personal scratchpad for quick document capture
- Markdown-based wiki pages for shared knowledge
- AI proposals from connected tools that suggest new pages, edits, and links
- reviewable diffs before shared content changes
- snapshots and visible history for page-level changes
- explicit publish flow for shared updates

### Navigation and Discovery

- Switch between documents quickly from the workspace browser.
- Search by file name.
- Search by document content.
- Recognize internal Markdown links between documents.
- Open linked documents directly from the editor.

### Publish

- Auto-sync, always. No publish button. Changes propagate on save. If you need to solve the "draft vs. shared" problem, call it exactly that — a Draft toggle — not a publish/unpublished system.
- Conflicts become a notification, not a workflow. "Someone else edited this while you were writing. Here's their version — yours is safe." One button: "Merge for me." The technical person handles edge cases.
- History in human language. "You edited this 2 hours ago. Maria edited it yesterday." No commit messages unless explicitly expanded.
- Zero Git vocabulary anywhere in the UI. Not even in error messages. If a push fails, the user sees "We couldn't sync your changes — try again or contact [technical person]." Done.


Keep:
Git-backed Markdown storage
auto-save
safety commits
explicit share/publish boundary if that’s core to the model
guided conflict recovery
local-first robustness
per-document history under the hood
Hide or radically reframe
checkpoint / auto-save terminology
commit history as primary history
local vs remote framing
unpublished terminology
sync language
ahead/behind semantics
merge-oriented conflict vocabulary
What I’d make the product feel like

If you’re serious about simplicity, the experience should feel like this:

I open a document
I type
it is saved automatically
I see whether my draft is just mine or already shared
when ready, I click Share
if someone else changed it, Mohio explains that plainly
I can view older versions and restore one
I never think about Git

### Git v2
- Create a git repository in the background for each workspace to track changes and support collaboration (users should not need to interact with Git directly).
- When the user clicks on the Publish and there is not remote git repo, then prompt the user to connect a remote git repository (GitHub, GitLab, Bitbucket, or custom).
- The user can decide to login with their github ceredentials and select a repository to connect to, or they can choose to create a new private repository for the workspace.
- The user can open a remote git repository directly from the start screen and choose to connect it to the workspace.

## Phase: Private and Shared Documents

- Clarify the split between private documents and shared documents.
- Private documents support quick capture and early drafting.
- Shared documents capture structured knowledge for team use.
- Private documents remain user-only until shared.
- Shared documents are visible to workspace collaborators.
- Private documents are listed by recency in a flat list.
- Shared documents stay organized in a folder hierarchy.
- Users can promote private documents into shared documents when ready.
- The left panel should expose clear navigation between private documents and shared documents.
- Sorting options should include modified time, created time, and name where appropriate.
- New private documents should keep predictable timestamp-based naming for fast recall.

## Phase: Canvas

Text based canvas for freeform document-taking, brainstorming, and visual organization.
- support for basic shapes, connectors, and text boxes
- fixed grid layout with drag-and-drop positioning
- fixed sized elements and spacing for simplicity


## Phase: Real Time Collaboration

Real Time collaboration and change awareness features to support team workflows.
- real-time collaborative editing with presence indicators
- inline comments and discussions
- change notifications and activity feed
- version history and rollback
- user mentions and notifications
- shared editing sessions and live cursors

## Phase: Internal Tools From Documented Knowledge

Once the core workspace and collaboration workflows are stable, Mohio should grow beyond ad-hoc AI code generation into a dependable internal-tool builder for small teams.

Planned focus areas:

- turn documented procedures and requirements into structured internal tool proposals
- ground generated software changes in existing workspace documentation, not only prompts
- help users define workflows, data shapes, UI requirements, and acceptance criteria from business context
- produce reviewable implementation plans and code changes with clear traceability back to source documents
- support minimal IT teams with safer iteration, validation, and handoff workflows
- make internal tools easy to version, review, and distribute through Mohio and the existing Git ecosystem

## Phase: Mobile and Workflow Expansion

After the desktop-first experience is solid, Mohio can expand the companion workflows that matter most away from the main workspace.

Planned focus areas:

- mobile capture for new documents and ideas
- mobile reading for team documentation
- lightweight proposal review on smaller screens
- faster discovery of workspace knowledge

## Phase: Shared Storage and Workspace Connectivity

Once the core local-first workflows are mature, Mohio can expand to support shared storage providers for teams that already organize documents in external file platforms.

Planned focus areas:

- Google Drive workspace support
- OneDrive workspace support
- clear handling of shared-folder document structure
- reliable sync-aware file change detection
- clear product language for connected versus purely local workspaces
- safe handling of publishing, checkpoints, and review flows across shared storage backends

## Ongoing Exploration

- When should a document update an existing page versus create a new one?
- How much AI explanation is needed for users to trust a proposal?
- What is the right balance between local navigation and global orientation?
- Which collaboration signals matter most early: comments, mentions, or change notifications?

## Out of Scope for the Initial Release

- real-time collaborative editing
- database-style workspace features
- heavy rich media workflows
- enterprise-grade permissions and compliance
- fully automatic AI publishing
- graph view as the primary interface
