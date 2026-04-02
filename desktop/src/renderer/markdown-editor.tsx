import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Compartment, EditorSelection, EditorState, RangeSetBuilder } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import {
  Decoration,
  EditorView,
  keymap,
  placeholder,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import {
  Bold,
  Code2,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
} from "lucide-react";

interface MarkdownEditResult {
  selectionEnd: number;
  selectionStart: number;
  text: string;
}

interface InternalLinkSelection {
  target: string;
}

const hiddenSyntax = Decoration.replace({});
const strongMark = Decoration.mark({ class: "cm-md-strong" });
const emphasisMark = Decoration.mark({ class: "cm-md-emphasis" });
const strikethroughMark = Decoration.mark({ class: "cm-md-strikethrough" });
const inlineCodeMark = Decoration.mark({ class: "cm-md-inline-code" });
const linkMark = Decoration.mark({ class: "cm-md-link" });
const imageAltMark = Decoration.mark({ class: "cm-md-image-alt" });
const searchHighlightMark = Decoration.mark({ class: "cm-search-highlight" });

const markdownPresentation = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildMarkdownDecorations(view);
  }

  update(update: ViewUpdate) {
    if (!update.docChanged && !update.viewportChanged) {
      return;
    }

    this.decorations = buildMarkdownDecorations(update.view);
  }
}, {
  decorations: (value) => value.decorations,
  provide: (plugin) => EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
});

class HorizontalRuleWidget extends WidgetType {
  toDOM() {
    const element = document.createElement("div");
    element.className = "cm-md-horizontal-rule";
    return element;
  }
}

