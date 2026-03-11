# Mohio User Experience

This document describes the intended user experience for Mohio. It is a product design reference for contributors who want to understand how the workspace should feel and why the interface is structured the way it is.

For the concrete visual system, spacing rules, typography, and layout measurements, see [VISUAL_DESIGN_SPEC.md](/Users/oliverkocsis/Workspace/mohio/VISUAL_DESIGN_SPEC.md).

## Experience Goals

Mohio should feel like a lightweight notes app and team wiki at the same time.

The experience is designed around a few goals:

- capturing information should be fast and low-friction,
- shared knowledge should feel structured and trustworthy,
- AI assistance should be visible and reviewable,
- navigation should encourage connected knowledge without becoming disorienting,
- version history should be understandable without exposing Git concepts.

## Core Objects

Mohio is built around four primary objects.

### Jot

A jot is a quick personal note created in the scratchpad.

- Every jot is its own Markdown document
- Jots are personal by default
- Jots appear in a simple chronological list
- Jots are intended for fast capture, not immediate organization

Typical examples include meeting notes, ideas, reminders, and early documentation drafts.

### Proposal

A proposal is an AI-generated suggestion for how a jot or existing page should affect shared knowledge.

A proposal can:

- create a new page,
- update an existing page,
- suggest edits across multiple pages,
- recommend related pages or links.

Every proposal should be reviewable and explain:

- what it is trying to change,
- which pages are affected,
- why those pages are relevant,
- what the exact diff looks like before anything is accepted.

### Wiki Page

A wiki page is the shared knowledge layer of the workspace.

- Wiki pages are Markdown files
- They can be edited directly by users
- They can also be updated through accepted proposals
- They represent the canonical version of shared team knowledge

### Snapshot

A snapshot is a visible saved version of a page or group of changes.

The interface should use product language such as "history" and "saved version" rather than Git vocabulary such as commits or branches.

## Primary Workflow

The intended core flow is:

1. A user opens Mohio in the scratchpad.
2. The user captures one or more jots.
3. Mohio analyzes the content and proposes pages, edits, or links.
4. The user reviews the proposal and its diff.
5. Accepted changes become draft updates to shared knowledge.
6. The user publishes selected changes when ready.

This keeps capture fast while making shared documentation deliberate.

## Workspace Layout

Mohio is desktop-first, with a lighter mobile companion.

### Left Panel: Navigation

The navigation area should feel familiar without forcing users into a rigid global tree.

- The current page acts as a local root
- The left panel shows directly related pages from that context
- Scratchpad should remain easy to reach at all times
- Search and recent pages should provide orientation when users need to jump elsewhere

### Center Panel: Editor

The center panel is the main working surface.

- Scratchpad jots open here
- Wiki pages open here
- The editor should remain simple and text-forward
- Markdown should be the primary authoring format
- Common formatting actions can be available through a lightweight toolbar

The editing modes currently envisioned are:

- Read
- Hybrid
- Source

### Right Panel: Context

The right panel provides the surrounding knowledge needed to work confidently.

Depending on the current state, it can show:

- related pages,
- backlinks,
- AI suggestions,
- proposal summaries,
- recent changes,
- entry points for comments and discussion.

## Scratchpad Experience

The scratchpad is the home base for everyday capture.

It should feel close to the simplest note-taking tools:

- creating a new jot should be immediate,
- users should not need to choose folders or tags before writing,
- the list should stay chronological and easy to scan,
- structure should emerge later through linking, proposals, and publishing.

Useful jot states include:

- New
- Processed
- Needs review
- Archived

## AI Assistance

AI is a primary product capability, but it should remain assistive rather than autonomous.

### What AI Should Do

- interpret rough notes,
- identify relevant existing pages,
- propose new pages when needed,
- suggest edits as diffs,
- recommend links between related pieces of knowledge,
- help with conflict resolution in reviewable form.

### What AI Should Not Do

- publish changes automatically,
- rewrite canonical pages without review,
- hide how a change was produced,
- force users into a chat-only workflow.

The preferred interaction model is inline and contextual, including suggestions while writing, proposal generation from the scratchpad, and side-panel recommendations.

## Editing and Publishing

Users should be able to edit wiki pages directly or accept AI-generated changes.

In both cases:

- draft changes should be visible,
- published state should be clear,
- history should remain easy to inspect,
- the publish action should clearly show what will be shared.

The publish step is an important trust boundary. It should feel intentional and understandable.

## History and Change Awareness

Visible history is essential to the product experience.

For each page, users should be able to see:

- who changed it,
- when it changed,
- a readable summary of the change,
- the diff,
- whether the change came from direct editing or an AI proposal.

Mohio should also help users stay aware of relevant updates through recent changes, contextual notifications, and clear indicators when a page has changed since it was last viewed.

## Collaboration and Conflicts

Mohio is intended for asynchronous collaboration rather than real-time co-editing.

Important collaboration capabilities include:

- page-level comments,
- mentions,
- lightweight proposal review,
- clear change visibility.

Conflicts should be expressed in product language and resolved through a guided interface that compares versions in plain terms, with optional AI help where appropriate.

## Mobile Scope

Mobile should support the most valuable lightweight tasks rather than the full desktop workflow.

The current intended scope is:

- capture new jots,
- read wiki pages,
- review simple proposals,
- inspect recent page changes.

Complex review, deep multi-page editing, and heavier conflict resolution remain desktop-first.
