# Mohio Architecture

`ARCHITECTURE.md` is the living engineering and technical-direction document for Mohio.

Update this document whenever the platform direction, major stack choices, document model, editor architecture, storage model, or other engineering constraints change.

## Purpose

Mohio is being developed as a local-first, document-centered knowledge workspace. The architecture should support a polished editing experience for non-technical users while preserving plain Markdown as the durable source format.

This document captures the current technical direction. It is not a promise that every prototype already implements everything described here.

## Current State

- The repository is in active development.
- Multiple prototype directories exist to explore layout, editor, and desktop-shell decisions.
- Current prototypes are used to validate product and implementation direction rather than represent a finished application architecture.
- A new `desktop/` Electron application now exists as the starting point for the real product codebase.
- The desktop app now includes local workspace selection and Markdown file-tree enumeration through the Electron main process, while document content loading and AI workflows are still ahead.

## Architectural Goals

- Keep content stored as portable Markdown files.
- Keep the default workflow local-first.
- Hide Git complexity from everyday users.
- Support bring-your-own AI workflows, including Codex and Claude Code, without giving AI silent write access to shared knowledge.
- Separate private editing, reviewable changes, checkpoints, and publishing.
- Build a desktop-first foundation before expanding companion mobile workflows.

## Platform Direction

### Desktop

- Current primary platform direction: `Electron`
- Goal: polished desktop workspace with strong local file-system integration

### Mobile

- Planned companion platform: `Flutter`
- Goal: support capture, reading, and lightweight review workflows on smaller screens

## Application Model

Mohio is organized around a workspace containing Markdown documents and related product state.

### Workspace

- A workspace maps to a local folder.
- Markdown files in the workspace are treated as documents.
- The product should make workspace context obvious without exposing raw filesystem complexity unnecessarily.

### Documents

- Markdown is the durable source of truth.
- Documents should remain portable outside Mohio.
- Internal links should use relative Markdown linking where practical.

### Editing

- Default editing mode: formatted `Quill`-based WYSIWYG editor
- Source editing mode: `CodeMirror`-based Markdown editor
- Future code editing workflows for AI-generated apps and tools: `CodeMirror`

### History and Publishing

- Editing should persist continuously.
- Named checkpoints capture meaningful document states.
- Publishing remains explicit and separate from editing.
- Shared changes should become increasingly reviewable as the product matures.

## Tech Stack Direction

The current repo direction and prototype work imply the following stack choices.

### Product Stack

- Desktop shell: `Electron`
- Desktop renderer foundation: `React` + `TypeScript` + `Vite`
- AI integration direction: bring-your-own assistants with Codex and Claude Code support
- Mobile app: `Flutter`
- Rich text editor: `Quill`
- Markdown source editor: `CodeMirror`
- Durable content format: `Markdown`
- Workspace storage model: local files in a Git-backed workspace

### Prototype Stack

Several prototypes use:

- `React`
- `TypeScript`
- `Vite`
- `Vitest`

These support fast iteration for interface and workflow exploration. Prototype stack choices should not automatically override product-level architecture decisions.

## System Areas

### 1. Desktop Shell

Responsibilities:

- native desktop windowing
- local workspace selection
- filesystem integration
- application lifecycle and packaging
- preload bridge for controlled renderer access to native capabilities

Current implementation status:

- single-window Electron shell
- secure preload bridge exposing app info plus workspace-selection and workspace-loading actions
- renderer shell with a real workspace selector and Markdown file tree in the left navigation

### 2. Workspace and File Layer

Responsibilities:

- enumerate Markdown files
- create, rename, and delete documents
- read and write document contents
- resolve internal links
- power filename and content search

### 3. Document Model

Responsibilities:

- represent editable note state
- preserve Markdown fidelity
- support formatted editing without losing durable source compatibility
- support checkpoint metadata and publish metadata

### 4. Editor Layer

Responsibilities:

- provide polished default writing UX
- support rich formatting operations
- allow advanced source editing when needed
- preserve readable editing at typical document lengths

### 5. AI Assistance Layer

Responsibilities:

- embedded interaction layer for connected assistants such as Codex and Claude Code
- document summarization, rewriting, organization, and expansion
- controlled creation or modification of workspace documents
- explicit, reviewable changes rather than opaque mutation

### 6. Publish and Review Layer

Responsibilities:

- distinguish local draft work from shared published state
- create and restore checkpoints
- support clearer review and change awareness over time

## Engineering Principles

- Prefer local-first behavior by default.
- Preserve user ownership of content.
- Keep file formats inspectable and portable.
- Make important changes reviewable.
- Avoid requiring users to understand Git internals.
- Keep implementation complexity behind a simple product surface.

## Open Technical Questions

- How should formatted editing map cleanly back to durable Markdown in all supported cases?
- How should checkpoints be stored and restored at the file level?
- What is the right local architecture for Codex- and Claude Code-driven edits and reviewable diffs?
- Which parts of publishing should be represented in files versus app metadata?
- How should search scale from simple local filtering to richer workspace discovery?

## Maintenance Rules

- Update this file in the same PR as any major engineering decision change.
- Keep user-facing scope in `docs/FEATURES.md` rather than duplicating it here.
- Keep system-wide design language in `docs/DESIGN.md` rather than turning this into a visual spec.
