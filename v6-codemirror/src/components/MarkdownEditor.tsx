import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  drawSelection,
  Decoration,
  EditorView,
  highlightSpecialChars,
  keymap,
  placeholder,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import {
  applyToolbarAction,
  type TextSelection,
  type ToolbarAction,
} from "../lib/formatting";

export type EditorMode = "source" | "hybrid" | "formatted";

export interface MarkdownEditorHandle {
  focus: () => void;
  applyFormatting: (action: ToolbarAction) => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  mode: EditorMode;
}

const isJsdom =
  typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("jsdom");

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "700", color: "var(--editor-heading)" },
  { tag: [tags.heading2, tags.heading3, tags.heading4], fontWeight: "650", color: "var(--editor-heading)" },
  { tag: [tags.strong, tags.emphasis], color: "var(--editor-text)" },
  { tag: [tags.link, tags.url], color: "var(--editor-link)" },
  { tag: [tags.list, tags.quote], color: "var(--editor-muted)" },
  { tag: [tags.monospace, tags.contentSeparator], fontFamily: "var(--font-mono)", color: "var(--editor-code)" },
  { tag: tags.processingInstruction, color: "var(--editor-muted)" },
]);

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ value, onChange, ariaLabel, mode }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const onChangeRef = useRef(onChange);
    const pendingSelectionRef = useRef<TextSelection | null>(null);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useImperativeHandle(
      ref,
      () => ({
        focus() {
          if (isJsdom) {
            textareaRef.current?.focus();
            return;
          }

          viewRef.current?.focus();
        },
        applyFormatting(action) {
          if (isJsdom) {
            const textarea = textareaRef.current;
            if (!textarea) {
              return;
            }

            const result = applyToolbarAction(action, textarea.value, {
              from: textarea.selectionStart,
              to: textarea.selectionEnd,
            });
            pendingSelectionRef.current = result.selection;
            onChangeRef.current(result.text);
            return;
          }

          const view = viewRef.current;
          if (!view) {
            return;
          }

          const result = applyToolbarAction(action, view.state.doc.toString(), {
            from: view.state.selection.main.from,
            to: view.state.selection.main.to,
          });

          view.dispatch({
            changes: {
              from: 0,
              to: view.state.doc.length,
              insert: result.text,
            },
            selection: {
              anchor: result.selection.from,
              head: result.selection.to,
            },
          });
          view.focus();
        },
      }),
      [],
    );

    useEffect(() => {
      if (isJsdom || !hostRef.current) {
        return undefined;
      }

      const state = EditorState.create({
        doc: value,
        extensions: [
          highlightSpecialChars(),
          drawSelection(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          markdown(),
          ...(mode === "source"
            ? []
            : [
                syntaxHighlighting(markdownHighlightStyle),
                createMarkdownPresentation(mode),
              ]),
          placeholder("Start writing Markdown..."),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.editorAttributes.of({
            "data-editor-mode": mode,
          }),
          EditorView.contentAttributes.of({
            "aria-label": ariaLabel,
            spellcheck: "true",
          }),
          editorTheme,
        ],
      });

      const view = new EditorView({
        state,
        parent: hostRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, [ariaLabel, mode]);

    useEffect(() => {
      if (isJsdom) {
        return;
      }

      const view = viewRef.current;
      if (!view) {
        return;
      }

      const current = view.state.doc.toString();
      if (current === value) {
        return;
      }

      view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: value,
        },
      });
    }, [value]);

    useLayoutEffect(() => {
      if (!isJsdom) {
        return;
      }

      const textarea = textareaRef.current;
      const pendingSelection = pendingSelectionRef.current;
      if (!textarea || !pendingSelection) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(pendingSelection.from, pendingSelection.to);
      pendingSelectionRef.current = null;
    }, [value]);

    if (isJsdom) {
      return (
        <textarea
          ref={textareaRef}
          aria-label={ariaLabel}
          className="markdown-textarea"
          data-editor-mode={mode}
          spellCheck="true"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }

    return <div className="markdown-editor-host" ref={hostRef} />;
  },
);

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontFamily: "var(--font-body)",
    backgroundColor: "transparent",
    color: "var(--editor-text)",
  },
  ".cm-scroller": {
    minHeight: "100%",
    padding: "32px 0 64px",
  },
  ".cm-content": {
    padding: "0 40px",
    caretColor: "var(--editor-text)",
    fontSize: "18px",
    lineHeight: "1.8",
  },
  ".cm-line": {
    padding: 0,
  },
  "&[data-editor-mode='source'] .cm-content": {
    fontFamily: "var(--font-mono)",
    fontSize: "16px",
    lineHeight: "1.72",
    color: "var(--text-strong)",
  },
  ".cm-line.cm-heading-1": {
    paddingTop: "28px",
    paddingBottom: "12px",
    fontSize: "2.4rem",
    lineHeight: "1.12",
    letterSpacing: "-0.04em",
    fontWeight: "800",
    color: "var(--editor-heading)",
  },
  ".cm-line.cm-heading-2": {
    paddingTop: "22px",
    paddingBottom: "10px",
    fontSize: "1.65rem",
    lineHeight: "1.28",
    letterSpacing: "-0.03em",
    fontWeight: "760",
    color: "var(--editor-heading)",
  },
  ".cm-line.cm-list-line": {
    lineHeight: "1.75",
    color: "var(--editor-text)",
  },
  "&[data-editor-mode='hybrid'] .cm-line.cm-list-line": {
    paddingLeft: "1.8rem",
    textIndent: "-1.15rem",
  },
  "&[data-editor-mode='formatted'] .cm-line.cm-list-line": {
    position: "relative",
    paddingLeft: "1.8rem",
    textIndent: 0,
  },
  "&[data-editor-mode='formatted'] .cm-line.cm-bullet-line::before": {
    content: '"•"',
    position: "absolute",
    left: "0.35rem",
    color: "var(--editor-marker)",
    fontWeight: "800",
  },
  "&[data-editor-mode='formatted'] .cm-line.cm-numbered-line": {
    paddingLeft: "1.1rem",
  },
  ".cm-line.cm-bullet-line": {
    paddingTop: "3px",
    paddingBottom: "3px",
  },
  ".cm-line.cm-numbered-line": {
    paddingTop: "3px",
    paddingBottom: "3px",
  },
  ".cm-line.cm-quote-line": {
    marginTop: "14px",
    marginBottom: "14px",
    padding: "10px 0 10px 20px",
    borderLeft: "3px solid var(--quote-rule)",
    backgroundColor: "var(--quote-bg)",
    color: "var(--editor-quote)",
    fontStyle: "italic",
    lineHeight: "1.75",
  },
  ".cm-formatting-heading": {
    fontSize: "0.52em",
    fontWeight: "700",
    letterSpacing: "0.06em",
    opacity: "0.42",
    verticalAlign: "0.16em",
  },
  ".cm-formatting-list": {
    color: "var(--editor-marker)",
    fontWeight: "700",
  },
  ".cm-formatting-quote": {
    color: "var(--editor-marker)",
    fontWeight: "800",
  },
  ".cm-formatted-link-label": {
    color: "var(--editor-link)",
    textDecoration: "underline",
    textUnderlineOffset: "0.16em",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "var(--selection-bg) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--editor-text)",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
});

