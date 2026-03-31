# feature-20260331-navigation-and-discovery

## Date

2026-03-31

## Context

The desktop workspace shell already supported opening and editing Markdown notes, but navigation and discovery workflows were still limited to a single active document and a placeholder search field. There was no multi-tab workflow, no side-by-side note comparison, no contextual related-note view, and no way to collapse side panels when focusing on content.

## Change

- Added unified workspace search (`filename/path/content`) through new IPC + shared API contracts:
  - `searchWorkspace(query)`
  - `getRelatedDocuments(relativePath)`
- Implemented main-process discovery logic for:
  - ranked search results with snippets
  - internal-link graph extraction from Markdown + wiki links
  - related-note ranking from outgoing links, backlinks, and recents
- Added internal-link navigation in the editor surface:
  - `Cmd/Ctrl+Click` on internal link text opens the target note
  - supports Markdown links, wiki links, and anchor-aware targets
- Reworked the center panel into a pane-aware document workspace:
  - document tabs in the main panel
  - single-click uses current tab
  - double-click opens new tab
  - right-click document menu includes `Open in New Tab` and `Open in Split View`
  - two-pane side-by-side split mode with editable notes in both panes
  - closable document tabs with `X`
- Moved main document tab headers above the formatting toolbar and aligned header rows with side panel tabs.
- Added top-bar panel controls:
  - left side uses `panel-left-close / panel-left` to collapse/reopen the left panel
  - right side uses `panel-right-close / panel-right` to collapse/reopen the right panel
- Added right-sidebar `Related` tab showing ranked contextual notes.
- Updated renderer styles for:
  - aligned tab-header rows
  - split-pane editor layout
  - horizontal tab overflow
  - related-note list and search snippets
- Replaced renderer integration tests to validate the new navigation model and panel controls.

## Decision

Mohio now treats navigation and discovery as first-class workspace behavior in the desktop shell:

- search, links, tabs, split-view, and related-note context are integrated into one consistent flow
- panel visibility is user-controlled from persistent top-bar toggles
- document tabs share a consistent visual language with side-panel tabs while preserving close affordances (`X`) specific to document workspaces
- v1 keeps panel visibility and recents session-local while prioritizing predictable desktop editing ergonomics
