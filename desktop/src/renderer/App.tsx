import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Columns2,
  FileText,
  History as HistoryIcon,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Search,
  SendHorizontal,
  SquarePen,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AssistantThread,
  AssistantThreadSummary,
  CommitHistoryEntry,
  PublishSummary,
  RelatedDocument,
  SyncState,
  UnpublishedDiffResult,
  WorkspaceDocument,
  WorkspaceSummary,
  WorkspaceTreeNode,
  WorkspaceSearchMatch,
} from "@shared/mohio-types";
import { RichTextEditor } from "./markdown-editor";

type SaveState = "error" | "idle" | "loading" | "saved" | "saving";
type LeftSidebarTab = "documents" | "unpublished";
type PaneId = "primary" | "secondary";
type RightSidebarTab = "assistant" | "history" | "related";

interface PaneTabsState {
  activePath: string | null;
  paths: string[];
}

interface DocumentContextMenuState {
  documentId: string;
  x: number;
  y: number;
}

interface EditorSnapshot {
  markdown: string;
  relativePath: string;
  title: string;
}

interface DocumentEditorSession {
  document: WorkspaceDocument | null;
  draftMarkdown: string;
  draftTitle: string;
  isDirty: boolean;
  relativePath: string | null;
  saveNow: () => Promise<void>;
  saveState: SaveState;
  setDraftMarkdown: (value: string) => void;
  setDraftTitle: (value: string) => void;
}