export function RichTextEditor({
  dataTestId,
  highlightQuery,
  markdown,
  onChange,
  onInternalLinkOpen,
  onSurfaceFocus,
  onTitleChange,
  sourceRelativePath,
  title,
}: {
  dataTestId?: string;
  highlightQuery?: string;
  markdown: string;
  onChange: (markdown: string) => void;
  onInternalLinkOpen?: (selection: InternalLinkSelection) => void;
  onSurfaceFocus?: () => void;
  onTitleChange: (title: string) => void;
  sourceRelativePath?: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const latestMarkdownRef = useRef(markdown);
  const isApplyingExternalUpdateRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const searchHighlightCompartmentRef = useRef(new Compartment());

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || viewRef.current) {
      return;
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: markdown,
        extensions: [
          history(),
          keymap.of([
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          markdownLanguage(),
          EditorView.lineWrapping,
          markdownPresentation,
          searchHighlightCompartmentRef.current.of(createSearchHighlightExtension(highlightQuery ?? "")),
          EditorView.contentAttributes.of({
            "aria-label": "Document body",
            "data-testid": "rich-text-editor",
          }),
          placeholder("Start writing your note"),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || isApplyingExternalUpdateRef.current) {
              return;
            }

            const nextMarkdown = update.state.doc.toString();
            latestMarkdownRef.current = nextMarkdown;
            onChangeRef.current(nextMarkdown);
          }),
          EditorView.domEventHandlers({
            focus: () => {
              onSurfaceFocus?.();
            },
            mousedown: (event, view) => {
              if (!(event.metaKey || event.ctrlKey) || !onInternalLinkOpen || !sourceRelativePath) {
                return false;
              }

              const position = view.posAtCoords({
                x: event.clientX,
                y: event.clientY,
              });

              if (position === null) {
                return false;
              }

              const selection = getInternalLinkAtPosition(view.state.doc.toString(), position);

              if (!selection) {
                return false;
              }

              event.preventDefault();
              onInternalLinkOpen(selection);
              return true;
            },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    latestMarkdownRef.current = markdown;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;

    if (!view || latestMarkdownRef.current === markdown) {
      return;
    }

    isApplyingExternalUpdateRef.current = true;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: markdown,
      },
      selection: EditorSelection.cursor(Math.min(markdown.length, view.state.selection.main.head)),
    });
    isApplyingExternalUpdateRef.current = false;
    latestMarkdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: searchHighlightCompartmentRef.current.reconfigure(
        createSearchHighlightExtension(highlightQuery ?? ""),
      ),
    });
  }, [highlightQuery]);

  useEffect(() => {
    resizeTitleInput(titleInputRef.current);
  }, [title]);

  const runToolbarAction = (transform: (text: string, from: number, to: number) => MarkdownEditResult) => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const { from, to } = view.state.selection.main;
    const nextState = transform(view.state.doc.toString(), from, to);

    applyMarkdownEdit(view, nextState);
  };

  return (
    <section className="editor-surface" data-testid={dataTestId}>
      <div className="editor-toolbar">
        <div className="toolbar-actions">
          <div className="toolbar-group">
            <ToolbarButton label="Heading 1" onClick={() => runToolbarAction((value, from, to) => applyHeading(value, from, to, 1))}>
              H1
            </ToolbarButton>
            <ToolbarButton label="Heading 2" onClick={() => runToolbarAction((value, from, to) => applyHeading(value, from, to, 2))}>
              H2
            </ToolbarButton>
            <ToolbarButton label="Heading 3" onClick={() => runToolbarAction((value, from, to) => applyHeading(value, from, to, 3))}>
              H3
            </ToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Bold" onClick={() => runToolbarAction((value, from, to) => applyInlineWrap(value, from, to, "**"))}>
              <Bold aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Italic" onClick={() => runToolbarAction((value, from, to) => applyInlineWrap(value, from, to, "*"))}>
              <Italic aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Strikethrough" onClick={() => runToolbarAction((value, from, to) => applyInlineWrap(value, from, to, "~~"))}>
              <Strikethrough aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Inline code" onClick={() => runToolbarAction((value, from, to) => applyInlineWrap(value, from, to, "`"))}>
              <Code2 aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Block quote" onClick={() => runToolbarAction(applyBlockQuote)}>
              <Quote aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Bulleted list" onClick={() => runToolbarAction(applyBulletList)}>
              <List aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Numbered list" onClick={() => runToolbarAction(applyOrderedList)}>
              <ListOrdered aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Code block" onClick={() => runToolbarAction(applyCodeBlock)}>
              <SquareCode aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton
              label="Link"
              onClick={() => {
                const url = window.prompt("Enter a URL");

                if (!url) {
                  return;
                }

                runToolbarAction((value, from, to) => applyLink(value, from, to, url));
              }}
            >
              <Link2 aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton
              label="Image"
              onClick={() => {
                const url = window.prompt("Enter an image URL");

                if (!url) {
                  return;
                }

                runToolbarAction((value, from, to) => applyImage(value, from, to, url));
              }}
            >
              <Image aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Horizontal rule" onClick={() => runToolbarAction(applyHorizontalRule)}>
              <Minus aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Clear formatting" onClick={() => runToolbarAction(applyClearFormatting)}>
              <RemoveFormatting aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
          </div>
        </div>
      </div>

      <div className="editor-surface__header">
        <textarea
          aria-label="Document title"
          className="editor-surface__title-input"
          onChange={(event) => {
            onTitleChange(event.target.value);
          }}
          onInput={(event) => {
            resizeTitleInput(event.currentTarget);
          }}
          ref={titleInputRef}
          rows={1}
          value={title}
        />
      </div>

      <div className="markdown-editor-frame">
        <div className="markdown-editor" ref={containerRef} />
      </div>
    </section>
  );
}

export function getInternalLinkAtPosition(
  markdown: string,
  position: number,
): InternalLinkSelection | null {
  const markdownPattern = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/gu;
  const wikiPattern = /\[\[([^[\]]+)\]\]/gu;

  for (const match of markdown.matchAll(markdownPattern)) {
    const fullMatch = match[0];
    const label = match[1] ?? "";
    const target = match[2]?.trim();
    const matchStart = match.index ?? 0;
    const labelStart = matchStart + 1;
    const labelEnd = labelStart + label.length;

    if (target && position >= labelStart && position <= labelEnd) {
      return { target };
    }

    if (position >= matchStart && position <= matchStart + fullMatch.length && target) {
      return { target };
    }
  }

  for (const match of markdown.matchAll(wikiPattern)) {
    const fullMatch = match[0];
    const rawValue = match[1]?.trim();
    const matchStart = match.index ?? 0;
    const innerStart = matchStart + 2;
    const innerEnd = innerStart + (rawValue?.length ?? 0);

    if (!rawValue || position < innerStart || position > innerEnd) {
      continue;
    }

    const [target] = rawValue.split("|", 1);

    if (target?.trim()) {
      return { target: target.trim() };
    }

    if (position <= matchStart + fullMatch.length) {
      return { target: rawValue };
    }
  }

  return null;
}

function resizeTitleInput(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = "0";
  element.style.height = `${element.scrollHeight}px`;
}

function applyMarkdownEdit(view: EditorView, nextState: MarkdownEditResult) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: nextState.text,
    },
    selection: EditorSelection.range(
      clampSelection(nextState.selectionStart, nextState.text.length),
      clampSelection(nextState.selectionEnd, nextState.text.length),
    ),
  });
  view.focus();
}

function clampSelection(value: number, textLength: number) {
  return Math.max(0, Math.min(value, textLength));
}

function buildMarkdownDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const document = view.state.doc;
  let inCodeBlock = false;
  let firstCodeLine = 0;

  for (let lineNumber = 1; lineNumber <= document.lines; lineNumber += 1) {
    const line = document.line(lineNumber);
    const nextLine = lineNumber < document.lines ? document.line(lineNumber + 1) : null;
    const fenceMatch = line.text.match(/^\s*```/u);

    if (fenceMatch) {
      builder.add(line.from, line.from, Decoration.line({ class: "cm-md-code-fence" }));

      if (line.from !== line.to) {
        builder.add(line.from, line.to, hiddenSyntax);
      }

      inCodeBlock = !inCodeBlock;
      firstCodeLine = inCodeBlock ? lineNumber + 1 : 0;
      continue;
    }

    if (inCodeBlock) {
      const nextLineText = lineNumber < document.lines ? document.line(lineNumber + 1).text : "";
      const classes = ["cm-md-code-line"];

      if (lineNumber === firstCodeLine) {
        classes.push("cm-md-code-line-start");
      }

      if (/^\s*```/u.test(nextLineText) || lineNumber === document.lines) {
        classes.push("cm-md-code-line-end");
      }

      builder.add(line.from, line.from, Decoration.line({ class: classes.join(" ") }));
      continue;
    }

    if (line.text.trim().length === 0) {
      continue;
    }

    const nextSetextMatch = nextLine !== null && getMarkdownLineKind(line.text) === "paragraph"
      ? nextLine.text.match(/^\s{0,3}(=+|-+)\s*$/u)
      : null;

    if (nextSetextMatch) {
      builder.add(
        line.from,
        line.from,
        Decoration.line({
          class: `cm-md-heading cm-md-heading-${nextSetextMatch[1][0] === "=" ? 1 : 2}`,
        }),
      );
    }

    const setextMatch = line.text.match(/^\s{0,3}(=+|-+)\s*$/u);

    if (setextMatch && lineNumber > 1) {
      const previousLine = document.line(lineNumber - 1);

      if (getMarkdownLineKind(previousLine.text) === "paragraph") {
        builder.add(line.from, line.from, Decoration.line({ class: "cm-md-setext-underline" }));

        if (line.from !== line.to) {
          builder.add(line.from, line.to, hiddenSyntax);
        }

        continue;
      }
    }

    addLineDecorations(
      builder,
      line.from,
      line.text,
      lineNumber < document.lines ? document.line(lineNumber + 1).text : null,
    );
    addInlineDecorations(builder, line.from, line.text);
  }

  return builder.finish();
}

function createSearchHighlightExtension(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return [];
  }

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildSearchHighlightDecorations(view.state.doc.toString(), normalizedQuery);
    }

    update(update: ViewUpdate) {
      if (!update.docChanged && !update.viewportChanged) {
        return;
      }

      this.decorations = buildSearchHighlightDecorations(update.view.state.doc.toString(), normalizedQuery);
    }
  }, {
    decorations: (value) => value.decorations,
  });
}

function buildSearchHighlightDecorations(markdown: string, normalizedQuery: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const normalizedMarkdown = markdown.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < normalizedMarkdown.length) {
    const matchIndex = normalizedMarkdown.indexOf(normalizedQuery, searchIndex);

    if (matchIndex < 0) {
      break;
    }

    builder.add(matchIndex, matchIndex + normalizedQuery.length, searchHighlightMark);
    searchIndex = matchIndex + normalizedQuery.length;
  }

  return builder.finish();
}

type MarkdownLineKind = "blank" | "code" | "heading" | "list" | "paragraph" | "quote" | "rule" | "table";

function getMarkdownLineKind(lineText: string): MarkdownLineKind {
  const trimmedLine = lineText.trim();

  if (trimmedLine.length === 0) {
    return "blank";
  }

  if (isFenceLine(trimmedLine)) {
    return "code";
  }

  if (/^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/u.test(lineText)) {
    return "rule";
  }

  if (/^>+\s*/u.test(trimmedLine)) {
    return "quote";
  }

  if (isMarkdownListLine(lineText)) {
    return "list";
  }

  if (/^\s{0,3}#{1,6}(?:\s+|$)/u.test(lineText) || /^\s{0,3}(=+|-+)\s*$/u.test(lineText)) {
    return "heading";
  }

  if (/^\|.*\|$/u.test(trimmedLine)) {
    return "table";
  }

  return "paragraph";
}

function isFenceLine(line: string): boolean {
  return /^```/u.test(line);
}

function isMarkdownListLine(lineText: string): boolean {
  return /^\s{0,3}(?:[-*+](?:\s+|$)|\d+\.(?:\s+|$)|[-*+]\s+\[(?: |x|X)\](?:\s+|$))/u.test(lineText);
}

function addLineDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineFrom: number,
  lineText: string,
  nextLineText: string | null,
) {
  const nextLineIsList = nextLineText !== null && getMarkdownLineKind(nextLineText) === "list";
  const headingMatch = lineText.match(/^(\s{0,3})(#{1,6})(\s+|$)/u);

  if (headingMatch) {
    const prefixStart = lineFrom + headingMatch[1].length;
    const prefixEnd = prefixStart + headingMatch[2].length + headingMatch[3].length;

    builder.add(lineFrom, lineFrom, Decoration.line({ class: `cm-md-heading cm-md-heading-${headingMatch[2].length}` }));
    builder.add(prefixStart, prefixEnd, hiddenSyntax);
  }

  const horizontalRuleMatch = lineText.match(/^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/u);

  if (horizontalRuleMatch) {
    builder.add(
      lineFrom,
      lineFrom + lineText.length,
      Decoration.replace({
        widget: new HorizontalRuleWidget(),
        block: true,
      }),
    );
    return;
  }

  const taskListMatch = lineText.match(/^([-*+])\s+\[( |x|X)\]\s+/u);

  if (taskListMatch) {
    builder.add(
      lineFrom,
      lineFrom,
      Decoration.line({
        attributes: {
          class: nextLineIsList ? "cm-md-task-item cm-md-list-item--continued" : "cm-md-task-item",
          "data-task-state": taskListMatch[2].trim() ? "checked" : "unchecked",
        },
      }),
    );
    builder.add(lineFrom, lineFrom + taskListMatch[0].length, hiddenSyntax);
    return;
  }

  const orderedListMatch = lineText.match(/^(\d+)\.\s+/u);

  if (orderedListMatch) {
    builder.add(
      lineFrom,
      lineFrom,
      Decoration.line({
        attributes: {
          class: nextLineIsList ? "cm-md-ordered-item cm-md-list-item--continued" : "cm-md-ordered-item",
          "data-list-marker": orderedListMatch[1],
        },
      }),
    );
    builder.add(lineFrom, lineFrom + orderedListMatch[0].length, hiddenSyntax);
  }

  const bulletListMatch = lineText.match(/^[-*+]\s+/u);

  if (bulletListMatch) {
    builder.add(
      lineFrom,
      lineFrom,
      Decoration.line({ class: nextLineIsList ? "cm-md-bullet-item cm-md-list-item--continued" : "cm-md-bullet-item" }),
    );
    builder.add(lineFrom, lineFrom + bulletListMatch[0].length, hiddenSyntax);
  }

  const blockQuoteMatch = lineText.match(/^>+\s+/u);

  if (blockQuoteMatch) {
    builder.add(lineFrom, lineFrom, Decoration.line({ class: "cm-md-blockquote" }));
    builder.add(lineFrom, lineFrom + blockQuoteMatch[0].length, hiddenSyntax);
  }
}

function addInlineDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineFrom: number,
  lineText: string,
) {
  addWrappedRanges(builder, lineFrom, lineText, /!\[([^\]]*)\]\(([^)]+)\)/gu, 2, imageAltMark);
  addWrappedRanges(builder, lineFrom, lineText, /(?<!!)\[([^\]]+)\]\(([^)]+)\)/gu, 1, linkMark);
  addInlineCodeDecorations(builder, lineFrom, lineText);
  addWrappedRanges(builder, lineFrom, lineText, /~~([^~\n]+)~~/gu, 2, strikethroughMark);
  addWrappedRanges(builder, lineFrom, lineText, /\*\*([^*\n]+)\*\*/gu, 2, strongMark);
  addWrappedRanges(builder, lineFrom, lineText, /__([^_\n]+)__/gu, 2, strongMark);
  addWrappedRanges(builder, lineFrom, lineText, /(?<!\*)\*([^*\n]+)\*(?!\*)/gu, 1, emphasisMark);
  addWrappedRanges(builder, lineFrom, lineText, /(?<!_)_([^_\n]+)_(?!_)/gu, 1, emphasisMark);
}

