# Mohio Design

`DESIGN.md` is the stable design-system and interface-direction document for Mohio.

Update this document when the product's visual system, interaction principles, component rules, or core layout model change. Minor implementation tweaks should not require edits here.

## Purpose

Mohio should feel calm, focused, document-centered, and trustworthy. It should not feel like a developer IDE, and it should not look like a generic SaaS dashboard.

This document captures the shared visual and interaction rules that should remain relatively stable across implementations.

## Design Principles

- Writing comes first. The editor is always the center of gravity.
- Navigation stays quiet and predictable.
- AI assistance feels integrated, not louder than the document.
- `Create checkpoint` and `Publish` feel deliberate.
- Automatic persistence stays mostly invisible.
- Trust comes from clarity, not decoration.

## Product Character

Mohio should feel:

- calm
- serious
- readable
- lightweight
- document-first

It should avoid:

- loud dashboard styling
- IDE-like chrome
- brightly colored chat-first interfaces
- playful or novelty-heavy visual language

## Layout Model

Mohio uses a desktop-first three-panel layout with a slim top bar.

### Top Bar

Should include:

- workspace name
- current file title
- search entry point
- `New note`
- `Create checkpoint`
- `Publish`

### Left Sidebar

Used for workspace browsing:

- search field
- new note entry point
- file list or tree
- recent or pinned notes
- rename and delete actions
- a clearly visible active-note state

### Center Panel

The largest area in the interface. It contains:

- document title field
- primary WYSIWYG editor surface
- lightweight formatting toolbar

### Right Sidebar

Used for document-adjacent secondary workflows:

- assistant chat
- suggested actions
- checkpoint history
- publish state or last published status

## Layout Guidance

Suggested desktop proportions:

- left sidebar: `280px` to `320px`
- center editor: flexible, with readable width around `760px` to `960px`
- right sidebar: `340px` to `420px`
- top bar: `56px` to `64px`

## Responsive Behavior

On narrow screens:

- the editor remains the default visible surface
- the workspace browser becomes a drawer
- the right panel becomes a drawer or tab
- checkpoint and publish actions remain accessible

## Color Direction

Mohio should use warm, editorial, low-noise surfaces rather than cold product grays.

### Core Palette

- `--bg-app: #f4f1ec`
- `--bg-sidebar: #f1ede7`
- `--bg-panel: #fcfbf8`
- `--bg-editor: #fffdf9`
- `--bg-muted: #f7f4ef`
- `--border-subtle: #e5dfd6`
- `--border-strong: #d6cfc5`
- `--text-primary: #171614`
- `--text-secondary: #6e685f`
- `--text-muted: #9a9388`
- `--accent-link: #2457d6`
- `--action-primary: #171614`
- `--action-primary-hover: #24211d`
- `--action-primary-text: #fffdf9`

### Color Rules

- Keep the palette small.
- Prefer light surfaces.
- Use dark fills sparingly.
- Reserve the strongest default emphasis for `Publish`.
- Use link color as an accent, not a dominant theme.

## Typography

Use only two font families by default.

### Primary UI and Document Font

- `Instrument Sans`
- fallback: `ui-sans-serif, system-ui, sans-serif`

Use for:

- app chrome
- file list
- titles
- document body
- assistant chat

### Monospace Font

- `IBM Plex Mono`
- fallback: `ui-monospace, monospace`

Use for:

- inline code
- code blocks
- Markdown markers when intentionally emphasized

### Type Scale

- top bar title: `18px / 24px`, `600`
- document title: `40px / 44px`, `650`
- utility label: `12px / 16px`, `600`
- file row: `15px / 20px`, `500`
- body text: `18px / 31px`, `400`
- secondary UI text: `14px / 20px`, `500`
- button label: `14px / 18px`, `600`
- chat text: `15px / 24px`, `400`

## Spacing, Radius, and Surface Rules

### Spacing Scale

- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`

### Radius

- app shell: `20px`
- panel: `16px`
- input and button: `12px`
- small row highlight: `10px`

### Borders and Shadow

- default border: `1px solid var(--border-subtle)`
- default shadow when needed: `0 6px 18px rgba(23, 22, 20, 0.06)`

Structure should come from tone, spacing, and borders before shadow.

## Component Rules

### Buttons

- `Publish` is the primary button.
- `New note` and `Create checkpoint` use quiet secondary styling.
- Primary and secondary actions should be visually distinct without making the chrome noisy.

### Inputs

Use a shared treatment for:

- search
- document title chrome
- chat composer

Style direction:

- light background
- subtle border
- soft radius
- clear text contrast

### File Rows

- stay compact
- use subtle hover and selected states
- keep the active note obvious without shouting

### Checkpoint Rows

- keep them compact and informational
- avoid heavy card styling
- emphasize name first, metadata second

### Assistant Chat

- keep assistant and user messages within the same quiet surface system
- avoid bright chat bubbles
- distinguish messages through spacing, alignment, and label treatment
- keep the composer anchored and easy to reach

## Editor Rules

- The document surface should feel generous and highly readable.
- Rich text editing should stay clean and uncluttered.
- The default editing experience should support direct rich-text editing without making writing feel tool-heavy.
- Markdown source editing should remain legible rather than code-editor harsh.
- Avoid relying on a separate preview as the main reading experience.
- Code blocks, links, headings, and quotes need clear hierarchy without overpowering normal prose.

## Interaction Rules

- Favor explicit actions over hidden automation where trust matters.
- Keep destructive actions simple and visible.
- Make AI changes reviewable.
- Preserve orientation when moving between notes, search, chat, checkpoints, and publish.
- Do not force users to understand Git concepts during normal workflows.

## Maintenance Rules

- Update this file only for meaningful system-level design changes.
- Keep implementation-specific styling details in code unless they affect the shared design language.
- If a component behavior changes user expectations broadly, update this file and `docs/FEATURES.md`.
