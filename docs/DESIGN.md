# Mohio Design

`DESIGN.md` is the stable design-system and interface-direction document for Mohio.

Update this document when the product's visual system, interaction principles, component rules, or core layout model change. Minor implementation tweaks should not require edits here.

## Purpose

Mohio should feel calm, focused, document-centered, and trustworthy. It should not feel like a developer IDE, and it should not look like a generic SaaS dashboard.

This document is the single source of truth for Mohio's visual and interaction direction and should remain aligned with the product as the interface evolves.

## Design Principles

- Writing comes first. The editor is always the center of gravity.
- Navigation stays quiet and predictable.
- Connected AI assistance feels integrated, not louder than the document.
- `Publish` feels deliberate.
- Automatic persistence stays mostly invisible.
- System safety features should happen automatically rather than asking the user to manage them.
- Trust comes from clarity, not decoration.
- The interface should feel structured and productive before it feels expressive.

## Product Character

Mohio should feel:

- calm
- serious
- readable
- lightweight
- document-first
- practical

It should avoid:

- loud dashboard styling
- IDE-like chrome
- brightly colored chat-first interfaces
- playful or novelty-heavy visual language
- overly decorative editorial styling

## Layout Model

Mohio uses a desktop-first three-panel layout with a slim top bar.

### Top Bar

Should include:

- workspace label
- centered search bar
- `New note`

The top bar should use:

- `56px` height
- white background
- subtle bottom border
- streamlined workspace label with a subtle chevron aligned with the neutral chrome
- centered search bar between the workspace label and actions
- a single primary `New note` action

### Left Sidebar

Used for workspace browsing:

- file list or tree
- recent or pinned notes
- rename and delete actions
- a clearly visible active-note state

The left sidebar should use:

- `320px` width
- light gray background
- pinned and unpinned note sections
- compact note rows with title and relative date
- blue-tinted active note highlighting
- contextual row menus for rename, pin, and delete

### Center Panel

The largest area in the interface. It contains:

- document title field
- primary styled Markdown editor surface
- compact formatting toolbar with centered icon controls and lightweight selectors

The readable content should sit inside a narrower text column rather than stretching full width.

### Right Sidebar

Used for document-adjacent secondary workflows:

- connected assistant chat
- suggested actions
- publish state or last published status

The right sidebar should use:

- `384px` width
- assistant-first layout for connected tools such as Codex and Claude Code
- the same light gray sidebar surface as the left panel
- assistant label at the top without a large instructional card
- suggested actions near the bottom composer when chat is empty
- composer fixed to the bottom of the panel

## Layout Guidance

Suggested desktop proportions:

- left sidebar: `320px`
- center editor: flexible, with readable width around `768px`
- right sidebar: `384px`
- top bar: `56px`

Internal spacing should stay compact and regular:

- top bar horizontal padding: `24px`
- editor title and toolbar horizontal padding: `32px`
- editor body horizontal padding: `32px`
- sidebar section padding: `16px`

## Responsive Behavior

On narrow screens:

- the editor remains the default visible surface
- the workspace browser becomes a drawer
- the right panel becomes a drawer or tab
- publish actions remain accessible

## Color Direction

Mohio should use a light neutral product palette with restrained blue emphasis.

### Core Palette

- `--background: #ffffff`
- `--card: #ffffff`
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

### Color Rules

- Keep the palette neutral and high-contrast.
- Use white as the primary document surface.
- Use soft gray backgrounds to separate chrome from content.
- Use blue for active states, focus treatment, and primary actions.
- Reserve green for success states such as publish confirmation.
- Do not reintroduce warm beige surfaces unless the product direction changes again.

## Typography

Mohio should use a clean sans-serif stack and rely on spacing and weight more than font personality.

### Primary Font

