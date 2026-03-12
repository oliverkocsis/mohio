import { useState } from "react";
import { MarkdownEditor } from "./components/MarkdownEditor";
import type { EditorMode } from "./components/EditorToolbar";
import { SEED_MARKDOWN } from "./lib/document";

export default function App() {
  const [markdown, setMarkdown] = useState(SEED_MARKDOWN);
  const [mode, setMode] = useState<EditorMode>("hybrid");

  return (
    <main className="app-shell" aria-label="Markdown editor prototype">
      <MarkdownEditor mode={mode} onModeChange={setMode} value={markdown} onChange={setMarkdown} />
    </main>
  );
}
