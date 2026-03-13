import { renderMarkdown } from "../lib/markdown";
import type { DocumentRecord } from "../types";

interface DocumentSurfaceProps {
  document: DocumentRecord;
}

export function DocumentSurface({ document }: DocumentSurfaceProps) {
  return (
    <main className="pane pane-document" aria-label="Workspace document">
      <div className="document-meta">
        <div>
          <span className="pane-eyebrow">Document</span>
          <h2>{document.title}</h2>
          <p>{document.path}</p>
        </div>
        <div className="document-badges">
          <span className="document-badge">Preview</span>
          <span className="document-updated">Updated {document.updatedAt}</span>
        </div>
      </div>

      <section className="document-surface" aria-label="Document preview">
        <article
          className="document-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(document.markdown) }}
        />
      </section>
    </main>
  );
}