- `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Use for:

- app chrome
- file list
- titles
- document body
- connected assistant chat

### Monospace Font

- fallback: `ui-monospace, monospace`

Use for:

- inline code
- code blocks
- Markdown markers when intentionally emphasized

### Type Scale

- workspace and breadcrumb text: `14px`, `400`
- current note title in top bar: `14px`, `500`
- document title: `30px`, `600`
- utility label: `12px`, `600`
- file row title: `14px`, `500`
- file row metadata: `12px`, `400`
- body text: `16px / 24px`, `400`
- button label: `14px`, `500`
- chat text: `14px / 20px`, `400`
- Markdown heading levels in the editor:
  `#` heading: `30px`, `600`
  `##` heading: `24px`, `600`
  `###` heading: `20px`, `600`
  `####` heading: `18px`, `600`

## Spacing, Radius, and Surface Rules

### Spacing Scale

- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`

### Radius

- controls and buttons: `4px`
- note rows and cards: `4px`
- menus and popups: `4px`
- larger containers should stay restrained and generally not exceed `8px`

### Borders and Shadow

- default border: `1px solid rgba(0, 0, 0, 0.1)`
- menu shadow: soft floating shadow for contextual menus only

Structure should come from borders, surface contrast, and compact spacing before shadow.

## Component Rules

### Buttons

- `New note` is the strongest primary action in the top bar.
- Avoid duplicating the same primary CTA in the left sidebar when it is already prominent in the app chrome.
- Secondary actions in the top bar use ghost styling with neutral text when present.
- Icon-and-label buttons are preferred over heavy solid toolbars.

### Inputs

Use a shared treatment for:

- search
- document title chrome
- chat composer

Style direction:

- white or very light gray background
- `1px` neutral border
- `4px` radius
- blue focus ring
- compact `14px` input text
- search inputs may use left icons inside the field

### File Rows

- stay compact
- use subtle hover states
- show title first and relative timestamp second
- keep contextual controls hidden until hover when possible
- active rows use soft blue background and darker blue text

### Checkpoint Rows

Checkpoints are system-managed and should not appear as a primary user-facing component in the interface.

### Assistant Chat

- use an assistant-first side panel
- user messages may use blue filled bubbles
- agent messages use neutral gray bubbles
- suggested actions appear before the conversation starts and sit close to the composer
- suggested actions use rounded pill-like treatments
- keep the composer anchored and easy to reach
- keep message widths constrained so the panel stays readable
- keep the experience product-like even when the connected assistant is Codex or Claude Code

## Editor Rules

- The document surface should feel generous and highly readable.
- The editing surface should keep raw Markdown editable while visually styling headings, lists, quotes, and code.
- Formatting controls should insert Markdown syntax rather than act like a heavyweight document toolbar.
- The formatting toolbar should use centered compact icon buttons, borderless control styling, and small selectors for extended options such as heading levels and additional text styles.
- Extended heading, text-style, and alignment options should collapse into compact dropdown-style affordances instead of expanding into full-width tool rows.
- Markdown source editing should remain legible rather than code-editor harsh.
- Avoid relying on a separate preview as the main reading experience.
- Code blocks, links, headings, and quotes need clear hierarchy without overpowering normal prose.
- The document title should live above the toolbar in its own quiet header row.
- The readable document column should stay narrower than the full window.

## Interaction Rules

- Favor explicit actions over hidden automation where trust matters.
- Keep destructive actions simple and visible.
- Make AI changes reviewable.
- Preserve orientation when moving between notes, search, chat, history states, and publish.
- Do not force users to understand Git concepts during normal workflows.
- Use blue consistently for active tabs, focused inputs, and primary action states.
- Keep menus and destructive controls contextual until the user asks for them.
- Keep checkpointing invisible in normal workflows. It is a background safety system, not a visible productivity feature.

## Maintenance Rules

- Update this file only for meaningful system-level design changes.
- Keep implementation-specific styling details in code unless they affect the shared design language.
- If a component behavior changes user expectations broadly, update this file and `docs/FEATURES.md`.
