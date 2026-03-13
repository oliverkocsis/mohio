import type { TextRun, WorkspaceDocument } from "../types";

interface DocumentSurfaceProps {
  workspaceName: string;
  document: WorkspaceDocument;
}

function renderRuns(runs: TextRun[]) {
  return runs.map((run, index) =>
    run.bold ? (
      <strong key={`${run.text}-${index}`}>{run.text}</strong>
    ) : (
      <span key={`${run.text}-${index}`}>{run.text}</span>
    ),
  );
}

export function DocumentSurface({ workspaceName, document }: DocumentSurfaceProps) {
  return (
    <main
      aria-label="Document surface"
      className="document-pane"
    >
      <div className="document-surface">
        <header className="document-header">
          <div className="document-header-top">
            <span className="document-chip">Read-only mock document</span>
            <span className="document-chip muted-chip">{workspaceName}</span>
          </div>

          <h2>{document.title}</h2>
          <p className="document-summary">{document.summary}</p>

          <div className="document-meta">
            <span>{document.path}</span>
            <span>{document.lastEdited}</span>
          </div>
        </header>

        <article
          aria-label="Mock document content"
          className="document-body"
        >
          {document.blocks.map((block) => {
            if (block.type === "heading") {
              if (block.level === 1) {
                return <h1 key={block.id}>{block.text}</h1>;
              }

              if (block.level === 2) {
                return <h2 key={block.id}>{block.text}</h2>;
              }

              return <h3 key={block.id}>{block.text}</h3>;
            }

            if (block.type === "paragraph") {
              return <p key={block.id}>{renderRuns(block.runs)}</p>;
            }

            if (block.type === "bullet-list") {
              return (
                <ul key={block.id}>
                  {block.items.map((item, index) => (
                    <li key={`${block.id}-${index}`}>{renderRuns(item)}</li>
                  ))}
                </ul>
              );
            }

            return (
              <section className="document-code-block" key={block.id}>
                <div className="document-code-language">{block.language}</div>
                <pre>
                  <code>{block.code}</code>
                </pre>
              </section>
            );
          })}
        </article>
      </div>
    </main>
  );
}
