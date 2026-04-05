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

- Height: `48px`
- Purpose: workspace selection, quick document control, manual sync control, and panel visibility controls
- Rules:
  - keep the workspace selector prominent
  - keep the manual `Sync` status action in the right action cluster, directly before the right-panel toggle
  - keep panel collapse/reopen controls icon-only and edge-aligned (left toggle on the left, right toggle on the right)

### Left Sidebar

- Width target: `320px`
- Purpose: show workspace browsing (`Documents`) and workspace search (`Search`)
- Rules:
  - tab headers use centered inline tabs (not full-width)
  - tabs are borderless with active-state underline only
  - keep existing tab icons next to labels
  - keep even spacing between tabs and align labels to the middle
  - directories appear before documents
  - keep the `Search` tab input full-width and pinned to the top of the tab content
  - expanded and collapsed states use chevrons
  - active document uses a soft blue highlight
  - empty states use short copy and one clear next action

### Center Panel

- Flexible width with readable content around `768px`
- Purpose: single-document title editing and rich-text editing
- Rules:
  - content stays visually central
  - title and body should feel like one editing surface
  - toolbar remains compact and utility-focused

### Right Sidebar

- Width target: `384px`
- Purpose: support assistant and version-history workflows
- Rules:
  - use the same centered underline-only tab-header style as the left sidebar
  - keep the panel visually secondary to the editor
  - start with a dedicated session-list screen instead of mixing history and transcript together
- keep the list-view header minimal (tab header only)
- keep thread titles in the list compact (single-line with ellipsis overflow handling)
  - use a detail header with back navigation, thread title, and a compact overflow menu
  - keep header icon controls lightweight, without bordered icon chrome for back, new-chat, or chat-menu actions
  - avoid bubble chrome for assistant answers; render them as full-width left-aligned document-style responses
  - use quick-action chips for common document workflows
- composer stays anchored at the bottom
- keep quick-action pills directly above the composer input within the sticky footer block

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

- Use Title Case for visible button labels.
- Use British English spelling in all user-visible copy (for example: `summarise`, `organise`, `colour`, `centre`).
- Exception: assistant quick-action chips use sentence case.

### Workspace Selector

- Treated as the main entry point when no workspace is open
- Uses a subtle chevron to signal folder switching

### Workspace Tree

- Prefer compact rows over roomy file-explorer spacing
- Show display titles when available instead of raw filenames
- Keep nesting readable with indentation, not heavy borders
- Show a lightweight `New Document` icon control in the workspace header, using the same unframed icon-button treatment as the assistant panel
- Document rows should open documents directly in the main editor on single-click
- Document context menu should expose delete

### Editor Toolbar

- Only include actions that work today
- Group controls by formatting type
- Prefer compact icon buttons and short heading buttons over large segmented chrome
- Use `lucide-react` consistently for shared shell and editor icons.
- Use only icons from [Lucide](https://lucide.dev/icons/) and do not add custom hand-authored SVG icon shapes in the renderer.

### Title Input

- Behaves like part of the document surface, not like a form field in a settings page
- Auto-resizes with content
- Uses strong type scale and minimal surrounding chrome

### Empty States

- Use one clear message
- Use one clear next action

### Assistant Panel

- show Codex chats as a simple first-stage text list of selectable titles
- do not show a separate `New Chat` button in list view; sending from footer starts a new thread automatically
- when a thread is open, show back navigation and thread-level actions instead of the history list
- keep the assistant footer pinned to the bottom of the right sidebar in both list and thread views
- Keep user prompts compact, but render assistant answers as full-width left-aligned responses
- Keep `Thinking...` as a separate last-line status row, not as replacement text inside the assistant response
- Hide `Thinking...` while assistant text is actively streaming, and bring it back only during quiet gaps in an active run
- Never let streamed assistant text disappear once it has been rendered
- Use the same surface palette as the rest of the shell
- Keep assistant errors local to the panel footer
- Disable quick actions and the composer while a run is active

## Interaction Rules

- Opening a workspace should update the shell immediately.
- Selecting a document should feel instant and should not expose raw IPC or filesystem concepts.
- Search should be live and return both filename/path and content matches.
- Active search terms should be highlighted in the editor surface with a yellow highlighter treatment.
- Saving should be automatic and mostly invisible.
- Error messages should be brief and local to the affected panel.
- Assistant UI should remain secondary to the document even when live.
- Switching chats should not change the selected document.
- Switching documents should keep the active Codex chat, but future prompts should use the newly selected document as primary context.
- Assistant runs should stream text into the panel instead of waiting for a full-page transition.
- Side panel collapse controls must always remain visible in the top bar so collapsed panels can be reopened in one click.

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