function addInlineCodeDecorations(
  builder: RangeSetBuilder<Decoration>,
  lineFrom: number,
  lineText: string,
) {
  const inlineCodePattern = /(`+)([^`\n]+?)\1/gu;

  for (const match of lineText.matchAll(inlineCodePattern)) {
    const fullMatch = match[0];
    const delimiter = match[1] ?? "`";
    const content = match[2] ?? "";
    const start = lineFrom + (match.index ?? 0);
    const contentStart = start + delimiter.length;
    const contentEnd = contentStart + content.length;
    const end = start + fullMatch.length;

    if (content.length === 0) {
      continue;
    }

    builder.add(start, contentStart, hiddenSyntax);
    builder.add(contentStart, contentEnd, inlineCodeMark);
    builder.add(contentEnd, end, hiddenSyntax);
  }
}

function addWrappedRanges(
  builder: RangeSetBuilder<Decoration>,
  lineFrom: number,
  lineText: string,
  pattern: RegExp,
  delimiterLength: number,
  mark: Decoration,
) {
  for (const match of lineText.matchAll(pattern)) {
    const fullMatch = match[0];
    const content = match[1] ?? "";
    const start = lineFrom + (match.index ?? 0);
    const contentStart = start + delimiterLength;
    const contentEnd = contentStart + content.length;
    const end = start + fullMatch.length;

    builder.add(start, contentStart, hiddenSyntax);
    builder.add(contentStart, contentEnd, mark);
    builder.add(contentEnd, end, hiddenSyntax);
  }
}