function useDocumentEditorSession({
  onRelativePathChange,
  relativePath,
}: {
  onRelativePathChange: (nextRelativePath: string) => void;
  relativePath: string | null;
}): DocumentEditorSession {
  const [document, setDocument] = useState<WorkspaceDocument | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedSnapshotRef = useRef<EditorSnapshot | null>(null);
  const loadTokenRef = useRef(0);
  const saveTokenRef = useRef(0);

  useEffect(() => {
    if (!relativePath) {
      setDocument(null);
      setDraftTitle("");
      setDraftMarkdown("");
      setSaveState("idle");
      lastSavedSnapshotRef.current = null;
      return;
    }

    const loadToken = loadTokenRef.current + 1;
    loadTokenRef.current = loadToken;
    setSaveState("loading");

    void window.mohio.readDocument(relativePath).then(
      (nextDocument) => {
        if (loadToken !== loadTokenRef.current) {
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
        setSaveState("saved");
      },
      () => {
        if (loadToken !== loadTokenRef.current) {
          return;
        }

        setDocument(null);
        setDraftTitle("");
        setDraftMarkdown("");
        setSaveState("error");
      },
    );
  }, [relativePath]);

  const isDirty = useMemo(() => {
    const snapshot = lastSavedSnapshotRef.current;

    if (!document || !snapshot) {
      return false;
    }

    return snapshot.title !== draftTitle || snapshot.markdown !== draftMarkdown;
  }, [document, draftMarkdown, draftTitle]);

  const saveNow = async () => {
    if (!document) {
      return;
    }

    const snapshot = lastSavedSnapshotRef.current;

    if (
      snapshot &&
      snapshot.title === draftTitle &&
      snapshot.markdown === draftMarkdown &&
      snapshot.relativePath === document.relativePath
    ) {
      return;
    }

    const saveToken = saveTokenRef.current + 1;
    saveTokenRef.current = saveToken;
    setSaveState("saving");

    try {
      const result = await window.mohio.saveDocument({
        relativePath: document.relativePath,
        title: draftTitle,
        markdown: draftMarkdown,
        titleMode: document.titleMode,
      });

      if (saveToken !== saveTokenRef.current) {
        return;
      }

      const nextDocument: WorkspaceDocument = {
        relativePath: result.relativePath,
        fileName: result.fileName,
        displayTitle: result.displayTitle,
        markdown: result.markdown,
        titleMode: result.titleMode,
      };

      setDocument(nextDocument);
      setDraftTitle(result.displayTitle);
      setDraftMarkdown(result.markdown);
      lastSavedSnapshotRef.current = {
        relativePath: result.relativePath,
        title: result.displayTitle,
        markdown: result.markdown,
      };
      setSaveState("saved");

      if (result.relativePath !== document.relativePath) {
        onRelativePathChange(result.relativePath);
      }
    } catch {
      if (saveToken !== saveTokenRef.current) {
        return;
      }

      setSaveState("error");
    }
  };

  useEffect(() => {
    if (!document || !isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveNow();
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [document?.relativePath, draftMarkdown, draftTitle, isDirty]);

  return {
    relativePath,
    document,
    draftTitle,
    draftMarkdown,
    setDraftTitle,
    setDraftMarkdown,
    saveState,
    saveNow,
    isDirty,
  };
}

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [expandedDirectoryIds, setExpandedDirectoryIds] = useState<Set<string>>(new Set());
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isWorkspaceOpening, setIsWorkspaceOpening] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [leftSidebarTab, setLeftSidebarTab] = useState<LeftSidebarTab>("documents");
  const [rightSidebarTab, setRightSidebarTab] = useState<RightSidebarTab>("assistant");
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isSplitView, setIsSplitView] = useState(false);
  const [activePaneId, setActivePaneId] = useState<PaneId>("primary");
  const [primaryTabs, setPrimaryTabs] = useState<PaneTabsState>({ activePath: null, paths: [] });
  const [secondaryTabs, setSecondaryTabs] = useState<PaneTabsState>({ activePath: null, paths: [] });
  const [documentContextMenu, setDocumentContextMenu] = useState<DocumentContextMenuState | null>(null);

  const [publishSummary, setPublishSummary] = useState<PublishSummary | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [commitHistory, setCommitHistory] = useState<CommitHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [unpublishedDiff, setUnpublishedDiff] = useState<UnpublishedDiffResult | null>(null);
  const [unpublishedDiffError, setUnpublishedDiffError] = useState<string | null>(null);
  const [isUnpublishedDiffLoading, setIsUnpublishedDiffLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkspaceSearchMatch[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocument[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const [assistantThreads, setAssistantThreads] = useState<AssistantThreadSummary[]>([]);
  const [assistantThread, setAssistantThread] = useState<AssistantThread | null>(null);
  const [assistantComposerValue, setAssistantComposerValue] = useState("");
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const updatePanePath = (paneId: PaneId, nextPath: string | null) => {
    if (paneId === "primary") {
      setPrimaryTabs((current) => {
        const nextPaths = current.paths.includes(nextPath ?? "")
          ? current.paths
          : nextPath
            ? [nextPath, ...current.paths.filter((entry) => entry !== nextPath)]
            : current.paths;

        return {
          activePath: nextPath,
          paths: nextPaths,
        };
      });
      return;
    }

    setSecondaryTabs((current) => {
      const nextPaths = current.paths.includes(nextPath ?? "")
        ? current.paths
        : nextPath
          ? [nextPath, ...current.paths.filter((entry) => entry !== nextPath)]
          : current.paths;

      return {
        activePath: nextPath,
        paths: nextPaths,
      };
    });
  };

  const primaryEditor = useDocumentEditorSession({
    relativePath: primaryTabs.activePath,
    onRelativePathChange: (nextRelativePath) => {
      setPrimaryTabs((current) => ({
        activePath: nextRelativePath,
        paths: current.paths.map((relativePath) => (
          relativePath === current.activePath ? nextRelativePath : relativePath
        )),
      }));
    },
  });

  const secondaryEditor = useDocumentEditorSession({
    relativePath: secondaryTabs.activePath,
    onRelativePathChange: (nextRelativePath) => {
      setSecondaryTabs((current) => ({
        activePath: nextRelativePath,
        paths: current.paths.map((relativePath) => (
          relativePath === current.activePath ? nextRelativePath : relativePath
        )),
      }));
    },
  });

  const activeEditor = activePaneId === "secondary" && isSplitView
    ? secondaryEditor
    : primaryEditor;
  const activeDocumentPath = activeEditor.relativePath;
  const activeDocument = activeEditor.document;
  const activeDraftTitle = activeEditor.draftTitle;
  const activeDraftMarkdown = activeEditor.draftMarkdown;

  const refreshWorkspaceSummary = async () => {
    try {
      const nextWorkspace = await window.mohio.getCurrentWorkspace();
      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
      setWorkspaceError(null);
      setIsWorkspaceLoading(false);

      if (!nextWorkspace) {
        setPrimaryTabs({ activePath: null, paths: [] });
        setSecondaryTabs({ activePath: null, paths: [] });
        return;
      }

      const availablePaths = new Set(collectDocumentIds(nextWorkspace.documents));

      setPrimaryTabs((current) => {
        const filteredPaths = current.paths.filter((relativePath) => availablePaths.has(relativePath));
        const fallbackPath = getPreferredDocumentId(nextWorkspace);
        const nextActivePath = (
          current.activePath && availablePaths.has(current.activePath)
            ? current.activePath
            : filteredPaths[0] ?? fallbackPath
        ) ?? null;

        return {
          activePath: nextActivePath,
          paths: filteredPaths.length > 0
            ? filteredPaths
            : nextActivePath
              ? [nextActivePath]
              : [],
        };
      });

      setSecondaryTabs((current) => {
        const filteredPaths = current.paths.filter((relativePath) => availablePaths.has(relativePath));
        const nextActivePath = (
          current.activePath && availablePaths.has(current.activePath)
            ? current.activePath
            : filteredPaths[0] ?? null
        );

        return {
          activePath: nextActivePath,
          paths: filteredPaths,
        };
      });
    } catch {
      setWorkspaceError("Mohio could not load the current workspace.");
      setIsWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    void refreshWorkspaceSummary();

    const disposeWorkspaceListener = window.mohio.onWorkspaceChanged((nextWorkspace) => {
      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
    });

    return () => {
      disposeWorkspaceListener();
    };
  }, []);

  const refreshPublishSummary = async () => {
    if (!workspace) {
      setPublishSummary(null);
      return;
    }

    try {
      const summary = await window.mohio.getPublishSummary();
      setPublishSummary(summary);
      setPublishError(null);
    } catch {
      setPublishError("Mohio could not load publishing status.");
    }
  };

  const refreshSyncState = async () => {
    if (!workspace) {
      setSyncState(null);
      return;
    }

    try {
      const state = await window.mohio.getSyncState();
      setSyncState(state);
      setSyncError(null);
    } catch {
      setSyncError("Mohio could not load sync status.");
    }
  };

  useEffect(() => {
    if (!workspace) {
      setPublishSummary(null);
      setSyncState(null);
      return;
    }

    void refreshPublishSummary();
    void refreshSyncState();
  }, [workspace?.path]);

  useEffect(() => {
    if (!workspace || !activeDocumentPath || leftSidebarTab !== "unpublished") {
      setUnpublishedDiff(null);
      setUnpublishedDiffError(null);
      setIsUnpublishedDiffLoading(false);
      return;
    }

    setIsUnpublishedDiffLoading(true);

    void window.mohio.getUnpublishedDiff(activeDocumentPath).then(
      (result) => {
        setUnpublishedDiff(result);
        setUnpublishedDiffError(null);
        setIsUnpublishedDiffLoading(false);
      },
      () => {
        setUnpublishedDiff(null);
        setUnpublishedDiffError("Mohio could not load the remote vs local diff for this document.");
        setIsUnpublishedDiffLoading(false);
      },
    );
  }, [activeDocumentPath, leftSidebarTab, workspace?.path]);

  useEffect(() => {
    if (!workspace || !activeDocumentPath) {
      setCommitHistory([]);
      return;
    }

    setIsHistoryLoading(true);

    void window.mohio.listCommitHistory(activeDocumentPath).then(
      (entries) => {
        setCommitHistory(entries);
        setHistoryError(null);
        setIsHistoryLoading(false);
      },
      () => {
        setCommitHistory([]);
        setHistoryError("Mohio could not load commit history for this document.");
        setIsHistoryLoading(false);
      },
    );
  }, [activeDocumentPath, workspace?.path]);

  useEffect(() => {
    if (!workspace || searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearchLoading(true);

      void window.mohio.searchWorkspace(searchQuery).then(
        (results) => {
          setSearchResults(results);
          setIsSearchLoading(false);
        },
        () => {
          setSearchResults([]);
          setIsSearchLoading(false);
        },
      );
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, workspace?.path]);

  useEffect(() => {
    if (!workspace || !activeDocumentPath) {
      setRelatedDocuments([]);
      setRelatedError(null);
      setIsRelatedLoading(false);
      return;
    }

    if (rightSidebarTab !== "related") {
      return;
    }

    setIsRelatedLoading(true);

    void window.mohio.getRelatedDocuments(activeDocumentPath).then(
      (results) => {
        setRelatedDocuments(results);
        setRelatedError(null);
        setIsRelatedLoading(false);
      },
      () => {
        setRelatedDocuments([]);
        setRelatedError("Mohio could not load related notes.");
        setIsRelatedLoading(false);
      },
    );
  }, [activeDocumentPath, rightSidebarTab, workspace?.path]);

  useEffect(() => {
    if (!workspace) {
      setAssistantThreads([]);
      setAssistantThread(null);
      setAssistantComposerValue("");
      setAssistantError(null);
      return;
    }

    void window.mohio.listAssistantThreads().then(
      (threads) => {
        setAssistantThreads(threads);
      },
      () => {
        setAssistantThreads([]);
      },
    );
  }, [workspace?.path]);

  const unpublishedDocumentCount = publishSummary?.unpublishedCount ?? 0;
  const leftSidebarNodes = leftSidebarTab === "documents"
    ? (workspace?.documents ?? [])
    : (publishSummary?.unpublishedTree ?? []);
  const leftSidebarDocumentCount = countWorkspaceDocuments(leftSidebarNodes);

  const handleOpenWorkspace = async () => {
    try {
      setIsWorkspaceOpening(true);
      const nextWorkspace = await window.mohio.openWorkspace();
      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
      setWorkspaceError(null);

      const preferredPath = getPreferredDocumentId(nextWorkspace);
      setPrimaryTabs({
        activePath: preferredPath,
        paths: preferredPath ? [preferredPath] : [],
      });
      setSecondaryTabs({
        activePath: null,
        paths: [],
      });
      setIsSplitView(false);
      setActivePaneId("primary");
      setSearchQuery("");
    } catch {
      setWorkspaceError("Mohio could not open that folder as a workspace.");
    } finally {
      setIsWorkspaceLoading(false);
      setIsWorkspaceOpening(false);
    }
  };

  const openDocumentInPane = async ({
    newTab,
    paneId,
    relativePath,
  }: {
    newTab: boolean;
    paneId: PaneId;
    relativePath: string;
  }) => {
    const editor = paneId === "secondary" ? secondaryEditor : primaryEditor;
    await editor.saveNow().catch(() => undefined);

    if (paneId === "primary") {
      setPrimaryTabs((current) => {
        if (newTab) {
          if (current.paths.includes(relativePath)) {
            return {
              activePath: relativePath,
              paths: current.paths,
            };
          }

          return {
            activePath: relativePath,
            paths: [...current.paths, relativePath],
          };
        }

        if (!current.activePath) {
          return {
            activePath: relativePath,
            paths: [relativePath],
          };
        }

        const nextPaths = current.paths.map((pathEntry) => (
          pathEntry === current.activePath ? relativePath : pathEntry
        ));

        return {
          activePath: relativePath,
          paths: nextPaths.includes(relativePath)
            ? nextPaths
            : [relativePath, ...nextPaths],
        };
      });
      setActivePaneId("primary");
      return;
    }

    setSecondaryTabs((current) => {
      if (newTab) {
        if (current.paths.includes(relativePath)) {
          return {
            activePath: relativePath,
            paths: current.paths,
          };
        }

        return {
          activePath: relativePath,
          paths: [...current.paths, relativePath],
        };
      }

      if (!current.activePath) {
        return {
          activePath: relativePath,
          paths: [relativePath],
        };
      }

      const nextPaths = current.paths.map((pathEntry) => (
        pathEntry === current.activePath ? relativePath : pathEntry
      ));

      return {
        activePath: relativePath,
        paths: nextPaths.includes(relativePath)
          ? nextPaths
          : [relativePath, ...nextPaths],
      };
    });
    setActivePaneId("secondary");
  };

  const openDocumentInSplit = async (relativePath: string) => {
    setIsSplitView(true);

    await openDocumentInPane({
      relativePath,
      paneId: "secondary",
      newTab: secondaryTabs.activePath !== null,
    });
  };

  const closePaneTab = (paneId: PaneId, relativePath: string) => {
    if (paneId === "primary") {
      setPrimaryTabs((current) => {
        const nextPaths = current.paths.filter((pathEntry) => pathEntry !== relativePath);
        const nextActivePath = current.activePath === relativePath
          ? nextPaths[nextPaths.length - 1] ?? getPreferredDocumentId(workspace)
          : current.activePath;

        return {
          activePath: nextActivePath,
          paths: nextPaths.length > 0
            ? nextPaths
            : nextActivePath
              ? [nextActivePath]
              : [],
        };
      });
      return;
    }

    setSecondaryTabs((current) => {
      const nextPaths = current.paths.filter((pathEntry) => pathEntry !== relativePath);
      const nextActivePath = current.activePath === relativePath
        ? nextPaths[nextPaths.length - 1] ?? null
        : current.activePath;

      return {
        activePath: nextActivePath,
        paths: nextPaths,
      };
    });

    if (secondaryTabs.paths.length <= 1) {
      setIsSplitView(false);
      setActivePaneId("primary");
    }
  };

  const handleSelectDocument = (documentId: string, newTab = false) => {
    void openDocumentInPane({
      relativePath: documentId,
      paneId: activePaneId,
      newTab,
    });

    if (leftSidebarTab === "unpublished") {
      setRightSidebarTab("history");
    }
  };

  const handleCreateDocument = async () => {
    if (!workspace) {
      return;
    }

    const targetPath = activePaneId === "secondary" && isSplitView
      ? secondaryTabs.activePath
      : primaryTabs.activePath;
    const directoryRelativePath = getDocumentDirectoryRelativePath(targetPath);

    try {
      const nextDocument = await window.mohio.createDocument({ directoryRelativePath });
      await refreshWorkspaceSummary();
      await refreshPublishSummary();

      await openDocumentInPane({
        relativePath: nextDocument.relativePath,
        paneId: activePaneId,
        newTab: true,
      });
    } catch {
      setWorkspaceError("Mohio could not create a new note.");
    }
  };

  const handleDeleteDocument = async (relativePath: string) => {
    if (!workspace) {
      return;
    }

    const confirmed = window.confirm("Delete this note from the workspace?");

    if (!confirmed) {
      return;
    }

    setDocumentContextMenu(null);

    try {
      await window.mohio.deleteDocument(relativePath);
      await refreshWorkspaceSummary();
      await refreshPublishSummary();

      setPrimaryTabs((current) => {
        const nextPaths = current.paths.filter((entry) => entry !== relativePath);
        const nextActivePath = current.activePath === relativePath
          ? nextPaths[0] ?? getPreferredDocumentId(workspace)
          : current.activePath;

        return {
          activePath: nextActivePath,
          paths: nextPaths,
        };
      });

      setSecondaryTabs((current) => {
        const nextPaths = current.paths.filter((entry) => entry !== relativePath);
        const nextActivePath = current.activePath === relativePath
          ? nextPaths[0] ?? null
          : current.activePath;

        return {
          activePath: nextActivePath,
          paths: nextPaths,
        };
      });
    } catch {
      setWorkspaceError("Mohio could not delete that note.");
    }
  };

  const handlePublishWorkspaceChanges = async () => {
    if (!workspace) {
      return;
    }

    try {
      setIsPublishing(true);
      await window.mohio.publishWorkspaceChanges();
      await refreshPublishSummary();
    } catch {
      setPublishError("Mohio could not publish your workspace changes.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendAssistantMessage = async () => {
    const trimmedMessage = assistantComposerValue.trim();

    if (!workspace || !activeDocumentPath || !activeDocument || trimmedMessage.length === 0) {
      return;
    }

    setAssistantComposerValue("");

    try {
      let threadId = assistantThread?.id;

      if (!threadId) {
        const nextThread = await window.mohio.createAssistantThread();
        threadId = nextThread.id;
      }

      if (!threadId) {
        return;
      }

      const nextThread = await window.mohio.sendAssistantMessage({
        threadId,
        noteRelativePath: activeDocumentPath,
        content: trimmedMessage,
        documentTitle: activeDraftTitle,
        documentMarkdown: activeDraftMarkdown,
      });

      setAssistantThread(nextThread);
      setAssistantError(null);
      const nextThreads = await window.mohio.listAssistantThreads();
      setAssistantThreads(nextThreads);
    } catch {
      setAssistantError("Mohio could not send that message to Codex.");
    }
  };

  const openRelativePathFromLink = (rawTarget: string, paneId: PaneId) => {
    if (!workspace) {
      return;
    }

    const sourcePath = paneId === "secondary"
      ? secondaryTabs.activePath
      : primaryTabs.activePath;

    if (!sourcePath) {
      return;
    }

    const resolvedPath = resolveInternalLinkPath({
      rawTarget,
      sourceRelativePath: sourcePath,
      workspace,
    });

    if (!resolvedPath) {
      return;
    }

    void openDocumentInPane({
      paneId,
      relativePath: resolvedPath,
      newTab: false,
    });
  };

  const workspaceShellClassName = `workspace-shell${isLeftPanelOpen ? "" : " workspace-shell--left-collapsed"}${isRightPanelOpen ? "" : " workspace-shell--right-collapsed"}`;

  return (
    <div className="app-shell">
      <header className="top-bar" data-testid="top-bar">
        <div className="top-bar__context">
          <button
            aria-label={isLeftPanelOpen ? "Collapse left panel" : "Open left panel"}
            className="top-bar__icon-action"
            onClick={() => {
              setIsLeftPanelOpen((currentState) => !currentState);
            }}
            type="button"
          >
            {isLeftPanelOpen
              ? <PanelLeftClose aria-hidden="true" className="top-bar__icon-action-icon" />
              : <PanelLeft aria-hidden="true" className="top-bar__icon-action-icon" />}
          </button>

          <button
            aria-label={workspace ? `Switch workspace from ${workspace.name}` : "Select workspace"}
            className="workspace-label workspace-label--button"
            disabled={isWorkspaceOpening}
            onClick={() => {
              void handleOpenWorkspace();
            }}
            type="button"
          >
            <span className="workspace-label__name">{workspace?.name ?? "Open Workspace"}</span>
            <span className="workspace-label__chevron" aria-hidden="true">
              <ChevronDown aria-hidden="true" className="toolbar-chevron-icon" />
            </span>
          </button>

          <div className="top-bar__context-actions">
            <button
              aria-label="Quick New Note"
              className="top-bar__icon-action"
              disabled={!workspace}
              onClick={() => {
                void handleCreateDocument();
              }}
              type="button"
            >
              <SquarePen aria-hidden="true" className="top-bar__icon-action-icon" />
            </button>
            <button
              aria-label="Quick Publish"
              className="top-bar__icon-action"
              disabled={!workspace || isPublishing || unpublishedDocumentCount === 0}
              onClick={() => {
                void handlePublishWorkspaceChanges();
              }}
              type="button"
            >
              <Upload aria-hidden="true" className="top-bar__icon-action-icon" />
              {unpublishedDocumentCount > 0 ? (
                <span className="top-bar__icon-badge" aria-label={`${unpublishedDocumentCount} unpublished documents`}>
                  {unpublishedDocumentCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="top-bar__search">
          <div className="search-input-wrap">
            <Search aria-hidden="true" className="search-input-wrap__icon" />
            <input
              aria-label="Search workspace"
              className="search-input search-input--top-bar"
              onChange={(event) => {
                setSearchQuery(event.target.value);
              }}
              placeholder={workspace ? `Search ${workspace.name}` : "Search workspace"}
              type="search"
              value={searchQuery}
            />
          </div>
        </div>

        <div className="top-bar__actions">
          <button
            aria-label={isRightPanelOpen ? "Collapse right panel" : "Open right panel"}
            className="top-bar__icon-action"
            onClick={() => {
              setIsRightPanelOpen((currentState) => !currentState);
            }}
            type="button"
          >
            {isRightPanelOpen
              ? <PanelRightClose aria-hidden="true" className="top-bar__icon-action-icon" />
              : <PanelRight aria-hidden="true" className="top-bar__icon-action-icon" />}
          </button>
        </div>
      </header>

      <div className={workspaceShellClassName}>
        {isLeftPanelOpen ? (
          <aside className="sidebar sidebar--left" data-testid="workspace-sidebar">
            <section className="sidebar__section sidebar__section--edge-tabs">
              <div className="sidebar-tabs sidebar-tabs--full-width" role="tablist" aria-label="Workspace views">
                <button
                  aria-selected={leftSidebarTab === "documents"}
                  className={`sidebar-tab sidebar-tab--full-width${leftSidebarTab === "documents" ? " sidebar-tab--active" : ""}`}
                  onClick={() => {
                    setLeftSidebarTab("documents");
                  }}
                  role="tab"
                  type="button"
                >
                  <FileText aria-hidden="true" className="sidebar-tab__icon" />
                  Documents
                </button>
                <button
                  aria-selected={leftSidebarTab === "unpublished"}
                  className={`sidebar-tab sidebar-tab--full-width${leftSidebarTab === "unpublished" ? " sidebar-tab--active" : ""}`}
                  onClick={() => {
                    setLeftSidebarTab("unpublished");
                  }}
                  role="tab"
                  type="button"
                >
                  <Upload aria-hidden="true" className="sidebar-tab__icon" />
                  Unpublished
                  {unpublishedDocumentCount > 0 ? (
                    <span className="sidebar-tab__badge">{unpublishedDocumentCount}</span>
                  ) : null}
                </button>
              </div>
            </section>

            <section className="sidebar__section workspace-panel">
              <div className="workspace-panel__scroll">
                {isWorkspaceLoading ? (
                  <p className="workspace-panel__copy">Loading current workspace...</p>
                ) : workspace ? (
                  searchQuery.trim().length > 0 && leftSidebarTab === "documents" ? (
                    <div className="workspace-search-results" data-testid="workspace-search-results">
                      {isSearchLoading ? (
                        <p className="workspace-panel__copy">Searching workspace...</p>
                      ) : searchResults.length === 0 ? (
                        <p className="workspace-panel__copy">No matching notes found.</p>
                      ) : (
                        <ul className="workspace-tree" role="list">
                          {searchResults.map((result) => (
                            <li className="tree-node" key={`${result.relativePath}-${result.matchType}`}>
                              <button
                                className="tree-node__button"
                                onClick={() => {
                                  handleSelectDocument(result.relativePath, false);
                                }}
                                onContextMenu={(event) => {
                                  event.preventDefault();
                                  setDocumentContextMenu({
                                    documentId: result.relativePath,
                                    x: event.clientX,
                                    y: event.clientY,
                                  });
                                }}
                                onDoubleClick={() => {
                                  handleSelectDocument(result.relativePath, true);
                                }}
                                type="button"
                              >
                                <span className="tree-node__label">{result.displayTitle}</span>
                              </button>
                              {result.snippet ? (
                                <p className="workspace-search-results__snippet">{result.snippet}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : leftSidebarDocumentCount === 0 ? (
                    <p className="workspace-panel__copy">
                      {leftSidebarTab === "documents"
                        ? "No Markdown documents found."
                        : "No unpublished documents in this workspace."}
                    </p>
                  ) : (
                    <ul className="workspace-tree" role="tree">
                      {leftSidebarNodes.map((node) =>
                        renderWorkspaceNode({
                          node,
                          selectedDocumentId: activeDocumentPath,
                          expandedDirectoryIds,
                          depth: 0,
                          onSelect: (documentId) => {
                            handleSelectDocument(documentId, false);
                          },
                          onDoubleSelect: (documentId) => {
                            handleSelectDocument(documentId, true);
                          },
                          onOpenDocumentContextMenu: (input) => {
                            setDocumentContextMenu(input);
                          },
                          onToggleDirectory: (directoryId) => {
                            setExpandedDirectoryIds((current) => {
                              const next = new Set(current);

                              if (next.has(directoryId)) {
                                next.delete(directoryId);
                              } else {
                                next.add(directoryId);
                              }

                              return next;
                            });
                          },
                        }),
                      )}
                    </ul>
                  )
                ) : (
                  <p className="workspace-panel__copy">No workspace is open.</p>
                )}

                {workspaceError ? <p className="workspace-panel__error" role="status">{workspaceError}</p> : null}
                {publishError ? <p className="workspace-panel__error" role="status">{publishError}</p> : null}
                {syncError ? <p className="workspace-panel__error" role="status">{syncError}</p> : null}

                {documentContextMenu ? (
                  <div
                    className="workspace-document-menu"
                    role="menu"
                    style={{
                      left: `${Math.max(8, documentContextMenu.x)}px`,
                      top: `${Math.max(8, documentContextMenu.y)}px`,
                    }}
                  >
                    <button
                      className="workspace-document-menu__item"
                      onClick={() => {
                        handleSelectDocument(documentContextMenu.documentId, true);
                        setDocumentContextMenu(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span>Open in New Tab</span>
                    </button>
                    <button
                      className="workspace-document-menu__item"
                      onClick={() => {
                        void openDocumentInSplit(documentContextMenu.documentId);
                        setDocumentContextMenu(null);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span>Open in Split View</span>
                    </button>
                    <button
                      className="workspace-document-menu__item workspace-document-menu__item--danger"
                      onClick={() => {
                        void handleDeleteDocument(documentContextMenu.documentId);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="workspace-document-menu__icon" />
                      <span>Delete Note</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="workspace-panel__footer-action">
                {leftSidebarTab === "documents" ? (
                  <button
                    aria-label="New Note"
                    className="primary-button workspace-panel__footer-button"
                    disabled={!workspace}
                    onClick={() => {
                      void handleCreateDocument();
                    }}
                    type="button"
                  >
                    <SquarePen aria-hidden="true" className="workspace-panel__footer-button-icon" />
                    <span>New Note</span>
                  </button>
                ) : (
                  <button
                    aria-label="Publish"
                    className="primary-button workspace-panel__footer-button"
                    disabled={!workspace || isPublishing || unpublishedDocumentCount === 0}
                    onClick={() => {
                      void handlePublishWorkspaceChanges();
                    }}
                    type="button"
                  >
                    <Upload aria-hidden="true" className="workspace-panel__footer-button-icon" />
                    <span>Publish</span>
                    {unpublishedDocumentCount > 0 ? (
                      <span className="workspace-panel__footer-badge">{unpublishedDocumentCount}</span>
                    ) : null}
                  </button>
                )}
              </div>
            </section>
          </aside>
        ) : null}

        <main className="editor-panel">
          <div className={`editor-panel__split${isSplitView ? " editor-panel__split--active" : ""}`}>
            <EditorPane
              canSplit={Boolean(workspace && primaryTabs.activePath)}
              dataTestId="document-state-primary"
              editor={primaryEditor}
              isFocused={activePaneId === "primary"}
              onCloseTab={(relativePath) => {
                closePaneTab("primary", relativePath);
              }}
              onFocus={() => {
                setActivePaneId("primary");
              }}
              onOpenInternalLink={(rawTarget) => {
                openRelativePathFromLink(rawTarget, "primary");
              }}
              onSplitToggle={() => {
                if (!isSplitView) {
                  setIsSplitView(true);

                  if (primaryTabs.activePath) {
                    setSecondaryTabs((current) => ({
                      activePath: current.activePath ?? primaryTabs.activePath,
                      paths: current.paths.length > 0 ? current.paths : [primaryTabs.activePath!],
                    }));
                  }
                  return;
                }

                setIsSplitView(false);
                setActivePaneId("primary");
              }}
              paths={primaryTabs.paths}
              setActivePath={(relativePath) => {
                updatePanePath("primary", relativePath);
              }}
              showSplitToggle
              splitActive={isSplitView}
            />

            {isSplitView ? (
              <EditorPane
                canSplit={false}
                dataTestId="document-state-secondary"
                editor={secondaryEditor}
                isFocused={activePaneId === "secondary"}
                onCloseTab={(relativePath) => {
                  closePaneTab("secondary", relativePath);
                }}
                onFocus={() => {
                  setActivePaneId("secondary");
                }}
                onOpenInternalLink={(rawTarget) => {
                  openRelativePathFromLink(rawTarget, "secondary");
                }}
                onSplitToggle={() => undefined}
                paths={secondaryTabs.paths}
                setActivePath={(relativePath) => {
                  updatePanePath("secondary", relativePath);
                }}
                showSplitToggle={false}
                splitActive={isSplitView}
              />
            ) : null}
          </div>
        </main>

        {isRightPanelOpen ? (
          <aside className="sidebar sidebar--right" data-testid="assistant-sidebar">
            <section className="sidebar__section sidebar__section--edge-tabs">
              <div className="sidebar-tabs sidebar-tabs--full-width" role="tablist" aria-label="Right panel views">
                <button
                  aria-selected={rightSidebarTab === "assistant"}
                  className={`sidebar-tab sidebar-tab--full-width${rightSidebarTab === "assistant" ? " sidebar-tab--active" : ""}`}
                  onClick={() => {
                    setRightSidebarTab("assistant");
                  }}
                  role="tab"
                  type="button"
                >
                  <MessageSquare aria-hidden="true" className="sidebar-tab__icon" />
                  Assistant
                </button>
                <button
                  aria-selected={rightSidebarTab === "history"}
                  className={`sidebar-tab sidebar-tab--full-width${rightSidebarTab === "history" ? " sidebar-tab--active" : ""}`}
                  onClick={() => {
                    setRightSidebarTab("history");
                  }}
                  role="tab"
                  type="button"
                >
                  <HistoryIcon aria-hidden="true" className="sidebar-tab__icon" />
                  History
                </button>
                <button
                  aria-selected={rightSidebarTab === "related"}
                  className={`sidebar-tab sidebar-tab--full-width${rightSidebarTab === "related" ? " sidebar-tab--active" : ""}`}
                  onClick={() => {
                    setRightSidebarTab("related");
                  }}
                  role="tab"
                  type="button"
                >
                  <FileText aria-hidden="true" className="sidebar-tab__icon" />
                  Related
                </button>
              </div>
            </section>

            {rightSidebarTab === "assistant" ? (
              <section className="sidebar__section assistant-panel">
                {!workspace || !activeDocumentPath ? (
                  <p className="workspace-panel__copy">Open a workspace and select a note to chat with Codex.</p>
                ) : (
                  <>
                    <ul className="assistant-thread-list" data-testid="assistant-thread-list">
                      {assistantThreads.map((thread) => (
                        <li key={thread.id}>
                          <button
                            className="assistant-thread-list__button"
                            onClick={() => {
                              void window.mohio.getAssistantThread(thread.id).then((nextThread) => {
                                setAssistantThread(nextThread);
                              });
                            }}
                            type="button"
                          >
                            <span className="assistant-thread-list__title">{thread.title || "New Chat"}</span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    {assistantThread?.messages?.length ? (
                      <ol className="assistant-message-list" aria-live="polite" data-testid="assistant-transcript">
                        {assistantThread.messages.map((message) => (
                          <li className={`assistant-message assistant-message--${message.role}`} key={message.id}>
                            <p className="assistant-message__role">{message.role === "assistant" ? "Codex" : "You"}</p>
                            <p className="assistant-message__content">{message.content}</p>
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {assistantError ? <p className="workspace-panel__error" role="status">{assistantError}</p> : null}

                    <form
                      className="assistant-composer"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSendAssistantMessage();
                      }}
                    >
                      <div className="assistant-composer__field">
                        <textarea
                          aria-label="Assistant composer"
                          className="chat-composer"
                          data-testid="assistant-composer-input"
                          onChange={(event) => {
                            setAssistantComposerValue(event.target.value);
                          }}
                          placeholder="Ask Codex about this note or workspace"
                          rows={1}
                          value={assistantComposerValue}
                        />
                        <button
                          aria-label="Send message"
                          className="assistant-composer__send-button"
                          type="submit"
                        >
                          <SendHorizontal aria-hidden="true" className="assistant-composer__send-icon" />
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </section>
            ) : null}

            {rightSidebarTab === "history" ? (
              <section className="sidebar__section history-panel">
                {!workspace ? (
                  <p className="workspace-panel__copy">Open a workspace to view history.</p>
                ) : !activeDocumentPath ? (
                  <p className="workspace-panel__copy">Select a document to view commit history.</p>
                ) : (
                  <>
                    {leftSidebarTab === "unpublished" ? (
                      <div className="history-remote-diff">
                        {isUnpublishedDiffLoading ? (
                          <p className="workspace-panel__copy">Loading remote diff...</p>
                        ) : unpublishedDiffError ? (
                          <p className="workspace-panel__error" role="status">{unpublishedDiffError}</p>
                        ) : unpublishedDiff?.patch ? (
                          <pre className="history-diff-output">{unpublishedDiff.patch}</pre>
                        ) : unpublishedDiff?.message ? (
                          <p className="workspace-panel__copy">{unpublishedDiff.message}</p>
                        ) : (
                          <p className="workspace-panel__copy">No remote/local diff available.</p>
                        )}
                      </div>
                    ) : null}

                    {isHistoryLoading ? (
                      <p className="workspace-panel__copy">Loading commit history...</p>
                    ) : commitHistory.length > 0 ? (
                      <ul className="history-commit-list__items">
                        {commitHistory.map((commit) => (
                          <li className="history-commit-list__item" key={commit.sha}>
                            <p className="history-commit-list__subject">{commit.subject}</p>
                            <p className="history-commit-list__meta">
                              {new Date(commit.authoredAt).toLocaleString()} · {commit.shortStat ?? "No file stats"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="workspace-panel__copy">No commits found for this document yet.</p>
                    )}
                  </>
                )}

                {historyError ? <p className="workspace-panel__error" role="status">{historyError}</p> : null}
              </section>
            ) : null}

            {rightSidebarTab === "related" ? (
              <section className="sidebar__section related-panel" data-testid="related-panel">
                {!workspace ? (
                  <p className="workspace-panel__copy">Open a workspace to browse related notes.</p>
                ) : !activeDocumentPath ? (
                  <p className="workspace-panel__copy">Select a note to view related notes.</p>
                ) : isRelatedLoading ? (
                  <p className="workspace-panel__copy">Loading related notes...</p>
                ) : relatedError ? (
                  <p className="workspace-panel__error" role="status">{relatedError}</p>
                ) : relatedDocuments.length === 0 ? (
                  <p className="workspace-panel__copy">No related notes found yet.</p>
                ) : (
                  <ul className="related-list">
                    {relatedDocuments.map((item) => (
                      <li key={item.relativePath}>
                        <button
                          className="related-list__button"
                          onClick={() => {
                            handleSelectDocument(item.relativePath, false);
                          }}
                          onDoubleClick={() => {
                            handleSelectDocument(item.relativePath, true);
                          }}
                          type="button"
                        >
                          <span className="related-list__title">{item.displayTitle}</span>
                          <span className="related-list__meta">{item.relationTypes.join(" · ")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function EditorPane({
  canSplit,
  dataTestId,
  editor,
  isFocused,
  onCloseTab,
  onFocus,
  onOpenInternalLink,
  onSplitToggle,
  paths,
  setActivePath,
  showSplitToggle,
  splitActive,
}: {
  canSplit: boolean;
  dataTestId: string;
  editor: DocumentEditorSession;
  isFocused: boolean;
  onCloseTab: (relativePath: string) => void;
  onFocus: () => void;
  onOpenInternalLink: (rawTarget: string) => void;
  onSplitToggle: () => void;
  paths: string[];
  setActivePath: (relativePath: string) => void;
  showSplitToggle: boolean;
  splitActive: boolean;
}) {
  const activePath = editor.relativePath;

  return (
    <section className={`editor-pane${isFocused ? " editor-pane--focused" : ""}`} data-testid={dataTestId}>
      <div className="editor-pane__tabs-row" role="tablist" aria-label="Open document tabs">
        <div className="editor-pane__tabs-scroll">
          {paths.map((relativePath) => {
            const isActive = relativePath === activePath;

            return (
              <button
                aria-selected={isActive}
                className={`sidebar-tab sidebar-tab--full-width editor-pane__tab${isActive ? " sidebar-tab--active" : ""}`}
                key={relativePath}
                onClick={() => {
                  setActivePath(relativePath);
                  onFocus();
                }}
                role="tab"
                type="button"
              >
                <span className="editor-pane__tab-title">{getPathDisplayName(relativePath)}</span>
                <span
                  className="editor-pane__tab-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(relativePath);
                  }}
                >
                  <X aria-hidden="true" className="editor-pane__tab-close-icon" />
                </span>
              </button>
            );
          })}
        </div>

        {showSplitToggle ? (
          <button
            aria-label={splitActive ? "Close split view" : "Open split view"}
            className="top-bar__icon-action editor-pane__split-toggle"
            disabled={!canSplit}
            onClick={onSplitToggle}
            type="button"
          >
            <Columns2 aria-hidden="true" className="top-bar__icon-action-icon" />
          </button>
        ) : null}
      </div>

      {editor.document ? (
        <RichTextEditor
          dataTestId={`${dataTestId}-editor`}
          markdown={editor.draftMarkdown}
          onChange={editor.setDraftMarkdown}
          onInternalLinkOpen={(selection) => {
            onOpenInternalLink(selection.target);
          }}
          onSurfaceFocus={onFocus}
          onTitleChange={editor.setDraftTitle}
          sourceRelativePath={editor.document.relativePath}
          title={editor.draftTitle}
        />
      ) : (
        <section className="empty-workspace-state" data-testid={`${dataTestId}-empty`}>
          <p className="empty-workspace-state__copy">Choose a folder to open your Mohio workspace.</p>
        </section>
      )}
    </section>
  );
}

function renderWorkspaceNode({
  node,
  selectedDocumentId,
  expandedDirectoryIds,
  depth,
  onSelect,
  onDoubleSelect,
  onOpenDocumentContextMenu,
  onToggleDirectory,
}: {
  node: WorkspaceTreeNode;
  selectedDocumentId: string | null;
  expandedDirectoryIds: Set<string>;
  depth: number;
  onSelect: (documentId: string) => void;
  onDoubleSelect: (documentId: string) => void;
  onOpenDocumentContextMenu: (input: DocumentContextMenuState) => void;
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
            {isExpanded ? (
              <ChevronDown aria-hidden="true" className="tree-chevron-icon" />
            ) : (
              <ChevronRight aria-hidden="true" className="tree-chevron-icon" />
            )}
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
                onDoubleSelect,
                onOpenDocumentContextMenu,
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
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenDocumentContextMenu({
            documentId: node.id,
            x: event.clientX,
            y: event.clientY,
          });
        }}
        onClick={() => {
          onSelect(node.id);
        }}
        onDoubleClick={() => {
          onDoubleSelect(node.id);
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
): string | null {
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

function countWorkspaceDocuments(nodes: WorkspaceTreeNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.kind === "document") {
      return count + 1;
    }

    return count + countWorkspaceDocuments(node.children);
  }, 0);
}

function getDocumentDirectoryRelativePath(documentId: string | null): string | null {
  if (!documentId) {
    return null;
  }

  const normalizedDocumentPath = documentId.replace(/\\/gu, "/");
  const lastSeparatorIndex = normalizedDocumentPath.lastIndexOf("/");

  if (lastSeparatorIndex <= 0) {
    return null;
  }

  return normalizedDocumentPath.slice(0, lastSeparatorIndex);
}

function collectDocumentIds(nodes: WorkspaceTreeNode[]): string[] {
  const documentIds: string[] = [];

  for (const node of nodes) {
    if (node.kind === "document") {
      documentIds.push(node.id);
      continue;
    }

    documentIds.push(...collectDocumentIds(node.children));
  }

  return documentIds;
}

function getPathDisplayName(relativePath: string): string {
  const normalized = relativePath.replace(/\\/gu, "/");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || relativePath;
}

function resolveInternalLinkPath({
  rawTarget,
  sourceRelativePath,
  workspace,
}: {
  rawTarget: string;
  sourceRelativePath: string;
  workspace: WorkspaceSummary;
}): string | null {
  const trimmedTarget = rawTarget.trim();

  if (!trimmedTarget) {
    return null;
  }

  const hashIndex = trimmedTarget.indexOf("#");
  const linkPath = hashIndex >= 0 ? trimmedTarget.slice(0, hashIndex) : trimmedTarget;

  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(linkPath) || linkPath.startsWith("mailto:")) {
    return null;
  }

  const availablePaths = collectDocumentIds(workspace.documents);
  const availablePathSet = new Set(availablePaths.map((entry) => entry.replace(/\\/gu, "/")));
  const titleToPath = new Map<string, string[]>();

  for (const node of flattenDocumentNodes(workspace.documents)) {
    const key = node.displayTitle.toLowerCase();
    const current = titleToPath.get(key) ?? [];
    titleToPath.set(key, [...current, node.id.replace(/\\/gu, "/")]);
  }

  if (!linkPath || linkPath === ".") {
    return sourceRelativePath;
  }

  const decodedPath = decodePath(linkPath).replace(/\\/gu, "/");
  const normalizedSource = sourceRelativePath.replace(/\\/gu, "/");
  const normalizedCandidate = decodedPath.startsWith("/")
    ? normalizePosixPath(decodedPath.slice(1))
    : normalizePosixPath(joinPosixPath(dirnamePosixPath(normalizedSource), decodedPath));
  const directMatch = findPathMatch(normalizedCandidate, availablePathSet);

  if (directMatch) {
    return directMatch;
  }

  const wikiTarget = getPathDisplayName(normalizedCandidate).toLowerCase();
  const titleMatches = titleToPath.get(wikiTarget) ?? [];

  if (titleMatches.length === 1) {
    return titleMatches[0];
  }

  return null;
}

function findPathMatch(candidate: string, knownPaths: Set<string>): string | null {
  if (knownPaths.has(candidate)) {
    return candidate;
  }

  const hasExtension = /\.[a-z\d]+$/iu.test(candidate);

  if (!hasExtension) {
    const extensionCandidates = [".md", ".markdown", ".mdx"].map((extension) => `${candidate}${extension}`);

    for (const extensionCandidate of extensionCandidates) {
      if (knownPaths.has(extensionCandidate)) {
        return extensionCandidate;
      }
    }
  }

  const lowerCandidate = candidate.toLowerCase();

  for (const knownPath of knownPaths) {
    if (knownPath.toLowerCase() === lowerCandidate) {
      return knownPath;
    }
  }

  return null;
}

function flattenDocumentNodes(nodes: WorkspaceTreeNode[]): Array<{ id: string; displayTitle: string }> {
  const result: Array<{ id: string; displayTitle: string }> = [];

  for (const node of nodes) {
    if (node.kind === "document") {
      result.push({
        id: node.id,
        displayTitle: node.displayTitle,
      });
      continue;
    }

    result.push(...flattenDocumentNodes(node.children));
  }

  return result;
}

function decodePath(rawPath: string): string {
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function normalizePosixPath(input: string): string {
  const parts = input.split("/");
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      stack.pop();
      continue;
    }

    stack.push(part);
  }

  return stack.join("/");
}

function dirnamePosixPath(input: string): string {
  const normalized = input.replace(/\\/gu, "/");
  const lastSeparatorIndex = normalized.lastIndexOf("/");

  if (lastSeparatorIndex <= 0) {
    return "";
  }

  return normalized.slice(0, lastSeparatorIndex);
}

function joinPosixPath(left: string, right: string): string {
  if (!left) {
    return right;
  }

  return `${left}/${right}`;
}

export default App;
