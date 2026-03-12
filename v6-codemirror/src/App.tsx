import { useRef, useState } from "react";
import {
  MarkdownEditor,
  type EditorMode,
  type MarkdownEditorHandle,
} from "./components/MarkdownEditor";
import type { ToolbarAction } from "./lib/formatting";

const seedDocument = `# Q2 Launch Narrative

The product team needs a single command center for the launch week update, written in Markdown and refined quickly.

## Goals

- Share the headline story in one place
- Keep the writing crisp for internal readers
- Make the next actions easy to scan

## Messaging notes

1. Start with customer value
2. Highlight the operational plan
3. Close with launch-day ownership

> Draft in public, edit with intent, and keep the document easy to read.

\`npm run build\`

[Launch checklist](https://example.com)
`;

const toolbarButtons: Array<{
  action: ToolbarAction;
  label: string;
  shortLabel: string;
}> = [
  { action: "bold", label: "Bold", shortLabel: "B" },
  { action: "italic", label: "Italic", shortLabel: "I" },
  { action: "heading1", label: "Heading 1", shortLabel: "H1" },
  { action: "heading2", label: "Heading 2", shortLabel: "H2" },
  { action: "bulletList", label: "Bullet list", shortLabel: "Bullets" },
  { action: "numberedList", label: "Numbered list", shortLabel: "Numbered" },
  { action: "blockquote", label: "Blockquote", shortLabel: "Quote" },
  { action: "code", label: "Code", shortLabel: "Code" },
  { action: "link", label: "Link", shortLabel: "Link" },
];

const editorModes: Array<{
  value: EditorMode;
  label: string;
}> = [
  { value: "source", label: "Source" },
  { value: "hybrid", label: "Hybrid" },
  { value: "formatted", label: "Formatted" },
];

export default function App() {
  const [documentValue, setDocumentValue] = useState(seedDocument);
  const [editorMode, setEditorMode] = useState<EditorMode>("hybrid");
  const editorRef = useRef<MarkdownEditorHandle | null>(null);

  function handleToolbarAction(action: ToolbarAction) {
    editorRef.current?.applyFormatting(action);
  }

  return (
    <div className="app-shell">
      <main className="editor-screen" aria-label="Standalone Markdown editor">
        <div className="editor-frame">
          <div className="toolbar-row">
            <div className="toolbar-cluster">
              <div className="mode-switcher" role="toolbar" aria-label="Editor state">
                {editorModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    className="mode-button"
                    aria-pressed={editorMode === mode.value}
                    onClick={() => setEditorMode(mode.value)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="toolbar-group" role="toolbar" aria-label="Text formatting">
                {toolbarButtons.map((button) => (
                  <button
                    key={button.action}
                    type="button"
                    className="toolbar-button"
                    aria-label={button.label}
                    title={button.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleToolbarAction(button.action)}
                  >
                    {button.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="editor-card">
            <MarkdownEditor
              ref={editorRef}
              value={documentValue}
              onChange={setDocumentValue}
              ariaLabel="Markdown document"
              mode={editorMode}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