export function applyInlineWrap(text: string, from: number, to: number, marker: string): MarkdownEditResult {
  if (
    from !== to &&
    from >= marker.length &&
    text.slice(from - marker.length, from) === marker &&
    text.slice(to, to + marker.length) === marker
  ) {
    return replaceRange(
      text,
      from - marker.length,
      to + marker.length,
      text.slice(from, to),
      from - marker.length,
      to - marker.length,
    );
  }

  if (from === to) {
    return replaceRange(text, from, to, `${marker}${marker}`, from + marker.length, from + marker.length);
  }

  return replaceRange(
    text,
    from,
    to,
    `${marker}${text.slice(from, to)}${marker}`,
    from + marker.length,
    to + marker.length,
  );
}

export function applyHeading(text: string, from: number, to: number, level: 1 | 2 | 3): MarkdownEditResult {
  const marker = `${"#".repeat(level)} `;
  const { blockFrom, blockTo, lines } = getLineSelection(text, from, to);
  const nextLines = lines.every((line) => line.startsWith(marker))
    ? lines.map((line) => line.slice(marker.length))
    : lines.map((line) => `${marker}${line.replace(/^\s{0,3}#{1,6}\s+/u, "")}`);

  return replaceRange(text, blockFrom, blockTo, nextLines.join("\n"), blockFrom, blockFrom + nextLines.join("\n").length);
}

