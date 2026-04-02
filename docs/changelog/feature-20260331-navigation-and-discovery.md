# feature-20260331-navigation-and-discovery

## Date

2026-03-31

## Context

The desktop workspace shell already supported opening and editing Markdown notes, but navigation and discovery workflows were still limited by a placeholder search field and weak panel-level navigation controls.

## Change

- Added unified workspace search (`filename/path/content`) through new IPC + shared API contract:
  - `searchWorkspace(query)`
- Implemented main-process discovery logic for:
  - ranked search results with snippets
- Added internal-link navigation in the editor surface:
  - `Cmd/Ctrl+Click` on internal link text opens the target note
  - supports Markdown links, wiki links, and anchor-aware targets
- Kept document editing focused on a single active editor surface:
  - removed multi-document tabs in the center panel
  - removed side-by-side split view in the center panel
  - removed document context-menu actions for `Open in New Tab` and `Open in Split View`
  - single document selection now always opens directly in the main editor
- Added top-bar panel controls:
  - left side uses `panel-left-close / panel-left` to collapse/reopen the left panel
  - right side uses `panel-right-close / panel-right` to collapse/reopen the right panel
- Removed the third right-sidebar tab and its document-discovery API from the feature scope.
- Moved workspace search into a dedicated left-sidebar `Search` tab:
  - removed the top-bar search input
  - added a full-width search input at the top of the `Search` tab
  - added inline `X` clear control on the right side of search inputs
  - moved live search results from `Documents` into `Search`
  - kept realtime query behavior with debounce buffering
  - highlighted active search matches in open documents with yellow in-editor marks
- Refined assistant sidebar ergonomics:
  - restored quick-action example pills above the composer input
  - kept the composer region pinned to the bottom of the sidebar
  - constrained thread-list titles to single-line ellipsis overflow
- Simplified primary shell actions:
  - removed the top-bar quick `Publish` button
  - removed the `Documents`-tab bottom `New Note` button in the left panel
  - kept explicit publish via the `Unpublished` tab footer action
- Renamed workspace-opening UI labels to folder language for consistency:
  - top-bar workspace selector fallback label: `Open Folder`
  - center empty-state CTA: `Open Folder` / `Opening Folder...`
  - file-menu entry: `File > Open Folder...`
- Updated renderer styles for:
  - simplified single-editor layout
- Replaced renderer integration tests to validate the new navigation model and panel controls.

## Decision

Mohio now treats navigation and discovery as first-class workspace behavior in the desktop shell:

- search and links are integrated into a simpler single-document editing flow
- panel visibility is user-controlled from persistent top-bar toggles
- v1 keeps panel visibility session-local while prioritizing predictable desktop editing ergonomics
