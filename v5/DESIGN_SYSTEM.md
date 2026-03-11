# Mohio v5 Design System

This document defines the minimum design system for `v5` based on [FEATURE_DESCRIPTION.md](/Users/oliverkocsis/Workspace/mohio/v5/FEATURE_DESCRIPTION.md) and [LAYOUT.md](/Users/oliverkocsis/Workspace/mohio/v5/LAYOUT.md).

The attached reference image is used only as visual inspiration. This system does not copy that interface. It keeps only the useful qualities:

- soft neutral surfaces
- restrained contrast
- strong editorial typography
- compact spacing
- one dark, high-trust primary action

The goal is a calm document workspace. It should feel simple, serious, and readable, not like a developer IDE and not like a generic SaaS dashboard.

## 1. Design principles

- Writing comes first. The editor is the visual center of the product.
- Navigation should stay quiet and predictable.
- `Create checkpoint` and `Publish` should feel deliberate.
- Agent chat should feel integrated, not louder than the document.
- Automatic persistence should remain invisible in the UI.

## 2. Color system

Keep the palette small. `v5` does not need a large token set.

### Core colors

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

### Usage rules

- Use warm off-whites, not cold gray-blue surfaces.
- Most panels should be light. Do not introduce dark sections except for the primary action button.
- `Publish` is the only default dark filled action.
- `Create checkpoint` and `New note` should use quiet secondary styling.
- Links inside Markdown should use the blue accent, but sparingly.

## 3. Typography

Use only two font families.

### UI and document font

- Primary font: `Instrument Sans`
- Fallback: `ui-sans-serif, system-ui, sans-serif`

Use this for:

- app chrome
- file list
- document title
- body text in the styled Markdown editor
- agent chat

### Code font

- Mono font: `IBM Plex Mono`
- Fallback: `ui-monospace, monospace`

Use this only for:

- fenced code blocks
- inline code
- raw Markdown markers when visually emphasized

### Type scale

- App title / current file title in top bar: `18px / 24px`, `600`
- Document title field: `40px / 44px`, `650`
- Sidebar section text or utility labels: `12px / 16px`, `600`
- File list rows: `15px / 20px`, `500`
- Body text / editor default: `18px / 31px`, `400`
- Secondary UI text: `14px / 20px`, `500`
- Button labels: `14px / 18px`, `600`
- Chat message text: `15px / 24px`, `400`

### Typography rules

- Let hierarchy come from size and weight, not color.
- Keep the editor text generous and highly readable.
- Do not use more than three weights across a single screen.

## 4. Spacing

Use a compact spacing scale:

- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`

### Usage rules

- `8px` for tight control gaps
- `12px` for button padding and list row internals
- `16px` for panel padding in dense areas
- `24px` for standard section padding
- `32px` for major separation inside the editor view

## 5. Radius and borders

Keep corners soft but not rounded to the point of feeling playful.

- App shell radius: `20px`
- Panel radius: `16px`
- Input and button radius: `12px`
- Small row highlight radius: `10px`
- Border default: `1px solid var(--border-subtle)`

### Shadow

Use one low-contrast shadow only where needed:

- `0 6px 18px rgba(23, 22, 20, 0.06)`

Most structure should come from tone and borders, not shadow.

## 6. Layout styling

Keep the layout exactly as described in [LAYOUT.md](/Users/oliverkocsis/Workspace/mohio/v5/LAYOUT.md).

### App shell

- Full app background uses `--bg-app`
- Left sidebar uses `--bg-sidebar`
- Center editor and right sidebar sit on `--bg-panel`
- Use vertical dividers instead of large gaps between the three main columns

### Top bar

- Height: `60px`
- Horizontal padding: `24px`
- Bottom border only
- Actions aligned right

### Left sidebar

- Width: `280px` to `320px`
- Padding: `16px`
- Search stays at the top
- File list rows use low-contrast hover and selected states

### Center editor

- Main readable content width: `820px` target
- Outer horizontal padding: `32px`
- Vertical padding: `24px`

### Right sidebar

- Width: `360px` to `400px`
- Padding: `16px`
- Internal sections separated by space and subtle dividers

## 7. Component essentials

Only define the components needed for the features already in scope.

### Buttons

#### Primary button

Use only for `Publish`.

- Background: `--action-primary`
- Text: `--action-primary-text`
- Height: `40px`
- Horizontal padding: `16px`
- Radius: `12px`

#### Secondary button

Use for `New note` and `Create checkpoint`.

- Background: `--bg-panel`
- Border: `1px solid var(--border-strong)`
- Text: `--text-primary`
- Height: `40px`
- Horizontal padding: `16px`

### Inputs

Use the same visual style for:

- search
- document title field chrome
- agent chat composer

Style:

- background: `--bg-editor`
- border: `1px solid var(--border-subtle)`
- radius: `12px`
- padding: `12px 14px`
- text color: `--text-primary`

### File list row

Use for files in the left sidebar.

- row height: `36px` minimum
- text: `15px / 20px`
- selected state: `--bg-panel`
- selected border or inset highlight: `1px solid var(--border-subtle)`

### Checkpoint row

Use in the right sidebar.

- compact stacked row
- name on first line
- muted metadata on second line
- hover state only, no heavy card treatment

### Agent chat

Keep the chat clean and document-adjacent.

- assistant and user messages live in the same quiet surface system
- avoid brightly colored bubbles
- distinguish messages through spacing and label treatment, not chat-app styling
- composer remains fixed to the bottom of the right sidebar

## 8. Styled Markdown editor rules

This is the most important part of the system.

The editor must still show Markdown source while making it feel polished and readable.

### Default editor text

- font: `Instrument Sans`
- size: `18px`
- line height: `31px`
- color: `--text-primary`

### Headings

- darker and heavier than body text
- reduce visual prominence of leading Markdown markers like `#`
- preserve the raw syntax, but do not let markers dominate the line

### Lists

- keep list indentation clear and compact
- bullets and numbers should appear in `--text-secondary`

### Links

- use `--accent-link`
- underline on hover or focus
- linked file references should feel clearly interactive

### Blockquotes

- add a soft left rule using `--border-strong`
- slightly reduce text contrast

### Inline code

- use `IBM Plex Mono`
- slightly tinted background with `--bg-muted`
- small radius: `8px`
- horizontal padding: `4px`

### Fenced code

- mono font
- `--bg-muted` surface
- `16px` internal padding
- `12px` radius

### Selection and focus

- selection color should be soft and warm, not bright system blue
- focused inputs and editor areas should use a subtle darker border, not a glowing outline

## 9. Interaction tone

The interface should feel calm and explicit.

- no loud save indicators
- no success toasts for routine editing
- no oversized floating controls
- no saturated accent colors except links

`Publish` is the one action that should visibly stand apart.

## 10. Minimum implementation token set

If this is implemented as CSS variables, start with only these:

```css
:root {
  --bg-app: #f4f1ec;
  --bg-sidebar: #f1ede7;
  --bg-panel: #fcfbf8;
  --bg-editor: #fffdf9;
  --bg-muted: #f7f4ef;
  --border-subtle: #e5dfd6;
  --border-strong: #d6cfc5;
  --text-primary: #171614;
  --text-secondary: #6e685f;
  --text-muted: #9a9388;
  --accent-link: #2457d6;
  --action-primary: #171614;
  --action-primary-hover: #24211d;
  --action-primary-text: #fffdf9;
  --radius-panel: 16px;
  --radius-control: 12px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
}
```

## Final recommendation

Keep `v5` visually narrow in scope:

- warm neutral shell
- high-readability editorial typography
- minimal control styles
- dark `Publish` button
- quiet sidebars
- strong styled-source editor

That is enough for the current feature set. `v5` does not need a larger or more expressive design system yet.