export function applyBlockQuote(text: string, from: number, to: number): MarkdownEditResult {
  const { blockFrom, blockTo, lines } = getLineSelection(text, from, to);
  const nextLines = lines.every((line) => line.startsWith("> "))
    ? lines.map((line) => line.replace(/^> /u, ""))
    : lines.map((line) => `> ${line}`);

  return replaceRange(text, blockFrom, blockTo, nextLines.join("\n"), blockFrom, blockFrom + nextLines.join("\n").length);
}

export function applyBulletList(text: string, from: number, to: number): MarkdownEditResult {
  const { blockFrom, blockTo, lines } = getLineSelection(text, from, to);
  const nextLines = lines.every((line) => line.startsWith("- "))
    ? lines.map((line) => line.replace(/^- /u, ""))
    : lines.map((line) => `- ${stripListMarker(line)}`);

  return replaceRange(text, blockFrom, blockTo, nextLines.join("\n"), blockFrom, blockFrom + nextLines.join("\n").length);
}

export function applyOrderedList(text: string, from: number, to: number): MarkdownEditResult {
  const { blockFrom, blockTo, lines } = getLineSelection(text, from, to);
  const alreadyOrdered = lines.every((line, index) => line.startsWith(`${index + 1}. `));
  const nextLines = alreadyOrdered
    ? lines.map((line) => line.replace(/^\d+\. /u, ""))
    : lines.map((line, index) => `${index + 1}. ${stripListMarker(line)}`);

  return replaceRange(text, blockFrom, blockTo, nextLines.join("\n"), blockFrom, blockFrom + nextLines.join("\n").length);
}

