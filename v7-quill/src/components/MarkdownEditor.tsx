import { useEffect, useMemo, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.core.css";
import { htmlToMarkdown, markdownToHtml } from "../lib/markdown";
import {
  EditorToolbar,
  EMPTY_FORMATS,
  type ActiveFormats,
  type EditorMode,
  type ToolbarAction,
} from "./EditorToolbar";

interface MarkdownEditorProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  value: string;
  onChange: (value: string) => void;
}

interface TextTransformResult {
  nextValue: string;
  selectionStart: number;
  selectionEnd: number;
}

interface EditorRange {
  index: number;
  length: number;
}

export function MarkdownEditor({ mode, onModeChange, value, onChange }: MarkdownEditorProps) {
  const isFallbackEditor =
    typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("jsdom");

  const hostRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastSerializedRef = useRef(normalizeEditorValue(value));
  const selectionRef = useRef<EditorRange | null>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(EMPTY_FORMATS);

  const normalizedValue = useMemo(() => normalizeEditorValue(value), [value]);

  useEffect(() => {
    if (isFallbackEditor || !hostRef.current) {
      return undefined;
    }

    const quill = new Quill(hostRef.current, {
      modules: {
        toolbar: false,
        history: {
          delay: 300,
          maxStack: 100,
          userOnly: true,
        },
      },
      placeholder: "Write your document...",
      theme: undefined,
    });

    hydrateQuill(quill, normalizedValue, mode);
    quill.focus();
    quill.setSelection(0, 0, "silent");
    syncFormatsForMode(quill, normalizedValue, { index: 0, length: 0 }, mode, setActiveFormats);

    const handleTextChange = (_delta: unknown, _oldDelta: unknown, source: string) => {
      if (source === "silent") {
        return;
      }

      const nextMarkdown = serializeQuill(quill, mode);
      const selection = quill.getSelection();
      applyModePresentation(quill, nextMarkdown, mode, selection);
      lastSerializedRef.current = nextMarkdown;
      onChange(nextMarkdown);
      syncFormatsForMode(quill, nextMarkdown, selection, mode, setActiveFormats);
    };

    const handleSelectionChange = (range: EditorRange | null) => {
      selectionRef.current = range;
      syncFormatsForMode(quill, serializeQuill(quill, mode), range, mode, setActiveFormats);
    };

    quill.on("text-change", handleTextChange);
    quill.on("selection-change", handleSelectionChange);
    quillRef.current = quill;

    return () => {
      quill.off("text-change", handleTextChange);
      quill.off("selection-change", handleSelectionChange);
      quillRef.current = null;
    };
  }, [isFallbackEditor, mode, onChange]);

  useEffect(() => {
    if (isFallbackEditor) {
      setActiveFormats(getTextareaFormats(value, textareaRef.current?.selectionStart ?? 0, textareaRef.current?.selectionEnd ?? 0));
      return;
    }

    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    if (normalizedValue === lastSerializedRef.current) {
      return;
    }

    const selection = quill.getSelection();
    hydrateQuill(quill, normalizedValue, mode);
    if (selection) {
      const nextLength = quill.getLength();
      const safeIndex = Math.min(selection.index, Math.max(nextLength - 1, 0));
      quill.setSelection(safeIndex, selection.length, "silent");
    }
    lastSerializedRef.current = normalizedValue;
    syncFormatsForMode(quill, normalizedValue, selection, mode, setActiveFormats);
  }, [isFallbackEditor, mode, normalizedValue, value]);

  function handleAction(action: ToolbarAction) {
    if (isFallbackEditor) {
      applyFallbackAction(action);
      return;
    }

    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    quill.focus();
    const range = quill.getSelection(true) ?? selectionRef.current;
    if (!range) {
      return;
    }

    if (mode === "formatted") {
      applyFormattedAction(quill, action, range);
      const nextMarkdown = serializeQuill(quill, mode);
      const nextSelection = quill.getSelection();
      lastSerializedRef.current = normalizeEditorValue(nextMarkdown);
      onChange(nextMarkdown);
      syncFormatsForMode(quill, nextMarkdown, nextSelection, mode, setActiveFormats);
      return;
    }

    const result = transformMarkdownSelection(getQuillValue(quill), range.index, range.index + range.length, action);
    updateQuillText(quill, result, mode);
    lastSerializedRef.current = normalizeEditorValue(result.nextValue);
    onChange(result.nextValue);
    syncFormatsForMode(
      quill,
      result.nextValue,
      {
        index: result.selectionStart,
        length: result.selectionEnd - result.selectionStart,
      },
      mode,
      setActiveFormats,
    );
  }

  function applyFallbackAction(action: ToolbarAction) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const result = transformMarkdownSelection(value, start, end, action);

    onChange(result.nextValue);
    lastSerializedRef.current = normalizeEditorValue(result.nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
      setActiveFormats(getTextareaFormats(result.nextValue, result.selectionStart, result.selectionEnd));
    });
  }

  return (
    <section className="editor-shell" aria-label="Editor workspace" data-mode={mode}>
      <EditorToolbar activeFormats={activeFormats} mode={mode} onAction={handleAction} onModeChange={onModeChange} />
      <div className="editor-surface">
        {isFallbackEditor ? (
          <textarea
            ref={textareaRef}
            aria-label="Markdown editor"
            className="editor-textarea"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setActiveFormats(
                getTextareaFormats(event.target.value, event.target.selectionStart, event.target.selectionEnd),
              );
            }}
            onClick={(event) => {
              const target = event.currentTarget;
              setActiveFormats(getTextareaFormats(value, target.selectionStart, target.selectionEnd));
            }}
            onKeyUp={(event) => {
              const target = event.currentTarget;
              setActiveFormats(getTextareaFormats(value, target.selectionStart, target.selectionEnd));
            }}
            onSelect={(event) => {
              const target = event.currentTarget;
              setActiveFormats(getTextareaFormats(value, target.selectionStart, target.selectionEnd));
            }}
            spellCheck
          />
        ) : (
          <div ref={hostRef} className="quill-host" />
        )}
      </div>
    </section>
  );
}

