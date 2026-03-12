# Markdown Editor Future-Proof Assessment

## Context

The comparison changed after both prototypes added three editor states:

- `Source`: raw Markdown with no presentation styling
- `Hybrid`: Markdown syntax remains visible, but the content is visually styled
- `Formatted`: only formatted content is shown, with Markdown markup hidden

That addition matters because it separates two different questions:

1. Which editor is the better long-term foundation for a Markdown-native product?
2. Which editor handles a true markup-free formatted view more naturally?

## Updated Verdict

`v6-codemirror` is still the more future-proof foundation if Markdown is the canonical document model and long-term syntax fidelity matters most.

`v7-quill` is now stronger specifically for the `Formatted` view, because it uses a real rich-text representation for that mode rather than visually masking Markdown tokens.

So the revised conclusion is:

- Best Markdown-first architecture: `v6-codemirror`
- Best true formatted-only editing mode: `v7-quill`

## Why `v6-codemirror` Still Leads Overall

- It keeps a single document model at all times: raw Markdown text.
- The editor is built directly on CodeMirror's Markdown language package and extension model in [src/components/MarkdownEditor.tsx](./src/components/MarkdownEditor.tsx).
- Toolbar actions still operate directly on Markdown text in [src/lib/formatting.ts](./src/lib/formatting.ts), which keeps future features easier to reason about.
- If task lists, tables, frontmatter, custom blocks, MDX, linting, Markdown autocomplete, or collaboration features are added later, extending a Markdown-native text model is usually safer than converting between rich text and Markdown repeatedly.
- The dependency story remains cleaner. `v6-codemirror` mostly depends on CodeMirror packages plus React in [package.json](./package.json), while `v7-quill` depends on Quill plus Markdown/HTML conversion utilities.

## How `v6-codemirror` Handles the Three Modes

`v6-codemirror` keeps the Markdown source as the only truth and projects the three views from that source:

- `Source` removes the presentation plugin and shows the Markdown plainly.
- `Hybrid` uses CodeMirror styling and decorations so the Markdown characters remain visible but the content is visually formatted.
- `Formatted` hides selected Markdown tokens using CodeMirror decorations while keeping the underlying document unchanged.

This is implemented in [src/components/MarkdownEditor.tsx](./src/components/MarkdownEditor.tsx) through `createMarkdownPresentation()`, `buildMarkdownDecorations()`, and the line and inline decoration helpers.

That approach is strategically strong because mode switching is cheap and lossless: the source text never changes format internally.

## How Good CodeMirror Is at `Formatted`

CodeMirror manages the formatted layout reasonably well for a limited Markdown subset, but it is not naturally a true markup-free editor.

What it does well:

- Hides heading, bullet, blockquote, emphasis, inline code, and link syntax using `Decoration.replace()`
- Applies clean typography for headings, lists, quotes, and links
- Preserves raw Markdown exactly while changing only the visual presentation

Current limitations:

- Ordered list markers are not fully hidden in `formatted` mode
- Fenced code block markers are not hidden
- Inline formatting detection is regex-based and limited to simple cases
- More complex Markdown such as nested emphasis, task lists, tables, multiline constructs, custom syntax, or MDX will become progressively harder to support cleanly
- Caret movement and text selection can become unintuitive when tokens are visually hidden but still exist in the underlying document

The practical takeaway is that CodeMirror can simulate a formatted-only editor, but it does so as a visual projection over Markdown, not as a native WYSIWYG model.

## Why `v7-quill` Improved

`v7-quill` is stronger than before because `Formatted` mode now uses a real rich-text path:

- Markdown is converted to HTML and loaded into Quill in `formatted` mode
- The user edits rich text in Quill
- Quill content is converted back to Markdown when serialized

This gives Quill a more natural markup-free formatted experience than CodeMirror can provide through decorations alone.

For the `Formatted` view, that is a real advantage.

## Why `v7-quill` Is Still Riskier Long-Term

Even with the new mode support, Quill remains less future-proof for a Markdown-native product because the architecture now relies on conversion boundaries:

- `Source` and `Hybrid` are effectively Markdown-text modes
- `Formatted` is a rich-text mode backed by Markdown <-> HTML conversion

That means the editor no longer has one consistent internal model across all views.

Long-term risks:

- Fidelity loss during Markdown -> HTML -> Quill -> HTML -> Markdown round-trips
- Harder support for advanced or custom Markdown syntax
- More fragile selection and cursor mapping when switching modes
- Split editing semantics across text mode and rich-text mode
- Undo/redo and edge-case behavior become harder to keep consistent across all three views

This does not make Quill wrong. It just means Quill is now stronger for presentation quality than for long-term Markdown correctness.

## Mixing CodeMirror and Quill

It is technically viable to use CodeMirror for `Source` and `Hybrid`, and Quill for `Formatted`.

That architecture can work if Markdown remains the canonical source of truth and `Formatted` is treated as a conversion-backed view.

It is a reasonable option if:

- `Formatted` is mainly a polished reading or light-editing mode
- The supported Markdown subset is intentionally limited
- The team accepts that mode switching crosses serialization boundaries

It is a risky option if:

- Users will heavily edit in all three modes
- Fidelity across mode switches must be exact
- The product roadmap includes advanced Markdown syntax or custom authoring features

The core problem is that this approach creates two editing models over one document: a text editor model and a rich-text editor model. That is possible, but it is no longer a simple editor decision. It becomes an integration architecture with its own maintenance cost.

## Recommendation

If the product priority is:

- long-term Markdown fidelity
- extensibility
- predictable behavior across advanced syntax
- one canonical model

choose `v6-codemirror`.

If the product priority is:

- the strongest possible markup-free `Formatted` experience
- toolbar-driven rich-text editing
- accepting some conversion complexity

then `v7-quill` becomes more compelling.

If the product must support all three modes and `Formatted` must feel first-class, the honest answer is:

- CodeMirror is the better strategic base
- Quill is the better native formatted editor
- a mixed architecture is possible, but only if the team explicitly accepts conversion risk and extra maintenance complexity

## Sources

- https://codemirror.net/docs/
- https://codemirror.net/docs/ref/#lang-markdown
- https://codemirror.net/examples/collab/
- https://v2.quilljs.com/docs/quickstart
- https://v2.quilljs.com/docs/formats/
