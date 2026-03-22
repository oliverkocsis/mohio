# Mohio Design System

This document is developer-facing. It defines the shared visual and interaction rules for the current desktop UI.

## Design Intent

Mohio should feel:

- calm
- readable
- document-first
- trustworthy

Mohio should avoid:

- dashboard-heavy styling
- IDE chrome dominance
- loud assistant-first presentation
- visual noise

## Layout Model

Mohio uses a desktop-first three-panel layout with a slim top bar.

### Top Bar

- Height: `56px`
- Purpose: workspace selection and search placeholder
- Rules:
  - keep the workspace selector prominent
  - keep search visually secondary until it is functional

### Left Sidebar

- Width target: `320px`
- Purpose: show the current workspace tree
- Rules:
  - directories appear before documents
  - expanded and collapsed states use chevrons
  - active document uses a soft blue highlight
  - empty states use short copy and one clear next action

### Center Panel

- Flexible width with readable content around `768px`
- Purpose: title editing and rich-text editing
- Rules:
  - content stays visually central
  - title and body should feel like one editing surface
  - toolbar remains compact and utility-focused

### Right Sidebar

- Width target: `384px`
- Purpose: support assistant-driven note and workspace conversations
- Rules:
  - keep the panel visually secondary to the editor
  - use concise note and workspace context in the header
  - show transcript bubbles instead of dense settings chrome
  - use quick-action chips for common note workflows
  - composer stays anchored at the bottom

## Visual Tokens

### Color

- `--background: #ffffff`
- `--sidebar-surface: #f9fafb`
- `--muted-surface: #f3f4f6`
- `--muted-surface-strong: #ececf0`
- `--border: rgba(0, 0, 0, 0.1)`
- `--text-primary: #111827`
- `--text-secondary: #4b5563`
- `--text-muted: #6b7280`
- `--text-subtle: #9ca3af`
- `--accent-blue: #2563eb`
- `--accent-blue-hover: #1d4ed8`
- `--accent-blue-soft: #eff6ff`
- `--success-soft: #f0fdf4`
- `--success-text: #15803d`

### Typography

- Primary UI and body font:
  - `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Monospace fallback:
  - `ui-monospace, monospace`
- Current scale:
  - document title: `30px`, `600`
  - body text: `16px / 24px`, `400`
  - sidebar row title: `14px`, `500`
  - helper labels: `12px` to `14px`

### Spacing and Radius

- Spacing scale:
  - `4px`
  - `8px`
  - `12px`
  - `16px`
  - `24px`
  - `32px`
- Radius:
  - controls and rows: `4px`
  - larger containers: do not generally exceed `8px`

## Component Rules

### Workspace Selector

- Treated as the main entry point when no workspace is open
- Uses a subtle chevron to signal folder switching

### Workspace Tree

- Prefer compact rows over roomy file-explorer spacing
- Show display titles when available instead of raw filenames
- Keep nesting readable with indentation, not heavy borders

### Editor Toolbar

- Only include actions that work today
- Group controls by formatting type
- Prefer compact icon buttons and short heading buttons over large segmented chrome

### Title Input

- Behaves like part of the document surface, not like a form field in a settings page
- Auto-resizes with content
- Uses strong type scale and minimal surrounding chrome

### Empty States

- Use one clear message
- Use one clear next action

### Assistant Panel

- Keep message bubbles compact and readable
- Use the same surface palette as the rest of the shell
- Keep assistant errors local to the panel footer
- Disable quick actions and the composer while a run is active

## Interaction Rules

- Opening a workspace should update the shell immediately.
- Selecting a document should feel instant and should not expose raw IPC or filesystem concepts.
- Saving should be automatic and mostly invisible.
- Error messages should be brief and local to the affected panel.
- Assistant UI should remain secondary to the document even when live.
- Switching notes should switch the visible assistant thread with the note.
- Assistant runs should stream text into the panel instead of waiting for a full-page transition.

## Responsive Guidance

- Desktop is the primary target.
- On narrower layouts, preserve the editor as the default visible surface.
- Workspace navigation and assistant workflows should collapse into secondary panels or drawers when mobile layouts are introduced.

## When To Update This Document

Update this file when any of the following change:

- layout proportions
- color or typography tokens
- shared component behavior
- interaction language
- empty-state patterns