function syncFormatsForMode(
  quill: Quill,
  text: string,
  range: EditorRange | null,
  mode: EditorMode,
  setActiveFormats: (formats: ActiveFormats) => void,
) {
  if (mode === "formatted") {
    const formats = quill.getFormat(range ?? undefined);
    setActiveFormats({
      bold: Boolean(formats.bold),
      italic: Boolean(formats.italic),
      header: formats.header === 1 || formats.header === 2 ? formats.header : null,
      list: formats.list === "bullet" || formats.list === "ordered" ? formats.list : null,
      blockquote: Boolean(formats.blockquote),
      inlineCode: Boolean(formats.code),
      codeBlock: Boolean(formats["code-block"]),
      link: Boolean(formats.link),
    });
    return;
  }

  const selectionStart = range?.index ?? 0;
  const selectionEnd = selectionStart + (range?.length ?? 0);
  setActiveFormats(getTextareaFormats(text, selectionStart, selectionEnd));
}

function transformMarkdownSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: ToolbarAction,
): TextTransformResult {
  switch (action) {
    case "bold":
      return toggleWrapper(text, selectionStart, selectionEnd, "**", "**");
    case "italic":
      return toggleWrapper(text, selectionStart, selectionEnd, "*", "*");
    case "heading-1":
      return toggleLinePrefix(text, selectionStart, selectionEnd, "# ");
    case "heading-2":
      return toggleLinePrefix(text, selectionStart, selectionEnd, "## ");
    case "bulleted-list":
      return toggleLinePrefix(text, selectionStart, selectionEnd, "- ");
    case "numbered-list":
      return toggleOrderedList(text, selectionStart, selectionEnd);
    case "blockquote":
      return toggleLinePrefix(text, selectionStart, selectionEnd, "> ");
    case "inline-code":
      return toggleWrapper(text, selectionStart, selectionEnd, "`", "`");
    case "code-block":
      return toggleCodeBlock(text, selectionStart, selectionEnd);
    case "link":
      return insertLink(text, selectionStart, selectionEnd);
    default:
      return { nextValue: text, selectionStart, selectionEnd };
  }
}

function updateQuillText(quill: Quill, result: TextTransformResult, mode: EditorMode) {
  quill.setText(result.nextValue, "silent");
  if (mode === "hybrid") {
    applyMarkdownPresentation(quill, result.nextValue);
  }
  quill.setSelection(result.selectionStart, result.selectionEnd - result.selectionStart, "silent");
}

function getQuillValue(quill: Quill) {
  return normalizeEditorValue(quill.getText().replace(/\n$/, ""));
}

