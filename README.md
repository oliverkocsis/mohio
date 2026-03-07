# Mohio (working name)

Mohio is an open-source knowledge workspace for teams. It feels like a simple notes app and wiki, while storing everything as plain Markdown in a Git repository behind the scenes.

The v1 product is not "Git for docs". Git is implementation detail. The user experience must feel like:

- a fast personal scratchpad for capturing ideas,
- an AI-assisted workflow for turning rough notes into structured knowledge,
- a lightweight wiki for shared team documentation,
- a clear publish flow with visible history and simple conflict resolution.

## V1 product thesis

The fastest way to get team knowledge into a useful shape is:

1. let people jot things down without friction,
2. let AI propose where that information belongs,
3. let users review the proposal,
4. let users explicitly publish approved wiki changes.

Mohio v1 starts from capture, not from page trees.

## Who v1 is for

- Small teams (3-20 people), especially startups.
- Teams with one technical champion who can connect the workspace once.
- Teams that want plain-text ownership and history without exposing Git complexity to everyone.
- Teams comfortable using AI to organize and maintain documentation.

## Who v1 is not for

- Teams that need real-time multiplayer editing.
- Teams that need enterprise-grade permissions and compliance on day one.
- Teams that want a polished database-style workspace like Notion.
- Teams that do not want AI involved in the documentation workflow.

## Core principles

- Git is hidden: users never need to think about branches, commits, merges, or pull/push.
- Scratchpad first: the default entry point is private capture, not filing.
- AI proposes, users approve: AI never silently rewrites shared wiki pages.
- Shared knowledge is explicit: wiki changes are published on purpose, not accidentally.
- Markdown is the source: formatting stays simple and portable.
- Connected knowledge beats rigid filing: links, related pages, and context matter more than folder purity.

## V1 information model

Mohio v1 has four core objects:

### 1. Jot

A jot is a quick personal note created in the scratchpad.

- Every jot is its own Markdown document.
- Jots belong to one user by default.
- Jots appear in a simple linear list sorted by creation time.
- Jots do not create conflicts because they are not shared wiki pages yet.

Examples:

- meeting notes
- rough ideas
- follow-ups
- product observations
- half-formed documentation

### 2. Proposal

A proposal is an AI-generated suggestion for how a jot should affect the wiki.

A proposal can:

- create a new wiki page,
- update one existing wiki page,
- update multiple existing wiki pages,
- suggest relevant pages without changing them.

Every proposal must show:

- what the AI thinks the jot is about,
- which pages are likely relevant,
- what new pages it wants to create,
- what exact changes it wants to make,
- a reviewable diff before anything is applied.

### 3. Wiki page

A wiki page is structured team knowledge.

- Wiki pages are Markdown files.
- Wiki pages can be edited directly by users.
- Wiki pages can also be updated through accepted AI proposals.
- Wiki pages are the canonical shared knowledge layer.

### 4. Snapshot

A snapshot is a user-visible saved version of a wiki page or set of wiki changes.

- The UI does not use the word `commit`.
- Users can create a snapshot before asking AI to change anything.
- History is visible as a product timeline with author, time, and diff summary.

## Primary workflow

The core v1 flow is:

1. User opens Mohio into the scratchpad.
2. User writes one or more jots.
3. User clicks `Process`.
4. AI analyzes the jot and proposes:
   - create page,
   - update page,
   - link to related pages.
5. User reviews the proposal and diff.
6. Accepted changes become draft wiki changes.
7. User clicks `Publish` to push shared wiki changes upstream.

This keeps the scratchpad private and frictionless while making shared knowledge deliberate.

## UX structure

Mohio v1 is a desktop-first workspace with a lightweight mobile companion.

### Desktop layout

The main workspace has three persistent regions:

#### Left: navigation

- Shows the current page as the root.
- Lists directly related pages under that root.
- Keeps the tree local to the current context, not the entire repository.
- Includes a way to jump back to scratchpad at any time.

The goal is to make navigation feel familiar without forcing users into a rigid global folder mindset.

#### Center: editor

This is the main working area.

- Scratchpad jots open here.
- Wiki pages open here.
- The editor starts as an Obsidian-like hybrid Markdown editor.
- Markdown syntax changes the rendered style as the user types.
- A simple toolbar supports common formatting actions.
- Typography is intentionally fixed and minimal in v1.

Editing modes for v1:

- `Read`
- `Hybrid`
- `Source`

#### Right: context panel

The right side shows the current page's context.

Depending on state, it can show:

- related pages,
- backlinks,
- AI suggestions,
- proposal summary,
- recent changes to the current page,
- comment thread entry points.

The right panel is where Mohio starts to feel like connected knowledge instead of just files.

### Mobile scope

Mobile v1 is optimized for:

- capturing jots,
- reading wiki pages,
- reviewing simple proposals,
- viewing recent page changes.

Full conflict resolution and deep multi-file review are desktop-first features in v1.

## Scratchpad experience

The scratchpad is the primary home screen.

It should feel as lightweight as the simplest note-taking apps:

- new jot is always one tap away,
- jots are shown in a chronological list,
- no required folder, tag, or page selection before writing,
- users can keep writing without deciding where content belongs.

