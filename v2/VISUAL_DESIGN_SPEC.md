# Mohio Visual Design Spec v1

This document turns the attached reference into a concrete visual system for Mohio v1. It is not a pixel-perfect reverse engineering of the source image. It is a design instruction set that preserves the same feel:

- calm and premium,
- dense but not crowded,
- soft neutral surfaces,
- strong typography,
- one vivid accent color,
- familiar desktop app framing,
- clear hierarchy without visual noise.

## 1. Design intent

Mohio should feel like a modern desktop workspace for serious knowledge work, not a playful whiteboard tool and not a developer IDE.

The visual personality should be:

- editorial,
- quiet,
- structured,
- trustworthy,
- lightly social,
- subtly AI-assisted.

The UI should feel almost paper-like in its calmness, with only a few saturated accents used for focus, action, and identity.

## 2. Core visual principles

- Use large white or near-white surfaces.
- Use very soft gray framing around the main app shell.
- Keep borders visible but low-contrast.
- Let typography carry hierarchy more than color.
- Use accent color sparingly for active states and primary actions.
- Avoid heavy gradients, glassmorphism, or neon UI effects.
- Keep shadows subtle and close to the surface.

## 3. Layout system

### Base spacing scale

Use an 8 px baseline grid with a 4 px micro-step.

- `4` micro spacing for icon alignment and inline gaps
- `8` tight spacing inside chips and small controls
- `12` compact padding for dense utility rows
- `16` standard internal spacing
- `20` comfortable spacing for grouped controls
- `24` default panel/card padding
- `32` major section spacing
- `40` page section separation
- `48` large breathing room

### App canvas

Desktop app shell:

- Max width: `1680px`
- Min width: `1280px`
- Outer page margin: `24px`
- App shell corner radius: `28px`
- App shell background: `#FFFFFF`
- Outer page background: `#ECE9E6`

The app should sit inside a centered shell with visible rounded corners, like a desktop product rather than a full-bleed website.

### Main shell grid

Use a 3-column shell:

- Global icon rail: `72px`
- Workspace sidebar: `312px`
- Main content area: `minmax(880px, 1fr)`

Gap between shell columns:

- `0px` between rail and sidebar
- `0px` between sidebar and main content

These columns are separated by 1 px divider lines, not by gaps.

### Main content structure

Inside the content area use this vertical structure:

- Workspace header: `88px`
- Content-type tabs row: `56px`
- Toolbar/filter row: `64px`
- Scrollable content region: remaining height

Main content horizontal padding:

- `32px` left
- `32px` right

Vertical padding:

- `24px` top inside each row
- `24px` bottom in scrollable content

### Content grid

For card-based views:

- 12-column fluid grid
- Column gap: `24px`
- Row gap: `24px`
- Cards span `3 columns` on large desktop
- Cards span `4 columns` on medium desktop
- Cards span `6 columns` on tablet landscape
- Cards span `12 columns` on mobile

Recommended card size on desktop:

- Width: `minmax(280px, 1fr)`
- Height: `208px` to `224px`

## 4. Responsive breakpoints

- `1440px+`: 4-up content cards, full shell
- `1280px-1439px`: 3-up cards, same shell widths
- `1024px-1279px`: collapse sidebar to `272px`, 2-up cards
- `768px-1023px`: hide icon rail labels, switch to stacked panels where needed
- `<768px`: mobile mode, no persistent 3-column shell

On mobile:

- Scratchpad is the default landing surface
- Wiki opens full-screen
- Context panel becomes a bottom sheet or secondary tab

## 5. Color system

This palette should match the reference's softness and restraint.

### Neutral palette

- `--bg-page: #ECE9E6`
- `--bg-shell: #FFFFFF`
- `--bg-panel: #FBFAF8`
- `--bg-subtle: #F6F4F1`
- `--line-soft: #ECE7E2`
- `--line-default: #E3DDD7`
- `--line-strong: #D4CDC6`
- `--text-primary: #151515`
- `--text-secondary: #6C6863`
- `--text-tertiary: #9A948E`

### Accent palette

Primary accent is a clean violet-blue.

- `--accent-primary: #5B4CF4`
- `--accent-primary-hover: #4F42E4`
- `--accent-primary-pressed: #4337CF`
- `--accent-soft: #EEEAFE`
- `--accent-soft-line: #D9D1FD`