function normalizeEditorValue(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function hydrateQuill(quill: Quill, markdown: string, mode: EditorMode) {
  if (mode === "formatted") {
    const delta = quill.clipboard.convert({ html: markdownToHtml(markdown) });
    quill.setContents(delta, "silent");
    return;
  }

  quill.setText(markdown, "silent");
  if (mode === "hybrid") {
    applyMarkdownPresentation(quill, markdown);
  }
}

function serializeQuill(quill: Quill, mode: EditorMode) {
  if (mode === "formatted") {
    return normalizeEditorValue(htmlToMarkdown(quill.root.innerHTML));
  }

  return getQuillValue(quill);
}

function applyModePresentation(quill: Quill, markdown: string, mode: EditorMode, selection: EditorRange | null) {
  if (mode === "hybrid") {
    applyMarkdownPresentation(quill, markdown);
    if (selection) {
      quill.setSelection(selection.index, selection.length, "silent");
    }
  }
}

function applyFormattedAction(quill: Quill, action: ToolbarAction, range: EditorRange) {
  const formats = quill.getFormat(range);

  switch (action) {
    case "bold":
      quill.format("bold", !Boolean(formats.bold));
      break;
    case "italic":
      quill.format("italic", !Boolean(formats.italic));
      break;
    case "heading-1":
      quill.format("header", formats.header === 1 ? false : 1);
      break;
    case "heading-2":
      quill.format("header", formats.header === 2 ? false : 2);
      break;
    case "bulleted-list":
      quill.format("list", formats.list === "bullet" ? false : "bullet");
      break;
    case "numbered-list":
      quill.format("list", formats.list === "ordered" ? false : "ordered");
      break;
    case "blockquote":
      quill.format("blockquote", !Boolean(formats.blockquote));
      break;
    case "inline-code":
      quill.format("code", !Boolean(formats.code));
      break;
    case "code-block":
      quill.format("code-block", !Boolean(formats["code-block"]));
      break;
    case "link":
      handleFormattedLinkAction(quill, range, typeof formats.link === "string" ? formats.link : "");
      break;
    default:
      break;
  }
}

function handleFormattedLinkAction(quill: Quill, range: EditorRange, currentLink: string) {
  const nextUrl = window.prompt("Enter a URL", currentLink || "https://example.com");
  if (nextUrl === null) {
    return;
  }

  const trimmedUrl = nextUrl.trim();
  if (!trimmedUrl) {
    quill.format("link", false);
    return;
  }

  if (range.length === 0) {
    quill.insertText(range.index, trimmedUrl, { link: trimmedUrl }, "api");
    quill.setSelection(range.index, trimmedUrl.length, "silent");
    return;
  }

  quill.format("link", trimmedUrl, "api");
}

function applyMarkdownPresentation(quill: Quill, text: string) {
  const lines = text.split("\n");
  let index = 0;
  let insideCodeBlock = false;

  for (const line of lines) {
    const lineLength = Math.max(line.length, 1);
    quill.formatLine(index, lineLength, { header: false, blockquote: false, "code-block": false }, "silent");

    if (line.startsWith("```")) {
      insideCodeBlock = !insideCodeBlock;
      quill.formatLine(index, lineLength, { "code-block": true }, "silent");
    } else if (insideCodeBlock) {
      quill.formatLine(index, lineLength, { "code-block": true }, "silent");
    } else if (/^##\s/.test(line)) {
      quill.formatLine(index, lineLength, { header: 2 }, "silent");
    } else if (/^#\s/.test(line)) {
      quill.formatLine(index, lineLength, { header: 1 }, "silent");
    } else if (/^>\s/.test(line)) {
      quill.formatLine(index, lineLength, { blockquote: true }, "silent");
    }

    index += line.length + 1;
  }
}

function toggleWrapper(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
): TextTransformResult {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  if (selectionStart >= prefix.length && text.slice(selectionStart - prefix.length, selectionStart) === prefix) {
    if (text.slice(selectionEnd, selectionEnd + suffix.length) === suffix) {
      const nextValue =
        text.slice(0, selectionStart - prefix.length) + selected + text.slice(selectionEnd + suffix.length);
      return {
        nextValue,
        selectionStart: selectionStart - prefix.length,
        selectionEnd: selectionEnd - prefix.length,
      };
    }
  }

  if (!selected) {
    const inserted = `${prefix}${suffix}`;
    const nextValue = `${before}${inserted}${after}`;
    const cursor = selectionStart + prefix.length;
    return {
      nextValue,
      selectionStart: cursor,
      selectionEnd: cursor,
    };
  }

  const nextValue = `${before}${prefix}${selected}${suffix}${after}`;
  return {
    nextValue,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + prefix.length,
  };
}

function toggleLinePrefix(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
): TextTransformResult {
  const lineStart = findLineStart(text, selectionStart);
  const lineEnd = findLineEnd(text, selectionEnd);
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const allPrefixed = lines.every((line) => line.startsWith(prefix));
  const nextLines = lines.map((line) => {
    if (allPrefixed) {
      return line.startsWith(prefix) ? line.slice(prefix.length) : line;
    }

    return `${prefix}${line}`;
  });
  const nextBlock = nextLines.join("\n");
  const nextValue = text.slice(0, lineStart) + nextBlock + text.slice(lineEnd);
  const delta = nextBlock.length - block.length;
  const selectionShift = allPrefixed ? -prefix.length : prefix.length;

  return {
    nextValue,
    selectionStart: selectionStart + selectionShift,
    selectionEnd: selectionEnd + delta,
  };
}

function toggleOrderedList(text: string, selectionStart: number, selectionEnd: number): TextTransformResult {
  const lineStart = findLineStart(text, selectionStart);
  const lineEnd = findLineEnd(text, selectionEnd);
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const orderedPattern = /^\d+\. /;
  const allPrefixed = lines.every((line) => orderedPattern.test(line));
  const nextLines = lines.map((line, index) => {
    if (allPrefixed) {
      return line.replace(orderedPattern, "");
    }

    return `${index + 1}. ${line}`;
  });
  const nextBlock = nextLines.join("\n");
  const nextValue = text.slice(0, lineStart) + nextBlock + text.slice(lineEnd);

  return {
    nextValue,
    selectionStart: selectionStart + (allPrefixed ? -3 : 3),
    selectionEnd: selectionStart + nextBlock.length,
  };
}

function toggleCodeBlock(text: string, selectionStart: number, selectionEnd: number): TextTransformResult {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const blockPrefix = "```\n";
  const blockSuffix = "\n```";

  if (
    selectionStart >= blockPrefix.length &&
    text.slice(selectionStart - blockPrefix.length, selectionStart) === blockPrefix &&
    text.slice(selectionEnd, selectionEnd + blockSuffix.length) === blockSuffix
  ) {
    const nextValue =
      text.slice(0, selectionStart - blockPrefix.length) + selected + text.slice(selectionEnd + blockSuffix.length);
    return {
      nextValue,
      selectionStart: selectionStart - blockPrefix.length,
      selectionEnd: selectionEnd - blockPrefix.length,
    };
  }

  const codeContent = selected || "code";
  const nextValue = `${before}${blockPrefix}${codeContent}${blockSuffix}${after}`;
  const nextSelectionStart = selectionStart + blockPrefix.length;
  return {
    nextValue,
    selectionStart: nextSelectionStart,
    selectionEnd: nextSelectionStart + codeContent.length,
  };
}

function insertLink(text: string, selectionStart: number, selectionEnd: number): TextTransformResult {
  const selected = text.slice(selectionStart, selectionEnd);
  const label = selected || "link text";
  const url = window.prompt("Enter a URL", "https://example.com");
  if (url === null) {
    return { nextValue: text, selectionStart, selectionEnd };
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { nextValue: text, selectionStart, selectionEnd };
  }

  const linkMarkdown = `[${label}](${trimmedUrl})`;
  const nextValue = text.slice(0, selectionStart) + linkMarkdown + text.slice(selectionEnd);
  return {
    nextValue,
    selectionStart,
    selectionEnd: selectionStart + linkMarkdown.length,
  };
}

function getTextareaFormats(text: string, selectionStart: number, selectionEnd: number): ActiveFormats {
  const lineStart = findLineStart(text, selectionStart);
  const lineEnd = findLineEnd(text, selectionEnd);
  const currentBlock = text.slice(lineStart, lineEnd);

  return {
    bold: hasWrapper(text, selectionStart, selectionEnd, "**", "**"),
    italic: hasWrapper(text, selectionStart, selectionEnd, "*", "*"),
    header: currentBlock.startsWith("## ") ? 2 : currentBlock.startsWith("# ") ? 1 : null,
    list: currentBlock.startsWith("- ") ? "bullet" : /^\d+\. /.test(currentBlock) ? "ordered" : null,
    blockquote: currentBlock.startsWith("> "),
    inlineCode: hasWrapper(text, selectionStart, selectionEnd, "`", "`"),
    codeBlock:
      selectionStart >= 4 &&
      text.slice(selectionStart - 4, selectionStart) === "```\n" &&
      text.slice(selectionEnd, selectionEnd + 4) === "\n```",
    link:
      selectionStart >= 1 &&
      text.slice(selectionStart - 1, selectionStart) === "[" &&
      /\]\([^)]+\)/.test(text.slice(selectionEnd, selectionEnd + 256)),
  };
}

function hasWrapper(text: string, selectionStart: number, selectionEnd: number, prefix: string, suffix: string) {
  return (
    selectionStart >= prefix.length &&
    text.slice(selectionStart - prefix.length, selectionStart) === prefix &&
    text.slice(selectionEnd, selectionEnd + suffix.length) === suffix
  );
}

function findLineStart(text: string, index: number) {
  const lastNewline = text.lastIndexOf("\n", Math.max(index - 1, 0));
  return lastNewline === -1 ? 0 : lastNewline + 1;
}

function findLineEnd(text: string, index: number) {
  const nextNewline = text.indexOf("\n", index);
  return nextNewline === -1 ? text.length : nextNewline;
}
