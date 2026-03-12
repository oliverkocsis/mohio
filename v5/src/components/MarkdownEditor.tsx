import { useEffect, useRef } from "react";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  placeholder,
} from "@codemirror/view";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onOpenLink: (relativePath: string) => void;
}

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "650", color: "var(--text-primary)" },
  { tag: [tags.emphasis, tags.strong], color: "var(--text-primary)" },
  { tag: [tags.link, tags.url], color: "var(--accent-link)", textDecoration: "underline" },
  { tag: [tags.quote, tags.comment], color: "var(--text-secondary)" },
  { tag: [tags.list, tags.separator], color: "var(--text-secondary)" },
  { tag: [tags.monospace, tags.contentSeparator], fontFamily: "IBM Plex Mono, ui-monospace, monospace" },
]);

export function MarkdownEditor({ value, onChange, onOpenLink }: MarkdownEditorProps) {
  const useFallbackEditor = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("jsdom");
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onOpenLinkRef = useRef(onOpenLink);

  if (useFallbackEditor) {
    const links = Array.from(value.matchAll(/\[[^\]]+\]\((\.{1,2}\/[^)\s]+\.md)\)/g));

    return (
      <div className="markdown-editor-host markdown-editor-fallback">
        <textarea
          aria-label="Markdown editor"
          className="markdown-editor-textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {links.length > 0 ? (
          <div className="editor-link-list">
            {links.map((link, index) => (
              <button
                key={`${link[1]}-${index}`}
                className="editor-link-chip"
                type="button"
                data-markdown-path={link[1]}
                onClick={() => onOpenLink(link[1])}
              >
                {link[0]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  useEffect(() => {
    onChangeRef.current = onChange;
    onOpenLinkRef.current = onOpenLink;
  }, [onChange, onOpenLink]);

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        markdown(),
        syntaxHighlighting(markdownHighlightStyle),
        placeholder("Write Markdown directly. Changes save into the current session immediately."),
        markdownLinkExtension((path) => onOpenLinkRef.current(path)),
        editorTheme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          "aria-label": "Markdown editor",
          spellcheck: "true",
        }),
        updateListener,
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
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();
    if (currentValue === value) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value,
      },
    });
  }, [value]);

  return <div className="markdown-editor-host" ref={hostRef} />;
}

function markdownLinkExtension(onOpenLink: (path: string) => void) {
  const matcher = /\[[^\]]+\]\((\.{1,2}\/[^)\s]+\.md)\)/g;

  const linkPlugin = ViewPlugin.fromClass(
    class {
      decorations;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: { view: EditorView; docChanged: boolean; viewportChanged: boolean }) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        const content = view.state.doc.toString();

        for (const match of content.matchAll(matcher)) {
          const start = match.index ?? 0;
          builder.add(
            start,
            start + match[0].length,
            Decoration.mark({
              class: "cm-md-link",
              attributes: {
                "data-markdown-path": match[1],
              },
            }),
          );
        }

        return builder.finish();
      }
    },
    {
      decorations: (instance) => instance.decorations,
    },
  );

  return [
    linkPlugin,
    EditorView.domEventHandlers({
      click(event) {
        const target = event.target as HTMLElement | null;
        const link = target?.closest<HTMLElement>("[data-markdown-path]");
        const path = link?.dataset.markdownPath;
        if (!path) {
          return false;
        }

        event.preventDefault();
        onOpenLink(path);
        return true;
      },
    }),
  ];
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--bg-editor)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  ".cm-scroller": {
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif",
    fontSize: "18px",
    lineHeight: "31px",
    padding: "24px 0",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
    color: "var(--text-muted)",
    width: "18px",
  },
  ".cm-content": {
    padding: "0 24px 80px",
    color: "var(--text-primary)",
    caretColor: "var(--text-primary)",
  },
  ".cm-line": {
    padding: 0,
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(214, 207, 197, 0.65) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(247, 244, 239, 0.8)",
  },
  ".cm-md-link": {
    color: "var(--accent-link)",
    cursor: "pointer",
  },
  ".cm-md-link:hover": {
    textDecoration: "underline",
  },
  ".cm-md-link .cm-url, .cm-inline-code, .cm-monospace": {
    fontFamily: "IBM Plex Mono, ui-monospace, monospace",
  },
  ".cm-tooltip": {
    display: "none",
  },
});