### Supporting accents

Use these only for identity chips, avatars, small labels, and category markers.

- `--accent-pink: #F27BC7`
- `--accent-yellow: #E6D262`
- `--accent-cyan: #4FB7D8`
- `--accent-green: #5FBB7B`

### Semantic colors

- `--success: #247A4D`
- `--success-bg: #ECF8F0`
- `--warning: #A86510`
- `--warning-bg: #FFF4E5`
- `--danger: #B23A36`
- `--danger-bg: #FDEEEE`

### Color rules

- Default text is almost black, never pure black.
- Surfaces stay warm-neutral, not blue-gray.
- Accent color should appear in under 10% of the interface at rest.
- Borders should be visible but soft; avoid strong outlines around every object.

## 6. Typography

### Font families

Use one primary sans family everywhere in the product UI:

- Primary UI font: `Plus Jakarta Sans`
- Fallback: `Inter, ui-sans-serif, system-ui, sans-serif`

Use a mono font only where raw Markdown or code must be shown:

- Mono font: `IBM Plex Mono`
- Fallback: `ui-monospace, SFMono-Regular, monospace`

### Type principles

- Headings are bold and compact.
- Body text is clean and neutral.
- Metadata stays readable, never tiny and washed out.
- Avoid using more than three weights in the same screen region.

### Type scale

- Display / workspace title: `40px / 44px`, weight `700`
- Page title: `28px / 34px`, weight `700`
- Section title: `22px / 28px`, weight `700`
- Card title: `18px / 26px`, weight `700`
- Tab label: `16px / 24px`, weight `500`
- Body default: `16px / 24px`, weight `500`
- Secondary text: `15px / 22px`, weight `500`
- Metadata / helper: `14px / 20px`, weight `500`
- Tiny labels: `12px / 16px`, weight `600`

### Typography usage

- Workspace name in the top bar: `22px / 28px`, `700`
- Sidebar section titles: `14px / 20px`, `700`
- Sidebar item labels: `16px / 24px`, `500`
- Card titles: clamp to 2 lines, `18px / 26px`, `700`
- Card metadata: `15px / 22px`, `500`, secondary text color
- Button labels: `16px / 20px`, `600`

## 7. Radius, borders, shadow, motion

### Corner radius

- App shell: `28px`
- Sidebar and large panels: `24px`
- Standard card: `18px`
- Buttons and pills: `14px`
- Small chips: `12px`
- Circular controls: `999px`

### Borders

- Default border: `1px solid var(--line-default)`
- Inner dividers: `1px solid var(--line-soft)`
- Selected border: `1px solid var(--accent-soft-line)`

### Shadows

Use soft, low-lift shadows only.

- Card resting shadow: `0 1px 2px rgba(17, 17, 17, 0.04)`
- Elevated panel shadow: `0 8px 24px rgba(17, 17, 17, 0.06)`
- Floating action shadow: `0 10px 24px rgba(45, 36, 120, 0.18)`

### Motion

- Hover transitions: `140ms ease`
- Panel/overlay transitions: `220ms cubic-bezier(0.2, 0.8, 0.2, 1)`
- Page-level transitions should be minimal
- Avoid springy motion or oversized scaling

## 8. App shell components

### Global icon rail

Purpose: global navigation and utility actions.

Specs:

- Width: `72px`
- Background: `#FCFBF9`
- Right divider: `1px solid var(--line-soft)`
- Vertical padding: `16px`
- Icon button size: `44px`
- Icon size: `22px`
- Icon stroke: `1.75px`
- Gap between buttons: `12px`

States:

- Default icon color: `var(--text-primary)`
- Hover background: `var(--bg-subtle)`
- Active background: `#F1EEFF`
- Active icon color: `var(--accent-primary)`

Bottom of rail contains:

- primary create button,
- AI shortcut,
- settings.

### Workspace sidebar

Purpose: workspace-level hierarchy, favorites, projects, scratchpad entry points.

Specs:

- Width: `312px`
- Background: `#FBFAF8`
- Right divider: `1px solid var(--line-soft)`
- Padding: `24px`
- Section spacing: `32px`

Sidebar title:

- `32px` top offset from shell top
- Title size: `18px / 26px`, `700`

Sidebar rows:

- Row height: `40px`
- Horizontal padding: `12px`
- Row radius: `12px`
- Icon gap: `12px`

Selected row:

- Background: `#F3F2F0`
- Text: primary
- Optional left color marker: `8px`

Section counters:

- Height: `20px`
- Min width: `20px`
- Radius: `999px`
- Fill: `#EFEDEA`
- Text: `12px / 20px`, `600`

### Workspace header

Purpose: identity, collaborators, and primary actions.

Specs:

- Height: `88px`
- Horizontal padding: `32px`
- Vertical alignment: center

Left side:

- workspace icon: `40px`
- workspace name: `22px / 28px`, `700`
- collaborator avatars: `32px`
- avatar overlap: `-6px`

Right side:

- secondary button `Upload` style
- primary button for create/new

### Tabs row

Purpose: switch content type within the workspace.

Specs:

- Height: `56px`
- Bottom border: `1px solid var(--line-soft)`
- Tab gap: `28px`

Tab label:

- `16px / 24px`, `500`
- Color default: `var(--text-secondary)`
- Active: `var(--text-primary)`

Active tab indicator:

- bottom bar height: `3px`
- width: content width
- radius: `2px`
- color: `var(--text-primary)`

### Toolbar row

Purpose: filters, count, search, sorting, view controls.

Specs:

- Height: `64px`
- Padding top/bottom: `16px`
- Compact utility density

Search input:

- Height: `44px`
- Width: `280px` to `360px`
- Radius: `14px`
- Border: `1px solid var(--line-default)`
- Inner horizontal padding: `14px`
- Placeholder color: `var(--text-tertiary)`

Utility buttons:

- Height: `40px`
- Horizontal padding: `14px`
- Radius: `12px`

## 9. Card system

The reference uses rounded content cards with strong titles and quiet metadata. This should become Mohio's default collection pattern for wiki pages, proposals, saved drafts, and scratchpad groupings.

### Standard card

- Background: `#FFFFFF`
- Border: `1px solid var(--line-default)`
- Radius: `18px`
- Padding: `24px`
- Min height: `212px`
- Display: vertical flex
- Title/content aligned to top
- Metadata/actions aligned to bottom

Internal spacing:

- Title to meta row: `16px`
- Meta row to footer: auto
- Footer elements gap: `12px`

### Card title

- `18px / 26px`
- Weight `700`
- Color `var(--text-primary)`
- Clamp to `2 lines`

### Card metadata

- Icon size: `18px`
- Text size: `15px / 22px`
- Color: `var(--text-secondary)`
- Gap between icon and text: `8px`

### Card footer

Left side:

- timestamp or status
- `15px / 22px`
- secondary color

Right side:

- circular overflow button
- Size: `40px`
- Border: `1px solid var(--line-soft)`
- Hover background: `var(--bg-subtle)`

### Card hover behavior

- translateY: `-1px`
- shadow increases slightly
- border color shifts from `--line-default` to `--line-strong`
- no exaggerated animation

## 10. Button system

### Primary button

- Height: `48px`
- Horizontal padding: `20px`
- Radius: `14px`
- Background: `var(--accent-primary)`
- Text: white
- Font: `16px / 20px`, `600`

Hover:

- background `var(--accent-primary-hover)`

Pressed:

- background `var(--accent-primary-pressed)`

### Secondary button

- Height: `48px`
- Background: `#FFFFFF`
- Border: `1px solid var(--line-default)`
- Text: `var(--text-primary)`

Hover:

- background: `var(--bg-subtle)`

### Icon-only button

- Size: `40px` or `44px`
- Radius: `999px`
- Border: `1px solid var(--line-soft)`
- Background: `#FFFFFF`

## 11. Mohio-specific adaptation

The reference image is a content library interface. Mohio should keep the shell and visual language, but adapt the content model.

### Left rail for Mohio

Recommended icon order:

- Home
- Scratchpad
- Search
- Notifications
- Shared wiki
- Proposals
- AI
- Settings

### Sidebar for Mohio

Recommended sections:

- Recents
- Scratchpad
- Draft changes
- Shared pages
- Favorites
- Projects / spaces
- Templates

This sidebar should stay familiar and list-based.

### Main content modes

Mohio should use this visual language in three primary views:

- Scratchpad list view
- Wiki collection/tree view
- Proposal review view

