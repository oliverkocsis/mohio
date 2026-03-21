import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import Quill from "quill";
import { editorHtmlToMarkdown, markdownToEditorHtml } from "./editor-markdown";

let quillFormatsRegistered = false;

export function RichTextEditor({
  markdown,
  onChange,
  onTitleChange,
  saveStateLabel,
  saveStateTone,
  title,
}: {
  markdown: string;
  onChange: (markdown: string) => void;
  onTitleChange: (title: string) => void;
  saveStateLabel: string;
  saveStateTone: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const latestMarkdownRef = useRef(markdown);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) {
      return;
    }

    registerCustomFormats();

    const quill = new Quill(containerRef.current, {
      modules: {
        toolbar: false,
      },
      placeholder: "Start writing your note",
      theme: "snow",
    });

    quill.on("text-change", (_delta, _oldDelta, source) => {
      if (source !== "user") {
        return;
      }

      const nextMarkdown = editorHtmlToMarkdown(quill.root.innerHTML);
      latestMarkdownRef.current = nextMarkdown;
      onChangeRef.current(nextMarkdown);
    });

    quillRef.current = quill;
    syncEditorContents(quill, markdown);
    latestMarkdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    const quill = quillRef.current;

    if (!quill || latestMarkdownRef.current === markdown) {
      return;
    }

    syncEditorContents(quill, markdown);
    latestMarkdownRef.current = markdown;
  }, [markdown]);

  return (
    <div className="editor-surface">
      <div className="editor-toolbar">
        <div className="toolbar-actions">
          <div className="toolbar-group">
            <ToolbarButton label="Heading 1" onClick={() => toggleLineFormat(quillRef.current, "header", 1)}>
              H1
            </ToolbarButton>
            <ToolbarButton label="Heading 2" onClick={() => toggleLineFormat(quillRef.current, "header", 2)}>
              H2
            </ToolbarButton>
            <ToolbarButton label="Heading 3" onClick={() => toggleLineFormat(quillRef.current, "header", 3)}>
              H3
            </ToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Bold" onClick={() => toggleInlineFormat(quillRef.current, "bold")}>
              <BoldIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Italic" onClick={() => toggleInlineFormat(quillRef.current, "italic")}>
              <ItalicIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Strikethrough" onClick={() => toggleInlineFormat(quillRef.current, "strike")}>
              <StrikethroughIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Inline code" onClick={() => toggleInlineFormat(quillRef.current, "code")}>
              <InlineCodeIcon />
            </IconToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Block quote" onClick={() => toggleLineFormat(quillRef.current, "blockquote", true)}>
              <QuoteIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Bulleted list" onClick={() => toggleLineFormat(quillRef.current, "list", "bullet")}>
              <BulletedListIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Numbered list" onClick={() => toggleLineFormat(quillRef.current, "list", "ordered")}>
              <NumberedListIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Code block" onClick={() => toggleLineFormat(quillRef.current, "code-block", true)}>
              <CodeBlockIcon />
            </IconToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Link" onClick={() => insertLink(quillRef.current)}>
              <LinkIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Image" onClick={() => insertImage(quillRef.current)}>
              <ImageIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Horizontal rule" onClick={() => insertDivider(quillRef.current)}>
              <HorizontalRuleIcon />
            </IconToolbarButton>
            <IconToolbarButton label="Clear formatting" onClick={() => clearFormatting(quillRef.current)}>
              <ClearFormattingIcon />
            </IconToolbarButton>
          </div>
        </div>
      </div>

      <div className="document-editor__header">
        <input
          aria-label="Document title"
          className="document-title-input"
          onChange={(event) => {
            onTitleChange(event.target.value);
          }}
          type="text"
          value={title}
        />
        <span
          className={`document-save-indicator document-save-indicator--${saveStateTone}`}
          data-testid="save-state"
        >
          {saveStateLabel}
        </span>
      </div>

      <div className="quill-editor-frame">
        <div className="quill-editor" data-testid="rich-text-editor" ref={containerRef} />
      </div>
    </div>
  );
}

function syncEditorContents(quill: Quill, markdown: string) {
  const html = markdownToEditorHtml(markdown);
  const delta = quill.clipboard.convert({ html });
  quill.setContents(delta, "silent");
}

function registerCustomFormats() {
  if (quillFormatsRegistered) {
    return;
  }

  const BlockEmbed = Quill.import("blots/block/embed") as any;

  class DividerBlot extends BlockEmbed {
    static blotName = "divider";
    static tagName = "hr";
  }

  class PreservedBlockBlot extends BlockEmbed {
    static blotName = "preserved-block";
    static className = "mohio-preserved-block";
    static tagName = "div";

    static create(value: { markdown: string; type: string }) {
      const node = super.create() as HTMLDivElement;
      const label = document.createElement("div");
      const preview = document.createElement("pre");

      node.dataset.preservedMarkdown = encodeURIComponent(value.markdown);
      node.dataset.preservedBlockType = value.type;
      node.setAttribute("contenteditable", "false");

      label.className = "mohio-preserved-block__label";
      label.textContent = value.type === "table" ? "Preserved table block" : "Preserved task list block";

      preview.className = "mohio-preserved-block__preview";
      preview.textContent = value.markdown;

      node.append(label, preview);

      return node;
    }
  }

  Quill.register(DividerBlot, true);
  Quill.register(PreservedBlockBlot, true);
  quillFormatsRegistered = true;
}

