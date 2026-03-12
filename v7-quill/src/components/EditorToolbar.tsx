export type ToolbarAction =
  | "bold"
  | "italic"
  | "heading-1"
  | "heading-2"
  | "bulleted-list"
  | "numbered-list"
  | "blockquote"
  | "inline-code"
  | "code-block"
  | "link";

export type EditorMode = "source" | "hybrid" | "formatted";

export interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  header: 1 | 2 | null;
  list: "bullet" | "ordered" | null;
  blockquote: boolean;
  inlineCode: boolean;
  codeBlock: boolean;
  link: boolean;
}

interface ToolbarButton {
  action: ToolbarAction;
  label: string;
  compactLabel: string;
}

interface EditorToolbarProps {
  activeFormats: ActiveFormats;
  mode: EditorMode;
  onAction: (action: ToolbarAction) => void;
  onModeChange: (mode: EditorMode) => void;
}

const toolbarGroups: ToolbarButton[][] = [
  [
    { action: "bold", label: "Bold", compactLabel: "B" },
    { action: "italic", label: "Italic", compactLabel: "I" },
  ],
  [
    { action: "heading-1", label: "Heading 1", compactLabel: "H1" },
    { action: "heading-2", label: "Heading 2", compactLabel: "H2" },
  ],
  [
    { action: "bulleted-list", label: "Bulleted list", compactLabel: "UL" },
    { action: "numbered-list", label: "Numbered list", compactLabel: "OL" },
    { action: "blockquote", label: "Blockquote", compactLabel: "Quote" },
  ],
  [
    { action: "inline-code", label: "Inline code", compactLabel: "Code" },
    { action: "code-block", label: "Code block", compactLabel: "Block" },
    { action: "link", label: "Link", compactLabel: "Link" },
  ],
];

export const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  header: null,
  list: null,
  blockquote: false,
  inlineCode: false,
  codeBlock: false,
  link: false,
};

const editorModes: Array<{ value: EditorMode; label: string }> = [
  { value: "source", label: "Source" },
  { value: "hybrid", label: "Hybrid" },
  { value: "formatted", label: "Formatted" },
];

export function EditorToolbar({ activeFormats, mode, onAction, onModeChange }: EditorToolbarProps) {
  return (
    <header className="toolbar" aria-label="Editor toolbar">
      <div className="toolbar-mode-switch" role="tablist" aria-label="Editor view mode">
        {editorModes.map((item) => (
          <button
            key={item.value}
            type="button"
            className="toolbar-mode-button"
            role="tab"
            aria-selected={mode === item.value}
            data-active={mode === item.value}
            onClick={() => onModeChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {toolbarGroups.map((group, index) => (
        <div className="toolbar-group" key={index} role="group">
          {group.map((button) => (
            <button
              key={button.action}
              type="button"
              className="toolbar-button"
              aria-label={button.label}
              title={button.label}
              aria-pressed={isActionActive(button.action, activeFormats)}
              data-active={isActionActive(button.action, activeFormats)}
              onClick={() => onAction(button.action)}
            >
              <span className="toolbar-button-label toolbar-button-label-desktop">{button.label}</span>
              <span className="toolbar-button-label toolbar-button-label-compact">{button.compactLabel}</span>
            </button>
          ))}
        </div>
      ))}
    </header>
  );
}

function isActionActive(action: ToolbarAction, formats: ActiveFormats) {
  switch (action) {
    case "bold":
      return formats.bold;
    case "italic":
      return formats.italic;
    case "heading-1":
      return formats.header === 1;
    case "heading-2":
      return formats.header === 2;
    case "bulleted-list":
      return formats.list === "bullet";
    case "numbered-list":
      return formats.list === "ordered";
    case "blockquote":
      return formats.blockquote;
    case "inline-code":
      return formats.inlineCode;
    case "code-block":
      return formats.codeBlock;
    case "link":
      return formats.link;
    default:
      return false;
  }
}