### Scratchpad view adaptation

Keep the same shell, but replace the card grid with a vertical stream of jots.

Scratchpad row spec:

- Row min height: `88px`
- Padding: `20px 24px`
- Border radius: `16px`
- Bottom gap: `16px`
- Title/first line weight: `600`
- Preview text: `15px / 22px`
- State badge on right: `New`, `Processed`, or `Needs review`

### Wiki page view adaptation

When a page is open:

- Keep left sidebar visible
- Replace collection cards with an editorial reading/editor surface
- Editor max text width: `760px`
- Editor left padding: `48px`
- Editor top padding: `40px`
- Context panel remains available on the right in desktop mode

### Proposal review view adaptation

Proposal review should feel like a high-trust document workflow.

- Proposal summary card at top
- Affected pages list below
- Diff blocks on white surfaces
- Accept and reject actions pinned in the top-right area
- Related pages panel shown in the right column

## 12. Markdown editor styling

The editor should remain visually quiet.

### Editor body

- Background: `#FFFFFF`
- Text width: `720px` to `760px`
- Body font: `16px / 28px`
- Text color: `var(--text-primary)`
- Markdown source mode uses `IBM Plex Mono 14px / 22px`

### Headings inside content

- `H1`: `32px / 38px`, `700`
- `H2`: `24px / 32px`, `700`
- `H3`: `20px / 28px`, `700`
- `H4`: `18px / 26px`, `700`

### Paragraphs

- Bottom margin: `16px`
- Max 75 characters per line where possible

### Lists

- Item spacing: `8px`
- Nested list indent: `24px`

### Inline styles

- Bold stays near-black
- Italic uses same color, never faded
- Inline code: mono, `14px`, subtle filled capsule background `#F5F3F0`
- Links: primary text with a subtle underline, not bright blue

### Selection and cursor

- Text selection background: `#EEEAFE`
- Caret color: `var(--accent-primary)`

## 13. Accessibility and quality bar

- Body text contrast must stay at or above WCAG AA.
- Interactive controls must have visible focus rings.
- Focus ring color: `rgba(91, 76, 244, 0.34)`
- Focus ring width: `3px`
- Minimum touch target: `40px`
- Do not communicate state through color alone.
- Active tab, selected page, and AI suggestion state must also use shape, weight, or iconography.

## 14. Implementation tokens

Use these as the first-pass CSS custom properties:

```css
:root {
  --bg-page: #ece9e6;
  --bg-shell: #ffffff;
  --bg-panel: #fbfaf8;
  --bg-subtle: #f6f4f1;
  --line-soft: #ece7e2;
  --line-default: #e3ddd7;
  --line-strong: #d4cdc6;
  --text-primary: #151515;
  --text-secondary: #6c6863;
  --text-tertiary: #9a948e;
  --accent-primary: #5b4cf4;
  --accent-primary-hover: #4f42e4;
  --accent-primary-pressed: #4337cf;
  --accent-soft: #eeeafe;
  --accent-soft-line: #d9d1fd;
  --accent-pink: #f27bc7;
  --accent-yellow: #e6d262;
  --accent-cyan: #4fb7d8;
  --accent-green: #5fbb7b;
  --success: #247a4d;
  --warning: #a86510;
  --danger: #b23a36;
  --radius-shell: 28px;
  --radius-panel: 24px;
  --radius-card: 18px;
  --radius-control: 14px;
  --shadow-card: 0 1px 2px rgba(17, 17, 17, 0.04);
  --shadow-panel: 0 8px 24px rgba(17, 17, 17, 0.06);
  --shadow-floating: 0 10px 24px rgba(45, 36, 120, 0.18);
}
```

## 15. Do not do this

- Do not use dark mode as the primary design target yet.
- Do not add multiple competing accent colors to navigation.
- Do not use large blurred gradients behind content.
- Do not over-round everything into a toy-like interface.
- Do not use tiny gray metadata that becomes unreadable.
- Do not let the AI affordances dominate the layout visually.

## 16. Summary

The desired look is a soft-neutral productivity shell with strong type, disciplined spacing, subtle borders, and a single violet accent. Mohio should feel immediately familiar to users who know modern desktop productivity tools, while still feeling calmer, cleaner, and more editorial than a typical SaaS dashboard.