function toggleInlineFormat(quill: Quill | null, format: string) {
  if (!quill) {
    return;
  }

  const range = quill.getSelection(true);

  if (!range) {
    return;
  }

  const currentFormats = quill.getFormat(range);
  quill.format(format, !currentFormats[format]);
}

function toggleLineFormat(quill: Quill | null, format: string, value: unknown) {
  if (!quill) {
    return;
  }

  const range = quill.getSelection(true);

  if (!range) {
    return;
  }

  const currentFormats = quill.getFormat(range);
  quill.formatLine(range.index, range.length, format, currentFormats[format] === value ? false : value);
}

function clearFormatting(quill: Quill | null) {
  if (!quill) {
    return;
  }

  const range = quill.getSelection(true);

  if (!range) {
    return;
  }

  quill.removeFormat(range.index, range.length);
}

function insertDivider(quill: Quill | null) {
  if (!quill) {
    return;
  }

  const range = quill.getSelection(true);
  const index = range?.index ?? quill.getLength();

  quill.insertEmbed(index, "divider", true, "user");
  quill.insertText(index + 1, "\n", "user");
  quill.setSelection(index + 2, 0, "silent");
}

function insertLink(quill: Quill | null) {
  if (!quill) {
    return;
  }

  const url = window.prompt("Enter a URL");

  if (!url) {
    return;
  }

  const range = quill.getSelection(true);

  if (!range || range.length === 0) {
    quill.insertText(range?.index ?? quill.getLength(), url, { link: url }, "user");
    return;
  }

  quill.format("link", url);
}

function insertImage(quill: Quill | null) {
  if (!quill) {
    return;
  }

  const url = window.prompt("Enter an image URL");

  if (!url) {
    return;
  }

  const range = quill.getSelection(true);
  const index = range?.index ?? quill.getLength();

  quill.insertEmbed(index, "image", url, "user");
  quill.insertText(index + 1, "\n", "user");
  quill.setSelection(index + 2, 0, "silent");
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
      type="button"
    >
      {children}
    </button>
  );
}

function BoldIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M5 3.5h3.3a2.2 2.2 0 1 1 0 4.4H5zm0 4.4h3.8a2.3 2.3 0 1 1 0 4.6H5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M9.8 3.5H6.9m2.2 0L6.8 12.5m2.3 0H6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M4 8h8M5.1 4.4c.6-.6 1.4-.9 2.4-.9 1.8 0 3.2.9 3.2 2.3 0 1-.8 1.7-1.9 2.1l-2 .7c-1.1.4-1.8 1-1.8 2 0 1.4 1.3 2.4 3.3 2.4 1 0 2-.3 2.8-.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function InlineCodeIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M6 4 2.8 8 6 12M10 4l3.2 4-3.2 4M8.8 3.5 7.2 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.7 4.2H3.8L3 7.5h2.4v4.3H1.8V7.2L3 4.2h2.7Zm6.5 0h-1.9l-.8 3.3h2.4v4.3H8.3V7.2l1.2-3h2.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BulletedListIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path d="M6 4h6M6 8h6M6 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <circle cx="3.25" cy="4" fill="currentColor" r="0.85" />
      <circle cx="3.25" cy="8" fill="currentColor" r="0.85" />
      <circle cx="3.25" cy="12" fill="currentColor" r="0.85" />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path d="M6 4h6M6 8h6M6 12h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path
        d="M2.5 4h1.4v2M2.2 8h1.6c.4 0 .7.3.7.7 0 .2-.1.4-.3.6l-1.6 1.4h2M2.3 12h1.5c.5 0 .8.3.8.7s-.3.7-.8.7H2.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.5 4.5 2.8 8l2.7 3.5M10.5 4.5 13.2 8l-2.7 3.5M8.6 3.8 7.4 12.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <rect x="5.9" y="2.6" width="4.2" height="10.8" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M6.4 9.6 9.6 6.4m-4.8.9L3.7 8.4a2.2 2.2 0 0 0 3.1 3.1l1.1-1.1m1.3-4.9 1.1-1.1a2.2 2.2 0 0 1 3.1 3.1l-1.1 1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="6" cy="7" r="1.1" fill="currentColor" />
      <path
        d="m4 11 2.4-2.3a1 1 0 0 1 1.4 0L9 9.8a1 1 0 0 0 1.3.1L12 8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function HorizontalRuleIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <path d="M3 8h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function ClearFormattingIcon() {
  return (
    <svg aria-hidden="true" className="formatting-icon" fill="none" viewBox="0 0 16 16">
      <text
        fill="currentColor"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="12.5"
        fontWeight="700"
        x="3"
        y="12.3"
      >
        T
      </text>
      <path d="M11.3 7.3 4.2 8.9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.1" />
    </svg>
  );
}
