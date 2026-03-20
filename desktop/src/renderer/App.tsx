import { useEffect, useState } from "react";
import type {
  AppInfo,
  WorkspaceDocumentNode,
  WorkspaceSummary,
  WorkspaceTreeNode,
} from "@shared/mohio-types";

const headingTools = [
  { label: "Heading 1", displayLabel: "H1" },
  { label: "Heading 2", displayLabel: "H2" },
  { label: "Heading 3", displayLabel: "H3" },
] as const;

const textStyleTools = [
  { label: "Bold", icon: BoldIcon },
  { label: "Underline", icon: UnderlineIcon },
  { label: "Italic", icon: ItalicIcon },
] as const;

const listTools = [
  { label: "Bulleted list", icon: BulletedListIcon },
  { label: "Numbered list", icon: NumberedListIcon },
 ] as const;

const insertTools = [
  { label: "Link", icon: LinkIcon },
  { label: "Table", icon: TableIcon },
  { label: "Clear formatting", icon: ClearFormattingIcon },
] as const;

export function App() {
  const appInfo: AppInfo = window.mohio.getAppInfo();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isWorkspaceOpening, setIsWorkspaceOpening] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadWorkspace = async () => {
      try {
        const currentWorkspace = await window.mohio.getCurrentWorkspace();

        if (!isMounted) {
          return;
        }

        setWorkspace(currentWorkspace);
        setSelectedDocumentId(getInitialDocumentId(currentWorkspace));
        setWorkspaceError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setWorkspaceError("Mohio could not load the current workspace.");
      } finally {
        if (isMounted) {
          setIsWorkspaceLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDocument = workspace && selectedDocumentId
    ? findDocumentById(workspace.documents, selectedDocumentId)
    : null;

  const handleOpenWorkspace = async () => {
    try {
      setIsWorkspaceOpening(true);

      const nextWorkspace = await window.mohio.openWorkspace();

      setWorkspace(nextWorkspace);
      setSelectedDocumentId(getInitialDocumentId(nextWorkspace));
      setWorkspaceError(null);
    } catch {
      setWorkspaceError("Mohio could not open that folder as a workspace.");
    } finally {
      setIsWorkspaceLoading(false);
      setIsWorkspaceOpening(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="top-bar" data-testid="top-bar">
        <div className="top-bar__context">
          <button
            aria-label={workspace ? `Switch workspace from ${workspace.name}` : "Select workspace"}
            className="workspace-label workspace-label--button"
            disabled={isWorkspaceOpening}
            onClick={() => {
              void handleOpenWorkspace();
            }}
            type="button"
          >
            <span className="workspace-label__name">
              {workspace?.name ?? "Open a workspace"}
            </span>
            <span className="workspace-label__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </button>
        </div>

        <div className="top-bar__search">
          <input
            aria-label="Search workspace"
            className="search-input search-input--top-bar"
            placeholder={workspace ? `Search ${workspace.name}` : "Search workspace"}
            readOnly
            type="search"
          />
        </div>

        <div className="top-bar__actions">
          <button className="primary-button" type="button">
            New note
          </button>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="sidebar sidebar--left" data-testid="workspace-sidebar">
          <section className="sidebar__section">
            <h2 className="sidebar__title">Workspace</h2>

            {isWorkspaceLoading ? (
              <p className="workspace-panel__copy">Loading current workspace...</p>
            ) : workspace ? (
              <>
                <div className="workspace-panel__header">
                  <h3 className="workspace-panel__name">{workspace.name}</h3>
                  <p className="workspace-panel__path">{workspace.path}</p>
                </div>
                <button
                  className="ghost-button workspace-panel__button"
                  disabled={isWorkspaceOpening}
                  onClick={() => {
                    void handleOpenWorkspace();
                  }}
                  type="button"
                >
                  {isWorkspaceOpening ? "Opening folder..." : "Open folder"}
                </button>
              </>
            ) : (
              <>
                <div className="workspace-panel__header">
                  <h3 className="workspace-panel__name">No workspace selected</h3>
                  <p className="workspace-panel__copy">
                    Open a local folder to browse its Markdown documents in Mohio.
                  </p>
                </div>
                <button
                  className="ghost-button workspace-panel__button"
                  disabled={isWorkspaceOpening}
                  onClick={() => {
                    void handleOpenWorkspace();
                  }}
                  type="button"
                >
                  {isWorkspaceOpening ? "Opening folder..." : "Open folder"}
                </button>
              </>
            )}

            {workspaceError ? (
              <p className="workspace-panel__error" role="status">
                {workspaceError}
              </p>
            ) : null}
          </section>

          <section className="sidebar__section">
            <div className="sidebar__title-row">
              <h2 className="sidebar__title">Documents</h2>
              {workspace ? (
                <span className="sidebar__count">{workspace.documentCount}</span>
              ) : null}
            </div>

            {!workspace ? (
              <p className="workspace-panel__copy">
                Select a workspace to see its Markdown document tree.
              </p>
            ) : workspace.documentCount === 0 ? (
              <p className="workspace-panel__copy">
                No Markdown documents were found in this folder yet.
              </p>
            ) : (
              <ul className="workspace-tree" role="tree">
                {workspace.documents.map((node) =>
                  renderWorkspaceNode({
                    node,
                    selectedDocumentId,
                    depth: 0,
                    onSelect: setSelectedDocumentId,
                  }),
                )}
              </ul>
            )}
          </section>
        </aside>

        <main className="editor-panel">
          <div className="editor-panel__inner">
            <div className="editor-toolbar">
              <div className="toolbar-actions">
                <div className="toolbar-group">
                  {headingTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--text"
                      key={tool.label}
                      type="button"
                    >
                      <span className="toolbar-button__text">{tool.displayLabel}</span>
                    </button>
                  ))}
                  <button
                    aria-label="Heading styles"
                    className="toolbar-button toolbar-button--selector-only"
                    type="button"
                  >
                    <span className="toolbar-button__chevron" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                <span className="toolbar-separator" aria-hidden="true" />

                <div className="toolbar-group">
                  {textStyleTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--icon"
                      key={tool.label}
                      type="button"
                    >
                      <tool.icon />
                    </button>
                  ))}
                  <button
                    aria-label="Text styles"
                    className="toolbar-button toolbar-button--selector-only"
                    type="button"
                  >
                    <span className="toolbar-button__chevron" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                <span className="toolbar-separator" aria-hidden="true" />

                <div className="toolbar-group">
                  {listTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--icon"
                      key={tool.label}
                      type="button"
                    >
                      <tool.icon />
                    </button>
                  ))}
                  <button
                    aria-label="Text alignment"
                    className="toolbar-button toolbar-button--icon"
                    type="button"
                  >
                    <AlignLeftIcon />
                  </button>
                  <button
                    aria-label="Alignment options"
                    className="toolbar-button toolbar-button--selector-only"
                    type="button"
                  >
                    <span className="toolbar-button__chevron" aria-hidden="true">
                      <ChevronDownIcon />
                    </span>
                  </button>
                </div>
                <span className="toolbar-separator" aria-hidden="true" />

                <div className="toolbar-group">
                  {insertTools.map((tool) => (
                    <button
                      aria-label={tool.label}
                      className="toolbar-button toolbar-button--icon"
                      key={tool.label}
                      type="button"
                    >
                      <tool.icon />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {workspace && selectedDocument ? (
              <section className="hello-state" data-testid="document-state">
                <h1>{getDocumentTitle(selectedDocument.name)}</h1>
                <p className="hello-state__copy">
                  Mohio is treating this Markdown file as the active workspace document.
                  The workspace browser now reflects the local folder structure directly.
                </p>

                <dl className="hello-state__meta">
                  <div>
                    <dt>Workspace</dt>
                    <dd>{workspace.name}</dd>
                  </div>
                  <div>
                    <dt>Document</dt>
                    <dd>{selectedDocument.relativePath}</dd>
                  </div>
                  <div>
                    <dt>Platform</dt>
                    <dd>{appInfo.platform}</dd>
                  </div>
                </dl>
              </section>
            ) : workspace ? (
              <section className="hello-state" data-testid="document-state">
                <h1>{workspace.name}</h1>
                <p className="hello-state__copy">
                  This workspace is open, but Mohio did not find any Markdown documents yet.
                </p>

                <dl className="hello-state__meta">
                  <div>
                    <dt>Workspace</dt>
                    <dd>{workspace.name}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{workspace.path}</dd>
                  </div>
                  <div>
                    <dt>Documents</dt>
                    <dd>{workspace.documentCount}</dd>
                  </div>
                </dl>
              </section>
            ) : (
              <section className="hello-state" data-testid="document-state">
                <h1>Open a workspace</h1>
                <p className="hello-state__copy">
                  Choose a local folder to load its Markdown files into Mohio&apos;s
                  workspace browser.
                </p>

                <dl className="hello-state__meta">
                  <div>
                    <dt>App</dt>
                    <dd>{appInfo.name}</dd>
                  </div>
                  <div>
                    <dt>Version</dt>
                    <dd>{appInfo.version}</dd>
                  </div>
                  <div>
                    <dt>Platform</dt>
                    <dd>{appInfo.platform}</dd>
                  </div>
                </dl>
              </section>
            )}
          </div>
        </main>

        <aside className="sidebar sidebar--right" data-testid="assistant-sidebar">
          <section className="sidebar__section assistant-panel-header">
            <p className="assistant-panel__label">Assistant</p>
          </section>

          <div className="assistant-panel__footer">
            <section className="sidebar__section">
              <ul className="action-list">
                <li>Summarize note</li>
                <li>Discover related notes</li>
                <li>Resolve conflicting notes</li>
              </ul>
            </section>

            <div className="chat-composer" aria-label="Assistant composer">
              Ask Mohio for help
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderWorkspaceNode({
  node,
  selectedDocumentId,
  depth,
  onSelect,
}: {
  node: WorkspaceTreeNode;
  selectedDocumentId: string | null;
  depth: number;
  onSelect: (documentId: string) => void;
}) {
  const rowStyle = {
    paddingInlineStart: `${12 + depth * 18}px`,
  };

  if (node.kind === "directory") {
    return (
      <li className="tree-node tree-node--directory" key={node.id} role="treeitem">
        <div className="tree-node__row tree-node__row--directory" style={rowStyle}>
          <span aria-hidden="true" className="tree-node__kind">
            Dir
          </span>
          <span className="tree-node__label">{node.name}</span>
        </div>

        <ul className="workspace-tree__group" role="group">
          {node.children.map((child) =>
            renderWorkspaceNode({
              node: child,
              selectedDocumentId,
              depth: depth + 1,
              onSelect,
            }),
          )}
        </ul>
      </li>
    );
  }

  const isActive = node.id === selectedDocumentId;

  return (
    <li className="tree-node" key={node.id} role="treeitem">
      <button
        aria-current={isActive ? "page" : undefined}
        className={`tree-node__button${isActive ? " tree-node__button--active" : ""}`}
        onClick={() => {
          onSelect(node.id);
        }}
        style={rowStyle}
        type="button"
      >
        <span aria-hidden="true" className="tree-node__kind">
          MD
        </span>
        <span className="tree-node__label">{getDocumentTitle(node.name)}</span>
      </button>
    </li>
  );
}

function getInitialDocumentId(workspace: WorkspaceSummary | null): string | null {
  if (!workspace) {
    return null;
  }

  return findFirstDocumentId(workspace.documents);
}

function findFirstDocumentId(nodes: WorkspaceTreeNode[]): string | null {
  for (const node of nodes) {
    if (node.kind === "document") {
      return node.id;
    }

    const firstChildDocumentId = findFirstDocumentId(node.children);

    if (firstChildDocumentId) {
      return firstChildDocumentId;
    }
  }

  return null;
}

function findDocumentById(
  nodes: WorkspaceTreeNode[],
  documentId: string,
): WorkspaceDocumentNode | null {
  for (const node of nodes) {
    if (node.kind === "document" && node.id === documentId) {
      return node;
    }

    if (node.kind === "directory") {
      const nestedDocument = findDocumentById(node.children, documentId);

      if (nestedDocument) {
        return nestedDocument;
      }
    }
  }

  return null;
}

function getDocumentTitle(fileName: string): string {
  return fileName.replace(/\.(md|markdown|mdx)$/iu, "");
}

function BoldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
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

function UnderlineIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M5.2 3.6v3.6a2.8 2.8 0 0 0 5.6 0V3.6M4 12.4h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="toolbar-chevron-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4.5 6.5 8 10l3.5-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
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

function BulletedListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6 4h6M6 8h6M6 12h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <circle cx="3.25" cy="4" fill="currentColor" r="0.85" />
      <circle cx="3.25" cy="8" fill="currentColor" r="0.85" />
      <circle cx="3.25" cy="12" fill="currentColor" r="0.85" />
    </svg>
  );
}

function NumberedListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6 4h6M6 8h6M6 12h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
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

function AlignLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.5 4h8M3.5 7h6.2M3.5 10h8M3.5 13h5.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
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

function TableIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.2 4.2h9.6v7.6H3.2zm0 2.5h9.6M6.4 4.2v7.6M9.6 4.2v7.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ClearFormattingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="formatting-icon"
      fill="none"
      viewBox="0 0 16 16"
    >
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
      <path
        d="M11.3 7.3 4.2 8.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export default App;
