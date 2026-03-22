import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AssistantThread,
  WorkspaceDocument,
  WorkspaceDocumentNode,
  WorkspaceSummary,
  WorkspaceTreeNode,
} from "@shared/mohio-types";
import { RichTextEditor } from "./markdown-editor";

type SaveState = "error" | "idle" | "loading" | "saved" | "saving";

const ASSISTANT_QUICK_ACTIONS = [
  "Summarize this note",
  "Organize this note",
  "Suggest related notes from this workspace",
] as const;

interface DocumentSnapshot {
  markdown: string;
  relativePath: string;
  title: string;
}

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [expandedDirectoryIds, setExpandedDirectoryIds] = useState<Set<string>>(new Set());
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isWorkspaceOpening, setIsWorkspaceOpening] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [document, setDocument] = useState<WorkspaceDocument | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [assistantThread, setAssistantThread] = useState<AssistantThread | null>(null);
  const [assistantComposerValue, setAssistantComposerValue] = useState("");
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const lastSavedSnapshotRef = useRef<DocumentSnapshot | null>(null);
  const pendingSaveSnapshotRef = useRef<DocumentSnapshot | null>(null);
  const loadSequenceRef = useRef(0);
  const saveSequenceRef = useRef(0);
  const selectedDocumentIdRef = useRef<string | null>(null);
  const saveStateRef = useRef<SaveState>("idle");
  const draftTitleRef = useRef("");
  const draftMarkdownRef = useRef("");
  const workspacePathRef = useRef<string | null>(null);
  const assistantBodyRef = useRef<HTMLDivElement | null>(null);

  selectedDocumentIdRef.current = selectedDocumentId;
  saveStateRef.current = saveState;
  draftTitleRef.current = draftTitle;
  draftMarkdownRef.current = draftMarkdown;
  workspacePathRef.current = workspace?.path ?? null;

  useEffect(() => {
    let isMounted = true;

    const applyWorkspace = (
      nextWorkspace: WorkspaceSummary | null,
      preferredDocumentId?: string | null,
    ) => {
      if (!isMounted) {
        return;
      }

      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
      setSelectedDocumentId(
        getPreferredDocumentId(
          nextWorkspace,
          preferredDocumentId ?? selectedDocumentIdRef.current,
        ),
      );
      setWorkspaceError(null);
      setIsWorkspaceLoading(false);
    };

    const loadWorkspace = async () => {
      try {
        const currentWorkspace = await window.mohio.getCurrentWorkspace();
        applyWorkspace(currentWorkspace);
      } catch {
        if (!isMounted) {
          return;
        }

        setWorkspaceError("Mohio could not load the current workspace.");
        setIsWorkspaceLoading(false);
      }
    };

    const disposeWorkspaceListener = window.mohio.onWorkspaceChanged((nextWorkspace) => {
      applyWorkspace(nextWorkspace);
    });

    void loadWorkspace();

    return () => {
      isMounted = false;
      disposeWorkspaceListener();
    };
  }, []);

  useEffect(() => {
    if (!selectedDocumentId) {
      setDocument(null);
      setDraftTitle("");
      setDraftMarkdown("");
      setDocumentError(null);
      setSaveState("idle");
      lastSavedSnapshotRef.current = null;
      pendingSaveSnapshotRef.current = null;
      return;
    }

    const loadSequence = loadSequenceRef.current + 1;
    loadSequenceRef.current = loadSequence;
    setSaveState("loading");
    setDocumentError(null);

    void window.mohio.readDocument(selectedDocumentId).then(
      (nextDocument) => {
        if (loadSequence !== loadSequenceRef.current) {
          return;
        }

        setDocument(nextDocument);
        setDraftTitle(nextDocument.displayTitle);
        setDraftMarkdown(nextDocument.markdown);
        lastSavedSnapshotRef.current = {
          relativePath: nextDocument.relativePath,
          title: nextDocument.displayTitle,
          markdown: nextDocument.markdown,
        };
        pendingSaveSnapshotRef.current = null;
        setSaveState("saved");
      },
      () => {
        if (loadSequence !== loadSequenceRef.current) {
          return;
        }

        setDocument(null);
        setDocumentError("Mohio could not load that document.");
        setSaveState("error");
      },
    );
  }, [selectedDocumentId]);

  useEffect(() => {
    void window.mohio.watchDocument(selectedDocumentId);

    return () => {
      void window.mohio.watchDocument(null);
    };
  }, [selectedDocumentId]);

  useEffect(() => {
    const disposeDocumentChangedListener = window.mohio.onDocumentChanged((event) => {
      if (event.relativePath !== selectedDocumentIdRef.current) {
        return;
      }

      if (event.workspace) {
        setWorkspace(event.workspace);
        setExpandedDirectoryIds(getExpandedDirectoryIds(event.workspace));
      } else {
        setWorkspace(null);
      }

      if (!event.document) {
        setDocument(null);
        setDocumentError("This document was removed or renamed on disk.");
        setSelectedDocumentId(getPreferredDocumentId(event.workspace));
        setSaveState("error");
        lastSavedSnapshotRef.current = null;
        pendingSaveSnapshotRef.current = null;
        return;
      }

      const incomingSnapshot = {
        relativePath: event.document.relativePath,
        title: event.document.displayTitle,
        markdown: event.document.markdown,
      };
      const hadUnsavedLocalChanges = !snapshotsMatch(
        {
          relativePath: selectedDocumentIdRef.current ?? event.document.relativePath,
          title: draftTitleRef.current,
          markdown: draftMarkdownRef.current,
        },
        lastSavedSnapshotRef.current,
      );
      const currentDraftSnapshot = {
        relativePath: selectedDocumentIdRef.current ?? event.document.relativePath,
        title: draftTitleRef.current,
        markdown: draftMarkdownRef.current,
      };
      const matchesPendingSave = snapshotsMatch(
        incomingSnapshot,
        pendingSaveSnapshotRef.current,
      );

      setDocument(event.document);
      setSelectedDocumentId(event.document.relativePath);
      setDocumentError(null);
      lastSavedSnapshotRef.current = incomingSnapshot;
      pendingSaveSnapshotRef.current = null;

      if (
        !hadUnsavedLocalChanges ||
        snapshotsMatch(incomingSnapshot, currentDraftSnapshot)
      ) {
        setDraftTitle(event.document.displayTitle);
        setDraftMarkdown(event.document.markdown);
      }

      setSaveState("saved");
    });

    return () => {
      disposeDocumentChangedListener();
    };
  }, []);

  useEffect(() => {
    if (!workspace || !selectedDocumentId) {
      setAssistantThread(null);
      setAssistantError(null);
      setIsAssistantLoading(false);
      return;
    }

    let isMounted = true;
    setIsAssistantLoading(true);
    setAssistantError(null);

    void window.mohio.getAssistantThread(selectedDocumentId).then(
      (thread) => {
        if (!isMounted) {
          return;
        }

        setAssistantThread(thread);
        setAssistantError(thread.errorMessage);
        setIsAssistantLoading(false);
      },
      () => {
        if (!isMounted) {
          return;
        }

        setAssistantThread(getEmptyAssistantThread(selectedDocumentId));
        setAssistantError("Mohio could not load the assistant conversation.");
        setIsAssistantLoading(false);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [selectedDocumentId, workspace]);

  useEffect(() => {
    const disposeAssistantListener = window.mohio.onAssistantEvent((event) => {
      if (
        event.workspacePath !== workspacePathRef.current ||
        event.noteRelativePath !== selectedDocumentIdRef.current
      ) {
        return;
      }

      setAssistantThread(event.thread);
      setAssistantError(event.thread.errorMessage);
      setIsAssistantLoading(false);
    });

    return () => {
      disposeAssistantListener();
    };
  }, []);

  useEffect(() => {
    const assistantBody = assistantBodyRef.current;

    if (!assistantBody) {
      return;
    }

    assistantBody.scrollTop = assistantBody.scrollHeight;
  }, [assistantThread?.messages, assistantThread?.status, isAssistantLoading]);

  const isDirty = useMemo(() => {
    const lastSavedSnapshot = lastSavedSnapshotRef.current;

    if (!document || !lastSavedSnapshot) {
      return false;
    }

    return (
      draftTitle !== lastSavedSnapshot.title ||
      draftMarkdown !== lastSavedSnapshot.markdown ||
      document.relativePath !== lastSavedSnapshot.relativePath
    );
  }, [document, draftMarkdown, draftTitle]);

  useEffect(() => {
    if (!document || !isDirty) {
      if (document && saveState === "loading") {
        return;
      }

      if (document && saveState !== "saved" && saveState !== "saving") {
        setSaveState("saved");
      }

      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveCurrentDocument();
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [document, draftMarkdown, draftTitle, isDirty]);

  const handleOpenWorkspace = async () => {
    try {
      setIsWorkspaceOpening(true);
      const nextWorkspace = await window.mohio.openWorkspace();

      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
      setSelectedDocumentId(getPreferredDocumentId(nextWorkspace));
      setWorkspaceError(null);
    } catch {
      setWorkspaceError("Mohio could not open that folder as a workspace.");
    } finally {
      setIsWorkspaceLoading(false);
      setIsWorkspaceOpening(false);
    }
  };

  const saveCurrentDocument = async () => {
    if (!document) {
      return;
    }

    const lastSavedSnapshot = lastSavedSnapshotRef.current;
    const snapshot = {
      relativePath: document.relativePath,
      title: draftTitle,
      markdown: draftMarkdown,
    };

    if (
      lastSavedSnapshot &&
      snapshot.relativePath === lastSavedSnapshot.relativePath &&
      snapshot.title === lastSavedSnapshot.title &&
      snapshot.markdown === lastSavedSnapshot.markdown
    ) {
      return;
    }

    const saveSequence = saveSequenceRef.current + 1;
    saveSequenceRef.current = saveSequence;
    pendingSaveSnapshotRef.current = snapshot;
    setSaveState("saving");
    setDocumentError(null);

    try {
      const result = await window.mohio.saveDocument(snapshot);
      const refreshedWorkspace = await window.mohio.getCurrentWorkspace();

      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      if (refreshedWorkspace) {
        setWorkspace(refreshedWorkspace);
        setExpandedDirectoryIds(getExpandedDirectoryIds(refreshedWorkspace));
      }

      setSelectedDocumentId(result.relativePath);
      setDocument({
        relativePath: result.relativePath,
        fileName: result.fileName,
        displayTitle: result.displayTitle,
        markdown: result.markdown,
      });
      lastSavedSnapshotRef.current = {
        relativePath: result.relativePath,
        title: snapshot.title,
        markdown: snapshot.markdown,
      };
      setSaveState("saved");
    } catch {
      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      pendingSaveSnapshotRef.current = null;
      setDocumentError("Mohio could not save that document.");
      setSaveState("error");
    }
  };

  const toggleDirectory = (directoryId: string) => {
    setExpandedDirectoryIds((currentExpandedDirectoryIds) => {
      const nextExpandedDirectoryIds = new Set(currentExpandedDirectoryIds);

      if (nextExpandedDirectoryIds.has(directoryId)) {
        nextExpandedDirectoryIds.delete(directoryId);
      } else {
        nextExpandedDirectoryIds.add(directoryId);
      }

      return nextExpandedDirectoryIds;
    });
  };

  const handleSendAssistantMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!workspace || !selectedDocumentId || !document || trimmedMessage.length === 0) {
      return;
    }

    setAssistantComposerValue("");
    setAssistantError(null);

    try {
      const nextThread = await window.mohio.sendAssistantMessage({
        noteRelativePath: selectedDocumentId,
        content: trimmedMessage,
        documentTitle: draftTitle,
        documentMarkdown: draftMarkdown,
      });

      setAssistantThread(nextThread);
    } catch {
      setAssistantError("Mohio could not start Codex for this workspace.");
    }
  };

  const handleCancelAssistantRun = async () => {
    if (!selectedDocumentId) {
      return;
    }

    try {
      await window.mohio.cancelAssistantRun(selectedDocumentId);
    } catch {
      setAssistantError("Mohio could not stop the current Codex run.");
    }
  };

  const assistantHasContext = Boolean(workspace && selectedDocumentId && document);
  const assistantIsBusy = assistantThread?.status === "running";
  const canSendAssistantMessage =
    assistantHasContext &&
    !assistantIsBusy &&
    assistantComposerValue.trim().length > 0;

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

        <div className="top-bar__actions" />
      </header>

      <div className="workspace-shell">
        <aside className="sidebar sidebar--left" data-testid="workspace-sidebar">
          <section className="sidebar__section">
            <h2 className="sidebar__title">Workspace</h2>

            {isWorkspaceLoading ? (
              <p className="workspace-panel__copy">Loading current workspace...</p>
            ) : workspace ? (
              <>
                {workspace.documentCount === 0 ? (
                  <p className="workspace-panel__copy">No Markdown documents found.</p>
                ) : (
                  <ul className="workspace-tree" role="tree">
                    {workspace.documents.map((node) =>
                      renderWorkspaceNode({
                        node,
                        selectedDocumentId,
                        expandedDirectoryIds,
                        depth: 0,
                        onSelect: setSelectedDocumentId,
                        onToggleDirectory: toggleDirectory,
                      }),
                    )}
                  </ul>
                )}
              </>
            ) : (
              <p className="workspace-panel__copy">No workspace is open.</p>
            )}

            {workspaceError ? (
              <p className="workspace-panel__error" role="status">
                {workspaceError}
              </p>
            ) : null}
          </section>
        </aside>

        <main className="editor-panel">
          <div className="editor-panel__inner">
            {workspace && document ? (
              <RichTextEditor
                dataTestId="document-state"
                markdown={draftMarkdown}
                onChange={(nextMarkdown) => {
                  setDraftMarkdown(nextMarkdown);
                }}
                onTitleChange={(nextTitle) => {
                  setDraftTitle(nextTitle);
                }}
                title={draftTitle}
              />
            ) : workspace ? (
              <section className="hello-state" data-testid="document-state">
                <h1>{workspace.name}</h1>
                <p className="hello-state__copy">No Markdown documents found.</p>
              </section>
            ) : (
              <section className="empty-workspace-state" data-testid="document-state">
                <p className="empty-workspace-state__copy">
                  Choose a folder to open your Mohio workspace.
                </p>
                <button
                  className="primary-button empty-workspace-state__button"
                  disabled={isWorkspaceOpening}
                  onClick={() => {
                    void handleOpenWorkspace();
                  }}
                  type="button"
                >
                  {isWorkspaceOpening ? "Opening Workspace ..." : "Choose folder"}
                </button>
              </section>
            )}

            {documentError ? (
              <p className="workspace-panel__error editor-panel__error" role="status">
                {documentError}
              </p>
            ) : null}
          </div>
        </main>

        <aside className="sidebar sidebar--right" data-testid="assistant-sidebar">
          <section className="sidebar__section assistant-panel-header">
            <p className="assistant-panel__label">Assistant</p>
            {!workspace || !selectedDocumentId ? (
              <p className="workspace-panel__copy">Open a workspace note to chat with Codex</p>
            ) : null}
          </section>

          <div
            ref={assistantBodyRef}
            className="assistant-panel__body"
            data-testid="assistant-transcript"
          >
            {!workspace ? null : !selectedDocumentId || !document ? (
              <p className="assistant-panel__copy">
                Select a note to open a note-specific assistant thread.
              </p>
            ) : isAssistantLoading ? (
              <p className="assistant-panel__copy">Loading the conversation for this note...</p>
            ) : assistantThread && assistantThread.messages.length > 0 ? (
              <ol className="assistant-message-list" aria-live="polite">
                {assistantThread.messages.map((message) => (
                  <li
                    className={`assistant-message assistant-message--${message.role}`}
                    key={message.id}
                  >
                    <p className="assistant-message__role">
                      {message.role === "assistant" ? "Codex" : "You"}
                    </p>
                    <p className="assistant-message__content">
                      {message.content || (message.role === "assistant" && assistantIsBusy ? "Thinking..." : "")}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>

          <div className="assistant-panel__footer">
            <section className="sidebar__section">
              <ul className="action-list">
                {ASSISTANT_QUICK_ACTIONS.map((action) => (
                  <li key={action}>
                    <button
                      className="assistant-action-chip"
                      disabled={!assistantHasContext || assistantIsBusy}
                      onClick={() => {
                        void handleSendAssistantMessage(action);
                      }}
                      type="button"
                    >
                      {action}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {assistantError ? (
              <p className="workspace-panel__error" role="status">
                {assistantError}
              </p>
            ) : null}

            <form
              className="assistant-composer"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendAssistantMessage(assistantComposerValue);
              }}
            >
              <input
                aria-label="Assistant composer"
                className="chat-composer"
                data-testid="assistant-composer-input"
                disabled={!assistantHasContext || assistantIsBusy}
                onChange={(event) => {
                  setAssistantComposerValue(event.target.value);
                }}
                placeholder={
                  assistantHasContext
                    ? "Ask Codex about this note or workspace"
                    : "Select a note to chat with Codex"
                }
                type="text"
                value={assistantComposerValue}
              />

              <div className="assistant-composer__actions">
                <button
                  className="ghost-button"
                  disabled={!assistantIsBusy}
                  onClick={() => {
                    void handleCancelAssistantRun();
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  disabled={!canSendAssistantMessage}
                  type="submit"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderWorkspaceNode({
  node,
  selectedDocumentId,
  expandedDirectoryIds,
  depth,
  onSelect,
  onToggleDirectory,
}: {
  node: WorkspaceTreeNode;
  selectedDocumentId: string | null;
  expandedDirectoryIds: Set<string>;
  depth: number;
  onSelect: (documentId: string) => void;
  onToggleDirectory: (directoryId: string) => void;
}) {
  const rowStyle = {
    paddingInlineStart: `${12 + depth * 18}px`,
  };

  if (node.kind === "directory") {
    const isExpanded = expandedDirectoryIds.has(node.id);

    return (
      <li className="tree-node tree-node--directory" key={node.id} role="treeitem">
        <button
          aria-expanded={isExpanded}
          className="tree-node__row tree-node__row--directory tree-node__row--toggle"
          onClick={() => {
            onToggleDirectory(node.id);
          }}
          style={rowStyle}
          type="button"
        >
          <span className="tree-node__chevron" aria-hidden="true">
            <TreeChevronIcon isExpanded={isExpanded} />
          </span>
          <span className="tree-node__label">{node.name}</span>
        </button>

        {isExpanded ? (
          <ul className="workspace-tree__group" role="group">
            {node.children.map((child) =>
              renderWorkspaceNode({
                node: child,
                selectedDocumentId,
                expandedDirectoryIds,
                depth: depth + 1,
                onSelect,
                onToggleDirectory,
              }),
            )}
          </ul>
        ) : null}
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
        <span className="tree-node__label">{node.displayTitle}</span>
      </button>
    </li>
  );
}

function getExpandedDirectoryIds(workspace: WorkspaceSummary | null): Set<string> {
  if (!workspace) {
    return new Set();
  }

  return new Set(collectDirectoryIds(workspace.documents));
}

function collectDirectoryIds(nodes: WorkspaceTreeNode[]): string[] {
  const directoryIds: string[] = [];

  for (const node of nodes) {
    if (node.kind === "directory") {
      directoryIds.push(node.id, ...collectDirectoryIds(node.children));
    }
  }

  return directoryIds;
}

function getPreferredDocumentId(
  workspace: WorkspaceSummary | null,
  preferredDocumentId?: string | null,
): string | null {
  if (!workspace) {
    return null;
  }

  if (preferredDocumentId && findDocumentById(workspace.documents, preferredDocumentId)) {
    return preferredDocumentId;
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

function getSaveStateLabel(saveState: SaveState, isDirty: boolean): string {
  if (saveState === "loading") {
    return "Loading";
  }

  if (saveState === "saving") {
    return "Saving...";
  }

  if (saveState === "error") {
    return "Save failed";
  }

  if (isDirty) {
    return "Unsaved changes";
  }

  return "Saved";
}

function snapshotsMatch(
  left: DocumentSnapshot | null,
  right: DocumentSnapshot | null,
): boolean {
  if (!left || !right) {
    return false;
  }

  return (
    left.relativePath === right.relativePath &&
    left.title === right.title &&
    left.markdown === right.markdown
  );
}

function getEmptyAssistantThread(noteRelativePath: string): AssistantThread {
  return {
    noteRelativePath,
    messages: [],
    status: "idle",
    errorMessage: null,
  };
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="toolbar-chevron-icon" fill="none" viewBox="0 0 16 16">
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

function TreeChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg aria-hidden="true" className="tree-chevron-icon" fill="none" viewBox="0 0 16 16">
      <path
        d={isExpanded ? "M4.75 6.5 8 9.75 11.25 6.5" : "M6.5 4.75 9.75 8 6.5 11.25"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

export default App;