function createMarkdownPresentation(mode: Exclude<EditorMode, "source">) {
  return ViewPlugin.fromClass(
    class {
      decorations;

      constructor(view: EditorView) {
        this.decorations = buildMarkdownDecorations(view, mode);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = buildMarkdownDecorations(update.view, mode);
        }
      }
    },
    {
      decorations: (instance) => instance.decorations,
    },
  );
}

function buildMarkdownDecorations(
  view: EditorView,
  mode: Exclude<EditorMode, "source">,
) {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    let line = view.state.doc.lineAt(from);

    while (true) {
      addLineDecorations(builder, line.from, line.text, mode);
      if (mode === "formatted") {
        addFormattedInlineDecorations(builder, line.from, line.text);
      }

      if (line.to >= to || line.number === view.state.doc.lines) {
        break;
      }

      line = view.state.doc.line(line.number + 1);
    }
  }

  return builder.finish();
}

function addLineDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineStart: number,
  text: string,
  mode: Exclude<EditorMode, "source">,
) {
  const headingOne = text.match(/^\s*#\s+/);
  const headingTwo = text.match(/^\s*##\s+/);
  const bullet = text.match(/^\s*[-+*]\s+/);
  const numbered = text.match(/^\s*\d+\.\s+/);
  const quote = text.match(/^\s*>\s+/);

  if (headingOne) {
    builder.add(
      lineStart,
      lineStart,
      Decoration.line({ attributes: { class: "cm-heading-1" } }),
    );
    addLineMarkerDecoration(builder, lineStart, headingOne[0].length, mode, "cm-formatting-heading");
    return;
  }

  if (headingTwo) {
    builder.add(
      lineStart,
      lineStart,
      Decoration.line({ attributes: { class: "cm-heading-2" } }),
    );
    addLineMarkerDecoration(builder, lineStart, headingTwo[0].length, mode, "cm-formatting-heading");
    return;
  }

  if (bullet) {
    builder.add(
      lineStart,
      lineStart,
      Decoration.line({ attributes: { class: "cm-list-line cm-bullet-line" } }),
    );
    addLineMarkerDecoration(builder, lineStart, bullet[0].length, mode, "cm-formatting-list");
    return;
  }

  if (numbered) {
    builder.add(
      lineStart,
      lineStart,
      Decoration.line({ attributes: { class: "cm-list-line cm-numbered-line" } }),
    );
    if (mode === "hybrid") {
      builder.add(
        lineStart,
        lineStart + numbered[0].length,
        Decoration.mark({ class: "cm-formatting-list" }),
      );
    }
    return;
  }

  if (quote) {
    builder.add(
      lineStart,
      lineStart,
      Decoration.line({ attributes: { class: "cm-quote-line" } }),
    );
    addLineMarkerDecoration(builder, lineStart, quote[0].length, mode, "cm-formatting-quote");
  }
}

function addLineMarkerDecoration(
  builder: RangeSetBuilder<Decoration>,
  lineStart: number,
  markerLength: number,
  mode: Exclude<EditorMode, "source">,
  className: string,
) {
  if (mode === "formatted") {
    builder.add(lineStart, lineStart + markerLength, Decoration.replace({}));
    return;
  }

  builder.add(
    lineStart,
    lineStart + markerLength,
    Decoration.mark({ class: className }),
  );
}

function addFormattedInlineDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineStart: number,
  text: string,
) {
  addPairedDelimiterDecorations(builder, lineStart, text, /\*\*([^*\n]+)\*\*/g, 2, 2);
  addPairedDelimiterDecorations(builder, lineStart, text, /(?<!\*)\*([^*\n]+)\*(?!\*)/g, 1, 1);
  addPairedDelimiterDecorations(builder, lineStart, text, /`([^`\n]+)`/g, 1, 1);
  addFormattedLinkDecorations(builder, lineStart, text);
}

function addPairedDelimiterDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineStart: number,
  text: string,
  matcher: RegExp,
  openLength: number,
  closeLength: number,
) {
  for (const match of text.matchAll(matcher)) {
    const actualStart = lineStart + (match.index ?? 0);
    const actualEnd = actualStart + match[0].length;

    builder.add(actualStart, actualStart + openLength, Decoration.replace({}));
    builder.add(actualEnd - closeLength, actualEnd, Decoration.replace({}));
  }
}

function addFormattedLinkDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineStart: number,
  text: string,
) {
  const matcher = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const match of text.matchAll(matcher)) {
    const matchStart = lineStart + (match.index ?? 0);
    const label = match[1];
    const fullMatch = match[0];
    const labelStart = matchStart + 1;
    const labelEnd = labelStart + label.length;

    builder.add(matchStart, matchStart + 1, Decoration.replace({}));
    builder.add(
      labelStart,
      labelEnd,
      Decoration.mark({ class: "cm-formatted-link-label" }),
    );
    builder.add(
      labelEnd,
      matchStart + fullMatch.length,
      Decoration.replace({}),
    );
  }
}
