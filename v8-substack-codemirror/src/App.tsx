import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  MarkdownEditor,
  type EditorMode,
  type MarkdownEditorHandle,
} from "./components/MarkdownEditor";
import type { ToolbarAction } from "./lib/formatting";

const inlineButtons: Array<{
  action: ToolbarAction;
  label: string;
  icon: ReactNode;
  className?: string;
}> = [
  { action: "bold", label: "Bold", icon: <span className="toolbar-glyph toolbar-glyph-bold">B</span> },
  { action: "italic", label: "Italic", icon: <span className="toolbar-glyph toolbar-glyph-italic">I</span> },
  {
    action: "strikethrough",
    label: "Strikethrough",
    icon: <span className="toolbar-glyph toolbar-glyph-strikethrough">S</span>,
  },
  { action: "inlineCode", label: "Inline code", icon: <CodeIcon /> },
  { action: "link", label: "Link", icon: <LinkIcon /> },
  { action: "bulletList", label: "Bulleted list", icon: <BulletedListIcon /> },
  { action: "numberedList", label: "Numbered list", icon: <NumberedListIcon /> },
];

const styleOptions: Array<{ action: ToolbarAction; label: string }> = [
  { action: "paragraph", label: "Paragraph" },
  { action: "heading1", label: "Heading 1" },
  { action: "heading2", label: "Heading 2" },
];

const moreOptions: Array<{
  action?: ToolbarAction;
  label?: string;
  mode?: EditorMode;
  kind?: "divider";
}> = [
  { action: "blockquote", label: "Blockquote" },
  { action: "codeBlock", label: "Code block" },
  { kind: "divider" },
  { mode: "source", label: "Source" },
  { mode: "hybrid", label: "Hybrid" },
  { mode: "formatted", label: "Formatted" },
];

type OpenMenu = "style" | "more" | null;

export default function App() {
  const [documentValue, setDocumentValue] = useState("");
  const [editorMode, setEditorMode] = useState<EditorMode>("hybrid");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const editorRef = useRef<MarkdownEditorHandle | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isEmpty = documentValue.trim().length === 0;

  function handleToolbarAction(action: ToolbarAction) {
    editorRef.current?.applyFormatting(action);
    setOpenMenu(null);
  }

  function handleModeChange(mode: EditorMode) {
    setEditorMode(mode);
    setOpenMenu(null);
    editorRef.current?.focus();
  }

  return (
    <div className="app-shell">
      <main className="editor-screen" aria-label="Substack-style Markdown editor">
        <div className="editor-toolbar" role="toolbar" aria-label="Article formatting toolbar" ref={toolbarRef}>
          <ToolbarButton
            label="Undo"
            onClick={() => handleToolbarAction("undo")}
            icon={<UndoIcon />}
          />
          <ToolbarButton
            label="Redo"
            onClick={() => handleToolbarAction("redo")}
            icon={<RedoIcon />}
          />

          <div className="toolbar-divider" aria-hidden="true" />

          <div className="toolbar-menu">
            <ToolbarButton
              label="Style"
              onClick={() => setOpenMenu((menu) => (menu === "style" ? null : "style"))}
              ariaExpanded={openMenu === "style"}
              ariaControls="style-menu"
              ariaHasPopup="menu"
              icon={
                <>
                  <span className="toolbar-menu-label">Style</span>
                  <ChevronDownIcon />
                </>
              }
            />
            {openMenu === "style" ? (
              <div className="toolbar-dropdown" id="style-menu" role="menu" aria-label="Style options">
                {styleOptions.map((option) => (
                  <MenuItem
                    key={option.action}
                    label={option.label}
                    onClick={() => handleToolbarAction(option.action)}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="toolbar-divider" aria-hidden="true" />

          {inlineButtons.map((button) => (
            <ToolbarButton
              key={button.action}
              label={button.label}
              onClick={() => handleToolbarAction(button.action)}
              className={button.className}
              icon={button.icon}
            />
          ))}

          <div className="toolbar-divider toolbar-divider-wide" aria-hidden="true" />

          <div className="toolbar-menu toolbar-menu-end">
            <ToolbarButton
              label="More"
              onClick={() => setOpenMenu((menu) => (menu === "more" ? null : "more"))}
              ariaExpanded={openMenu === "more"}
              ariaControls="more-menu"
              ariaHasPopup="menu"
              icon={
                <>
                  <span className="toolbar-menu-label">More</span>
                  <ChevronDownIcon />
                </>
              }
            />
            {openMenu === "more" ? (
              <div className="toolbar-dropdown toolbar-dropdown-more" id="more-menu" role="menu" aria-label="More options">
                {moreOptions.map((option, index) =>
                  option.kind === "divider" ? (
                    <div className="toolbar-dropdown-divider" key={`divider-${index}`} aria-hidden="true" />
                  ) : option.mode ? (
                    <MenuItem
                      key={option.mode}
                      label={option.label ?? option.mode}
                      onClick={() => handleModeChange(option.mode!)}
                      selected={editorMode === option.mode}
                    />
                  ) : (
                    <MenuItem
                      key={option.action}
                      label={option.label ?? ""}
                      onClick={() => handleToolbarAction(option.action!)}
                    />
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>

        <section className="article-stage" onClick={() => editorRef.current?.focus()}>
          <div className="article-column">
            <div className="article-canvas">
              {isEmpty ? (
                <div className="article-placeholder" aria-hidden="true">
                  <p className="article-placeholder-title">Title</p>
                  <p className="article-placeholder-body">Start writing...</p>
                </div>
              ) : null}
              <MarkdownEditor
                ref={editorRef}
                value={documentValue}
                onChange={setDocumentValue}
                ariaLabel="Markdown document"
                mode={editorMode}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaHasPopup?: "menu";
}

function ToolbarButton({
  label,
  icon,
  onClick,
  className,
  ariaExpanded,
  ariaControls,
  ariaHasPopup,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`toolbar-button${className ? ` ${className}` : ""}`}
      aria-label={label}
      title={label}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaHasPopup}
      onMouseDown={preventToolbarFocus}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

interface MenuItemProps {
  label: string;
  onClick: () => void;
  selected?: boolean;
}

function MenuItem({ label, onClick, selected = false }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      className="toolbar-dropdown-item"
      data-selected={selected}
      onMouseDown={preventToolbarFocus}
      onClick={onClick}
    >
      <span>{label}</span>
      {selected ? <CheckIcon /> : null}
    </button>
  );
}

function preventToolbarFocus(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7H5V3" />
      <path d="M5 7c2.1-2.5 5.2-4 8.6-4A8.4 8.4 0 1 1 5.9 15" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 7h4V3" />
      <path d="M19 7c-2.1-2.5-5.2-4-8.6-4A8.4 8.4 0 1 0 18.1 15" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18-6-6 6-6" />
      <path d="m15 6 6 6-6 6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.5 13.5 13.5 10.5" />
      <path d="M7 17a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 0" />
      <path d="M17 7a4 4 0 0 1 0 5.7l-2.3 2.3a4 4 0 0 1-5.7 0" />
    </svg>
  );
}

function BulletedListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="7" r="1.4" />
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="5" cy="17" r="1.4" />
      <path d="M10 7h10" />
      <path d="M10 12h10" />
      <path d="M10 17h10" />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h2v4" />
      <path d="M4 12h2l-2 3h2" />
      <path d="M4.2 19c0-.8.7-1.5 1.5-1.5S7.2 18.2 7.2 19s-.7 1.5-1.5 1.5S4.2 19.8 4.2 19Z" />
      <path d="M10 7h10" />
      <path d="M10 12h10" />
      <path d="M10 17h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
