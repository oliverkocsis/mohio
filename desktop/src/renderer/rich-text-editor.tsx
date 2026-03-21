import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
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
import Quill from "quill";
import { editorHtmlToMarkdown, markdownToEditorHtml } from "./editor-markdown";

let quillFormatsRegistered = false;

export function RichTextEditor({
  dataTestId,
  markdown,
  onChange,
  onTitleChange,
  title,
}: {
  dataTestId?: string;
  markdown: string;
  onChange: (markdown: string) => void;
  onTitleChange: (title: string) => void;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement | null>(null);
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

    const handleTextChange = (_delta: unknown, _oldDelta: unknown, source: string) => {
      if (source !== "user") {
        return;
      }

      const nextMarkdown = editorHtmlToMarkdown(quill.root.innerHTML);
      latestMarkdownRef.current = nextMarkdown;
      onChangeRef.current(nextMarkdown);
    };

    quill.on("text-change", handleTextChange);

    quillRef.current = quill;
    syncEditorContents(quill, markdown);
    latestMarkdownRef.current = markdown;

    return () => {
      quill.off("text-change", handleTextChange);
      quillRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;

    if (!quill || latestMarkdownRef.current === markdown) {
      return;
    }

    syncEditorContents(quill, markdown);
    latestMarkdownRef.current = markdown;
  }, [markdown]);

  useEffect(() => {
    resizeTitleInput(titleInputRef.current);
  }, [title]);

  return (
    <section className="editor-surface" data-testid={dataTestId}>
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
              <Bold aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Italic" onClick={() => toggleInlineFormat(quillRef.current, "italic")}>
              <Italic aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Strikethrough" onClick={() => toggleInlineFormat(quillRef.current, "strike")}>
              <Strikethrough aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Inline code" onClick={() => toggleInlineFormat(quillRef.current, "code")}>
              <Code2 aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Block quote" onClick={() => toggleLineFormat(quillRef.current, "blockquote", true)}>
              <Quote aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Bulleted list" onClick={() => toggleLineFormat(quillRef.current, "list", "bullet")}>
              <List aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Numbered list" onClick={() => toggleLineFormat(quillRef.current, "list", "ordered")}>
              <ListOrdered aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Code block" onClick={() => toggleLineFormat(quillRef.current, "code-block", true)}>
              <SquareCode aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          <div className="toolbar-group">
            <IconToolbarButton label="Link" onClick={() => insertLink(quillRef.current)}>
              <Link2 aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Image" onClick={() => insertImage(quillRef.current)}>
              <Image aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Horizontal rule" onClick={() => insertDivider(quillRef.current)}>
              <Minus aria-hidden="true" className="toolbar-button__icon" />
            </IconToolbarButton>
            <IconToolbarButton label="Clear formatting" onClick={() => clearFormatting(quillRef.current)}>
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

      <div className="quill-editor-frame">
        <div className="quill-editor" data-testid="rich-text-editor" ref={containerRef} />
      </div>
    </section>
  );
}

function resizeTitleInput(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = "0";
  element.style.height = `${element.scrollHeight}px`;
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