export function applyCodeBlock(text: string, from: number, to: number): MarkdownEditResult {
  if (from === to) {
    return replaceRange(text, from, to, "```\n\n```", from + 4, from + 4);
  }

  const selection = text.slice(from, to);
  const fencedMatch = selection.match(/^```[^\n]*\n([\s\S]*?)\n```$/u);

  if (fencedMatch) {
    return replaceRange(text, from, to, fencedMatch[1], from, from + fencedMatch[1].length);
  }

  return replaceRange(text, from, to, `\`\`\`\n${selection}\n\`\`\``, from + 4, from + 4 + selection.length);
}

export function applyLink(text: string, from: number, to: number, url: string): MarkdownEditResult {
  const selectedText = text.slice(from, to);
  const label = selectedText || url;
  const nextValue = `[${label}](${url})`;

  return replaceRange(text, from, to, nextValue, from + nextValue.length, from + nextValue.length);
}

export function applyImage(text: string, from: number, to: number, url: string): MarkdownEditResult {
  const selectedText = text.slice(from, to);
  const altText = selectedText || "image";
  const nextValue = `![${altText}](${url})`;

  return replaceRange(text, from, to, nextValue, from + nextValue.length, from + nextValue.length);
}

export function applyHorizontalRule(text: string, from: number, to: number): MarkdownEditResult {
  const prefix = getLeadingSpacing(text, from);
  const suffix = getTrailingSpacing(text, to);
  const nextValue = `${prefix}---${suffix}`;
  const nextCursor = from + nextValue.length;

  return replaceRange(text, from, to, nextValue, nextCursor, nextCursor);
}

export function applyClearFormatting(text: string, from: number, to: number): MarkdownEditResult {
  const target = from === to ? getLineSelection(text, from, to) : { blockFrom: from, blockTo: to, lines: [] };
  const selection = text.slice(target.blockFrom, target.blockTo);
  const nextValue = selection
    .replace(/^```[^\n]*\n?/gmu, "")
    .replace(/\n```$/gmu, "")
    .replace(/^(?:\s{0,3}#{1,6}\s+|> ?|[-*+]\s+\[(?: |x|X)\]\s+|[-*+]\s+|\d+\.\s+)/gmu, "")
    .replace(/^\s{0,3}(?:=+|-{2,})\s*$/gmu, "")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gu, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1")
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/__([^_]+)__/gu, "$1")
    .replace(/\*([^*\n]+)\*/gu, "$1")
    .replace(/_([^_\n]+)_/gu, "$1")
    .replace(/~~([^~]+)~~/gu, "$1");

  return replaceRange(
    text,
    target.blockFrom,
    target.blockTo,
    nextValue,
    target.blockFrom,
    target.blockFrom + nextValue.length,
  );
}

function getLineSelection(text: string, from: number, to: number) {
  const safeEnd = to > from ? to - 1 : to;
  const blockFrom = text.lastIndexOf("\n", Math.max(0, from - 1)) + 1;
  const nextNewline = text.indexOf("\n", safeEnd);
  const blockTo = nextNewline === -1 ? text.length : nextNewline;
  const lines = text.slice(blockFrom, blockTo).split("\n");

  return {
    blockFrom,
    blockTo,
    lines,
  };
}

function replaceRange(
  text: string,
  from: number,
  to: number,
  nextValue: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEditResult {
  return {
    text: `${text.slice(0, from)}${nextValue}${text.slice(to)}`,
    selectionStart,
    selectionEnd,
  };
}

function stripListMarker(line: string) {
  return line.replace(/^(?:[-*+]\s+|\d+\.\s+)/u, "");
}

function getLeadingSpacing(text: string, from: number) {
  if (from === 0) {
    return "";
  }

  if (text.slice(0, from).endsWith("\n\n")) {
    return "";
  }

  return text[from - 1] === "\n" ? "\n" : "\n\n";
}

function getTrailingSpacing(text: string, to: number) {
  if (to === text.length) {
    return "";
  }

  if (text.slice(to).startsWith("\n\n")) {
    return "";
  }

  return text[to] === "\n" ? "\n" : "\n\n";
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="toolbar-button toolbar-button--text"
      onClick={onClick}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      type="button"
    >
      <span className="toolbar-button__text">{children}</span>
    </button>
  );
}

function IconToolbarButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="toolbar-button toolbar-button--icon"
      onClick={onClick}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      type="button"
    >
      {children}
    </button>
  );
}