Each jot has a lightweight state:

- `New`
- `Processed`
- `Needs review`
- `Archived`

The scratchpad is intentionally unstructured. Structure is introduced later through proposals, linking, and publishing.

## AI behavior in v1

AI is a primary product capability, but not an autonomous publisher.

### What AI does

- understands what a jot is about,
- finds potentially relevant existing wiki pages,
- proposes new wiki pages when needed,
- proposes edits as diffs,
- suggests links between related pages,
- helps resolve conflicts in reviewable form.

### What AI does not do

- directly publish wiki changes,
- silently rewrite canonical pages,
- auto-file information without a visible proposal,
- require users to interact through chat for every action.

### First AI posture

The first-class UX is assistive and inline:

- tab-completion while writing,
- proposal generation from scratchpad,
- related-page suggestions in the side panel,
- diff-based review before changes land in the wiki.

Chat can exist, but it is not the primary interaction model for v1.

## Editing and review model

### Direct editing

Users can edit wiki pages directly.

- Changes remain local draft changes until published.
- Users can save a snapshot before large edits or before invoking AI.
- The system should make draft vs published state obvious.

### AI-assisted editing

When AI changes a wiki page, the user reviews:

- the target page,
- the reason for the change,
- the exact inserted, removed, or moved content,
- any related pages that may also need attention.

Accepted AI changes become draft changes, not published changes.

## Publish model

`Publish` is the trust boundary for shared knowledge.

- Scratchpad jots are personal by default.
- Wiki edits and accepted proposals become draft changes.
- Publishing pushes selected draft wiki changes to the shared repository.
- Users must always know what is included in the publish action.

V1 should support:

- publishing a single page,
- publishing multiple selected draft changes,
- viewing what changed before publishing.

The UI must avoid Git vocabulary. Users should see terms like:

- `Draft changes`
- `Save version`
- `History`
- `Publish`
- `Resolve conflict`

Not:

- branch
- commit
- merge
- push
- rebase

## History and change awareness

Visible history is required in v1.

For every wiki page, users should be able to see:

- who changed it,
- when it changed,
- a human-readable summary of the change,
- the diff,
- whether the change came from direct editing or an AI proposal.

When opening a wiki page, Mohio should highlight recent relevant changes to that page.

V1 should also include lightweight change awareness:

- recent changes for the current page,
- recent changes for directly related pages,
- basic notifications for mentions and comments.

A full notification center can evolve later, but change visibility cannot be omitted.

## Comments and lightweight collaboration

Mohio is async, not solitary.

V1 collaboration includes:

- page-level comments,
- text-range comments where practical,
- mentions,
- lightweight review of AI proposals,
- simple publish flow for shared knowledge.

Real-time co-editing is explicitly out of scope for v1.

## Navigation model

The navigation model in v1 is intentionally local and contextual.

- The currently open page is the navigation root.
- The left tree shows directly related pages from that root.
- Relatedness can come from explicit links first.
- AI-suggested related pages can be shown separately until accepted.

This supports a network-of-knowledge feel without forcing a graph UI as the primary interface.

V1 still needs one stable global escape hatch:

- search,
- recent pages,
- scratchpad,
- home/current workspace entry point.

Without that, users may lose orientation.

## Conflict resolution

Conflicts are expected, but they must be expressed in product language.

V1 conflict resolution should:

- show the user's version,
- show the incoming shared version,
- explain what changed in plain language,
- optionally let AI propose a resolution,
- require the user to approve the final result.

The experience should feel like choosing between document edits, not managing source control.

## Technical shape behind the UX

The underlying storage model for v1 is:

- a GitHub repository as the first workspace backend,
- Markdown files for jots and wiki pages,
- explicit publish of shared wiki changes,
- hidden Git mechanics under product language,
- user-controlled AI provider, with first integrations aimed at Codex-style workflows.

This remains an implementation detail. It should not leak into the user mental model unless something has failed and needs clear recovery guidance.

## Scope for v1

- Desktop-first workspace
- Mobile companion for capture and reading
- Personal scratchpad
- AI proposal flow from jot to wiki
- Direct wiki editing
- Snapshot/history view
- Explicit publish flow
- Relative navigation tree
- Related pages and backlinks
- Comments and mentions
- Simple conflict resolution

## Non-goals for v1

- Real-time collaborative editing
- Notion-style databases and relations
- Heavy rich media workflows
- Enterprise-grade permissions model
- Fully automatic AI publishing
- Graph view as the main interface

## Open product questions

These are intentionally unresolved and should be tested with users:

- When should a jot update an existing page versus create a new one?
- How much AI explanation is needed for users to trust a proposal?
- How should related-page suggestions be ranked and displayed?
- What is the right balance between local navigation and global orientation?
- Which collaboration actions matter most early: comments, mentions, or change notifications?
- How much mobile review workflow is worth supporting in v1?

## Product summary

Mohio v1 is a scratchpad-first, AI-assisted team wiki.

Users start with fast personal capture. AI helps turn rough notes into structured knowledge through reviewable proposals. Shared wiki content is edited directly or through accepted proposals, then explicitly published. The product must feel simple, local, and document-first, while quietly using Git and AI under the hood.
