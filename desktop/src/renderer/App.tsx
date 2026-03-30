import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  History as HistoryIcon,
  MessageSquare,
  SquarePen,
  Trash2,
} from "lucide-react";
import type {
  AssistantThread,
  AssistantThreadSummary,
  CommitHistoryEntry,
  PublishSummary,
  SyncConflict,
  SyncState,
  UnpublishedDiffResult,
  WorkspaceDocument,
  WorkspaceDocumentNode,
  WorkspaceSummary,
  WorkspaceTreeNode,
} from "@shared/mohio-types";
import { RichTextEditor } from "./markdown-editor";

type SaveState = "error" | "idle" | "loading" | "saved" | "saving";
type AssistantView = "list" | "thread";
type LeftSidebarTab = "documents" | "unpublished";
type RightSidebarTab = "assistant" | "history";
const THINKING_LABEL_DELAY_MS = 900;
const SYNC_INTERVAL_MS = 60_000;

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

interface DocumentContextMenuState {
  documentId: string;
  x: number;
  y: number;
}

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [expandedDirectoryIds, setExpandedDirectoryIds] = useState<Set<string>>(new Set());
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [isWorkspaceOpening, setIsWorkspaceOpening] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [leftSidebarTab, setLeftSidebarTab] = useState<LeftSidebarTab>("documents");
  const [rightSidebarTab, setRightSidebarTab] = useState<RightSidebarTab>("assistant");
  const [document, setDocument] = useState<WorkspaceDocument | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [documentContextMenu, setDocumentContextMenu] = useState<DocumentContextMenuState | null>(null);
  const [assistantThreads, setAssistantThreads] = useState<AssistantThreadSummary[]>([]);
  const [assistantView, setAssistantView] = useState<AssistantView>("list");
  const [activeAssistantThreadId, setActiveAssistantThreadId] = useState<string | null>(null);
  const [assistantThread, setAssistantThread] = useState<AssistantThread | null>(null);
  const [assistantComposerValue, setAssistantComposerValue] = useState("");
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [isAssistantMenuOpen, setIsAssistantMenuOpen] = useState(false);
  const [isAssistantListLoading, setIsAssistantListLoading] = useState(false);
  const [isAssistantThreadLoading, setIsAssistantThreadLoading] = useState(false);
  const [showAssistantThinking, setShowAssistantThinking] = useState(false);
  const [publishSummary, setPublishSummary] = useState<PublishSummary | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [commitHistory, setCommitHistory] = useState<CommitHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [unpublishedDiff, setUnpublishedDiff] = useState<UnpublishedDiffResult | null>(null);
  const [isUnpublishedDiffLoading, setIsUnpublishedDiffLoading] = useState(false);
  const [unpublishedDiffError, setUnpublishedDiffError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [conflictSelectionByPath, setConflictSelectionByPath] = useState<Record<string, "keep-local" | "keep-incoming" | "manual">>({});
  const [manualConflictContentByPath, setManualConflictContentByPath] = useState<Record<string, string>>({});
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const lastSavedSnapshotRef = useRef<DocumentSnapshot | null>(null);
  const pendingSaveSnapshotRef = useRef<DocumentSnapshot | null>(null);
  const loadSequenceRef = useRef(0);
  const saveSequenceRef = useRef(0);
  const selectedDocumentIdRef = useRef<string | null>(null);
  const activeAssistantThreadIdRef = useRef<string | null>(null);
  const assistantViewRef = useRef<AssistantView>("list");
  const assistantThreadRef = useRef<AssistantThread | null>(null);
  const saveStateRef = useRef<SaveState>("idle");
  const draftTitleRef = useRef("");
  const draftMarkdownRef = useRef("");
  const workspacePathRef = useRef<string | null>(null);
  const documentContextMenuRef = useRef<HTMLDivElement | null>(null);
  const assistantBodyRef = useRef<HTMLDivElement | null>(null);
  const assistantThinkingTimerRef = useRef<number | null>(null);
  const lastAssistantStreamSignatureRef = useRef<string | null>(null);
  const lastMaterialEditAtRef = useRef<number | null>(null);
  const hasRecentMaterialEditRef = useRef(false);
  const previousSelectedDocumentIdRef = useRef<string | null>(null);

  selectedDocumentIdRef.current = selectedDocumentId;
  activeAssistantThreadIdRef.current = activeAssistantThreadId;
  assistantViewRef.current = assistantView;
  assistantThreadRef.current = assistantThread;
  saveStateRef.current = saveState;
  draftTitleRef.current = draftTitle;
  draftMarkdownRef.current = draftMarkdown;
  workspacePathRef.current = workspace?.path ?? null;

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

  const triggerSync = async (reason: string) => {
    if (!workspace) {
      return;
    }

    try {
      const state = await window.mohio.syncIncomingChanges(reason);
      setSyncState(state);
      setSyncError(null);
      await refreshPublishSummary();
    } catch {
      setSyncError("Mohio could not sync incoming workspace changes.");
    }
  };

  const loadCommitHistory = async () => {
    if (!workspace || !selectedDocumentId) {
      setCommitHistory([]);
      return;
    }

    try {
      setIsHistoryLoading(true);
      const commits = await window.mohio.listCommitHistory(selectedDocumentId);
      setCommitHistory(commits);
      setHistoryError(null);
    } catch {
      setHistoryError("Mohio could not load commit history for this document.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadUnpublishedDiff = async () => {
    if (!workspace || !selectedDocumentId || leftSidebarTab !== "unpublished") {
      setUnpublishedDiff(null);
      setUnpublishedDiffError(null);
      setIsUnpublishedDiffLoading(false);
      return;
    }

    try {
      setIsUnpublishedDiffLoading(true);
      const diffResult = await window.mohio.getUnpublishedDiff(selectedDocumentId);
      setUnpublishedDiff(diffResult);
      setUnpublishedDiffError(null);
    } catch {
      setUnpublishedDiff(null);
      setUnpublishedDiffError("Mohio could not load the remote vs local diff for this document.");
    } finally {
      setIsUnpublishedDiffLoading(false);
    }
  };

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
    if (!workspace) {
      setPublishSummary(null);
      setPublishError(null);
      setSyncState(null);
      setSyncError(null);
      return;
    }

    void refreshPublishSummary();
    void refreshSyncState();
    void triggerSync("workspace-open");
  }, [workspace?.path]);

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
    const previousSelectedId = previousSelectedDocumentIdRef.current;
    const switchedDocument = Boolean(
      previousSelectedId &&
      selectedDocumentId &&
      previousSelectedId !== selectedDocumentId,
    );

    if (switchedDocument && hasRecentMaterialEditRef.current) {
      void window.mohio.recordRiskyCommit({
        trigger: "document-switch",
        relativePath: previousSelectedId ?? undefined,
      }).catch(() => undefined);
      hasRecentMaterialEditRef.current = false;
    }

    previousSelectedDocumentIdRef.current = selectedDocumentId;
    if (selectedDocumentId) {
      void window.mohio.recordAutoSaveCommit().catch(() => undefined);
      void triggerSync("document-open");
    }
    void loadCommitHistory();
  }, [selectedDocumentId, workspace?.path]);

  useEffect(() => {
    void loadUnpublishedDiff();
  }, [selectedDocumentId, leftSidebarTab, workspace?.path]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void window.mohio.recordAutoSaveCommit().catch(() => undefined);
      void triggerSync("workspace-interval");
    }, SYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [workspace?.path]);

  useEffect(() => {
    if (!documentContextMenu) {
      return;
    }

    const handleWindowPointerDown = (event: MouseEvent) => {
      const menuElement = documentContextMenuRef.current;

      if (!menuElement || menuElement.contains(event.target as Node)) {
        return;
      }

      setDocumentContextMenu(null);
    };
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDocumentContextMenu(null);
      }
    };

    window.addEventListener("mousedown", handleWindowPointerDown, true);
    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleWindowPointerDown, true);
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [documentContextMenu]);

  useEffect(() => {
    setDocumentContextMenu(null);
  }, [selectedDocumentId, workspace?.path]);

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
      void refreshPublishSummary();
      void loadCommitHistory();
    });

    return () => {
      disposeDocumentChangedListener();
    };
  }, []);

  useEffect(() => {
    if (!workspace) {
      setAssistantThreads([]);
      setAssistantView("list");
      setActiveAssistantThreadId(null);
      setAssistantThread(null);
      setAssistantError(null);
      setIsAssistantMenuOpen(false);
      setIsAssistantListLoading(false);
      setIsAssistantThreadLoading(false);
      setShowAssistantThinking(false);
      return;
    }

    let isMounted = true;
    setIsAssistantListLoading(true);
    setAssistantError(null);

    void window.mohio.listAssistantThreads().then(
      (threads) => {
        if (!isMounted) {
          return;
        }

        setAssistantThreads(threads);
        setActiveAssistantThreadId((currentThreadId) =>
          getPreferredAssistantThreadId(threads, currentThreadId),
        );
        setAssistantView("list");
        setIsAssistantListLoading(false);
      },
      () => {
        if (!isMounted) {
          return;
        }

        setAssistantThreads([]);
        setAssistantView("list");
        setActiveAssistantThreadId(null);
        setAssistantThread(null);
        setAssistantError("Mohio could not load Codex chat history for this workspace.");
        setIsAssistantListLoading(false);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [workspace]);

  useEffect(() => {
    if (!workspace || !activeAssistantThreadId) {
      setAssistantThread(null);
      setAssistantError(null);
      setIsAssistantThreadLoading(false);
      return;
    }

    let isMounted = true;
    setIsAssistantThreadLoading(true);
    setAssistantError(null);

    void window.mohio.getAssistantThread(activeAssistantThreadId).then(
      (thread) => {
        if (!isMounted) {
          return;
        }

        setAssistantThread(thread);
        setAssistantError(thread.errorMessage);
        setIsAssistantThreadLoading(false);
      },
      () => {
        if (!isMounted) {
          return;
        }

        setAssistantThread(null);
        setAssistantError("Mohio could not load the selected Codex chat.");
        setIsAssistantThreadLoading(false);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [activeAssistantThreadId, workspace]);

  useEffect(() => {
    const disposeAssistantListener = window.mohio.onAssistantEvent((event) => {
      if (event.workspacePath !== workspacePathRef.current) {
        return;
      }

      if (event.type === "thread-list") {
        setAssistantThreads(event.threads);
        setActiveAssistantThreadId((currentThreadId) => {
          const nextThreadId = getPreferredAssistantThreadId(event.threads, currentThreadId);

          const shouldKeepTransientThread = Boolean(
            currentThreadId &&
            assistantViewRef.current === "thread" &&
            assistantThreadRef.current?.id === currentThreadId,
          );

          if (!nextThreadId && !shouldKeepTransientThread) {
            setAssistantThread(null);
            setAssistantView("list");
            setIsAssistantMenuOpen(false);
          }

          return shouldKeepTransientThread ? currentThreadId : nextThreadId;
        });
        setIsAssistantListLoading(false);
        return;
      }

      if (event.thread.id !== activeAssistantThreadIdRef.current) {
        return;
      }

      setAssistantThread(event.thread);
      setAssistantError(event.thread.errorMessage);
      setIsAssistantThreadLoading(false);
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
  }, [assistantThread?.messages, assistantThread?.status, isAssistantThreadLoading, showAssistantThinking]);

  useEffect(() => {
    const clearThinkingTimer = () => {
      if (assistantThinkingTimerRef.current === null) {
        return;
      }

      window.clearTimeout(assistantThinkingTimerRef.current);
      assistantThinkingTimerRef.current = null;
    };

    const activeThread = assistantThread;
    const lastAssistantMessage = getLastAssistantMessage(activeThread);
    const streamSignature = activeThread && lastAssistantMessage
      ? `${activeThread.id}:${lastAssistantMessage.id}:${lastAssistantMessage.content}`
      : activeThread
        ? `${activeThread.id}:none`
        : null;

    if (!activeThread || activeThread.status !== "running") {
      clearThinkingTimer();
      setShowAssistantThinking(false);
      lastAssistantStreamSignatureRef.current = streamSignature;

      return () => {
        clearThinkingTimer();
      };
    }

    const hasVisibleAssistantContent = Boolean(lastAssistantMessage?.content);
    const contentChanged = streamSignature !== lastAssistantStreamSignatureRef.current;

    clearThinkingTimer();

    if (!hasVisibleAssistantContent) {
      setShowAssistantThinking(true);
    } else if (contentChanged) {
      setShowAssistantThinking(false);
      assistantThinkingTimerRef.current = window.setTimeout(() => {
        if (assistantThreadRef.current?.status === "running") {
          setShowAssistantThinking(true);
        }
      }, THINKING_LABEL_DELAY_MS);
    }

    lastAssistantStreamSignatureRef.current = streamSignature;

    return () => {
      clearThinkingTimer();
    };
  }, [assistantThread]);

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
      return;
    }

    lastMaterialEditAtRef.current = Date.now();
    hasRecentMaterialEditRef.current = true;
  }, [document?.relativePath, draftTitle, draftMarkdown, isDirty]);

  useEffect(() => {
    if (!document || !isDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!hasRecentMaterialEditRef.current) {
        return;
      }

      void window.mohio.recordRiskyCommit({
        trigger: "idle-burst",
        relativePath: document.relativePath,
      }).then((committed) => {
        if (committed) {
          hasRecentMaterialEditRef.current = false;
          void loadCommitHistory();
        }
      }).catch(() => undefined);
    }, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [document?.relativePath, draftTitle, draftMarkdown, isDirty]);

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

  useEffect(() => {
    if (rightSidebarTab !== "history") {
      return;
    }

    void loadCommitHistory();
  }, [rightSidebarTab, selectedDocumentId, workspace?.path]);

  const handleOpenWorkspace = async () => {
    try {
      setIsWorkspaceOpening(true);
      const nextWorkspace = await window.mohio.openWorkspace();

      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
      setSelectedDocumentId(getPreferredDocumentId(nextWorkspace));
      setWorkspaceError(null);
      setLeftSidebarTab("documents");
      setRightSidebarTab("assistant");
    } catch {
      setWorkspaceError("Mohio could not open that folder as a workspace.");
    } finally {
      setIsWorkspaceLoading(false);
      setIsWorkspaceOpening(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!workspace) {
      return;
    }

    const directoryRelativePath = getDocumentDirectoryRelativePath(selectedDocumentIdRef.current);
    setWorkspaceError(null);
    setDocumentError(null);
    setDocumentContextMenu(null);

    try {
      const nextDocument = await window.mohio.createDocument({
        directoryRelativePath,
      });
      const refreshedWorkspace = await window.mohio.getCurrentWorkspace();

      if (refreshedWorkspace) {
        setWorkspace(refreshedWorkspace);
        setExpandedDirectoryIds(getExpandedDirectoryIds(refreshedWorkspace));
      }

      setSelectedDocumentId(nextDocument.relativePath);
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
      await refreshPublishSummary();
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

    setWorkspaceError(null);
    setDocumentError(null);
    setDocumentContextMenu(null);

    try {
      await window.mohio.recordRiskyCommit({
        trigger: "delete",
        force: true,
        relativePath,
      });
      await window.mohio.deleteDocument(relativePath);
      const refreshedWorkspace = await window.mohio.getCurrentWorkspace();

      setWorkspace(refreshedWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(refreshedWorkspace));
      setSelectedDocumentId(
        getPreferredDocumentId(
          refreshedWorkspace,
          relativePath === selectedDocumentIdRef.current
            ? null
            : selectedDocumentIdRef.current,
        ),
      );
      await refreshPublishSummary();
    } catch {
      setWorkspaceError("Mohio could not delete that note.");
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
      titleMode: document.titleMode,
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
      const isRenameOrMove = snapshot.title.trim() !== document.displayTitle.trim();
      let createdRiskyCommit = false;
      if (isRenameOrMove) {
        createdRiskyCommit = await window.mohio.recordRiskyCommit({
          trigger: "rename-move",
          force: true,
          relativePath: document.relativePath,
        });
      }
      const result = await window.mohio.saveDocument(snapshot);
      const refreshedWorkspace = await window.mohio.getCurrentWorkspace();

      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      if (refreshedWorkspace) {
        setWorkspace(refreshedWorkspace);
        setExpandedDirectoryIds(getExpandedDirectoryIds(refreshedWorkspace));
      }

      const currentDraftSnapshot = {
        relativePath: selectedDocumentIdRef.current ?? snapshot.relativePath,
        title: draftTitleRef.current,
        markdown: draftMarkdownRef.current,
      };
      const canApplyCommittedDraft = snapshotsMatch(currentDraftSnapshot, snapshot);
      const committedSnapshot = {
        relativePath: result.relativePath,
        title: result.displayTitle,
        markdown: result.markdown,
      };

      setSelectedDocumentId(result.relativePath);
      setDocument({
        relativePath: result.relativePath,
        fileName: result.fileName,
        displayTitle: result.displayTitle,
        markdown: result.markdown,
        titleMode: result.titleMode,
      });

      if (canApplyCommittedDraft) {
        setDraftTitle(result.displayTitle);
        setDraftMarkdown(result.markdown);
      }

      lastSavedSnapshotRef.current = committedSnapshot;
      pendingSaveSnapshotRef.current = null;
      setSaveState("saved");
      if (!isRenameOrMove) {
        const autoSaved = await window.mohio.recordAutoSaveCommit();
        if (autoSaved) {
          hasRecentMaterialEditRef.current = false;
        }
      } else if (createdRiskyCommit) {
        hasRecentMaterialEditRef.current = false;
      }
      await refreshPublishSummary();
      await loadCommitHistory();
    } catch {
      if (saveSequence !== saveSequenceRef.current) {
        return;
      }

      pendingSaveSnapshotRef.current = null;
      setDocumentError("Mohio could not save that document.");
      setSaveState("error");
    }
  };

  const handlePublishWorkspaceChanges = async () => {
    if (!workspace) {
      return;
    }

    try {
      setIsPublishing(true);
      setPublishError(null);
      await window.mohio.publishWorkspaceChanges();
      await refreshPublishSummary();
      await loadCommitHistory();
    } catch {
      setPublishError("Mohio could not publish your workspace changes.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResolveSyncConflict = async (conflict: SyncConflict) => {
    if (!workspace) {
      return;
    }

    const resolution = conflictSelectionByPath[conflict.relativePath] ?? "keep-local";
    const manualContent = manualConflictContentByPath[conflict.relativePath];

    try {
      setIsResolvingConflict(true);
      const state = await window.mohio.resolveSyncConflict({
        relativePath: conflict.relativePath,
        resolution,
        manualContent,
      });
      setSyncState(state);
      await refreshPublishSummary();
      await loadCommitHistory();
    } catch {
      setSyncError("Mohio could not apply your conflict resolution choice.");
    } finally {
      setIsResolvingConflict(false);
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

  const handleSelectDocument = (documentId: string) => {
    void (async () => {
      await window.mohio.recordAutoSaveCommit().catch(() => undefined);
      setSelectedDocumentId(documentId);

      if (leftSidebarTab === "unpublished") {
        setRightSidebarTab("history");
      }
    })();
  };

  const handleCreateAssistantThread = async () => {
    if (!workspace) {
      return null;
    }

    setAssistantError(null);
    setIsAssistantMenuOpen(false);

    try {
      const nextThread = await window.mohio.createAssistantThread();

      setAssistantThreads((currentThreads) => [
        {
          createdAt: new Date().toISOString(),
          id: nextThread.id,
          preview: nextThread.preview,
          status: nextThread.status,
          title: nextThread.title,
          updatedAt: new Date().toISOString(),
        },
        ...currentThreads.filter((thread) => thread.id !== nextThread.id),
      ]);
      setActiveAssistantThreadId(nextThread.id);
      setAssistantThread(nextThread);
      setAssistantView("thread");

      return nextThread;
    } catch {
      setAssistantError("Mohio could not create a new Codex chat for this workspace.");
      return null;
    }
  };

  const handleSendAssistantMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!workspace || !selectedDocumentId || !document || trimmedMessage.length === 0) {
      return;
    }

    setAssistantComposerValue("");
    setAssistantError(null);

    try {
      await window.mohio.recordAutoSaveCommit().catch(() => undefined);
      const shouldStartNewThread = assistantViewRef.current === "list";
      const currentThread = shouldStartNewThread
        ? await handleCreateAssistantThread()
        : (assistantThread ?? await handleCreateAssistantThread());

      if (!currentThread) {
        return;
      }

      const nextThread = await window.mohio.sendAssistantMessage({
        threadId: currentThread.id,
        noteRelativePath: selectedDocumentId,
        content: trimmedMessage,
        documentTitle: draftTitle,
        documentMarkdown: draftMarkdown,
      });

      setActiveAssistantThreadId(nextThread.id);
      setAssistantThread(nextThread);
      setAssistantView("thread");
    } catch {
      setAssistantError("Mohio could not send that message to the selected Codex chat.");
    }
  };

  const handleCancelAssistantRun = async () => {
    if (!activeAssistantThreadId) {
      return;
    }

    try {
      await window.mohio.cancelAssistantRun(activeAssistantThreadId);
    } catch {
      setAssistantError("Mohio could not stop the current Codex run.");
    }
  };

  const handleOpenAssistantThread = (threadId: string) => {
    setAssistantError(null);
    setIsAssistantMenuOpen(false);
    setActiveAssistantThreadId(threadId);
    setAssistantView("thread");
  };

  const handleRenameAssistantThread = async () => {
    if (!activeAssistantThreadId) {
      return;
    }

    const currentTitle = assistantThread?.title || "New Chat";
    const nextTitle = window.prompt("Rename Chat", currentTitle)?.trim();

    if (!nextTitle) {
      return;
    }

    setAssistantError(null);
    setIsAssistantMenuOpen(false);

    try {
      await window.mohio.renameAssistantThread({
        threadId: activeAssistantThreadId,
        title: nextTitle,
      });
      setAssistantThread((currentThread) => (
        currentThread ? { ...currentThread, title: nextTitle } : currentThread
      ));
      setAssistantThreads((currentThreads) =>
        currentThreads.map((thread) => (
          thread.id === activeAssistantThreadId
            ? { ...thread, title: nextTitle }
            : thread
        )),
      );
    } catch {
      setAssistantError("Mohio could not rename this Codex chat.");
    }
  };

  const handleDeleteAssistantThread = async () => {
    if (!activeAssistantThreadId) {
      return;
    }

    const confirmed = window.confirm("Delete this chat from the visible workspace list?");

    if (!confirmed) {
      return;
    }

    const threadId = activeAssistantThreadId;

    setAssistantError(null);
    setIsAssistantMenuOpen(false);

    try {
      await window.mohio.deleteAssistantThread(threadId);
      setAssistantThreads((currentThreads) =>
        currentThreads.filter((thread) => thread.id !== threadId),
      );
      setActiveAssistantThreadId(null);
      setAssistantThread(null);
      setAssistantView("list");
    } catch {
      setAssistantError("Mohio could not delete this Codex chat.");
    }
  };

  const assistantHasContext = Boolean(workspace && selectedDocumentId && document);
  const assistantIsBusy = assistantThread?.status === "running";
  const assistantIsDetailView = assistantView === "thread";
  const assistantVisibleMessages = assistantThread?.messages.filter((message) =>
    message.role === "user" || message.content.trim().length > 0
  ) ?? [];
  const activeAssistantThreadSummary = assistantThreads.find(
    (thread) => thread.id === activeAssistantThreadId,
  ) ?? null;
  const assistantThreadTitle = assistantThread?.title || activeAssistantThreadSummary?.title || "New Chat";
  const canSendAssistantMessage =
    assistantHasContext &&
    !assistantIsBusy &&
    assistantComposerValue.trim().length > 0;
  const showAssistantFooter = assistantIsDetailView || Boolean(workspace);
  const leftSidebarNodes = leftSidebarTab === "documents"
    ? (workspace?.documents ?? [])
    : (publishSummary?.unpublishedTree ?? []);
  const leftSidebarDocumentCount = countWorkspaceDocuments(leftSidebarNodes);
  const unpublishedDocumentCount = publishSummary?.unpublishedCount ?? 0;

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
              {workspace?.name ?? "Open Workspace"}
            </span>
            <span className="workspace-label__chevron" aria-hidden="true">
              <ChevronDown aria-hidden="true" className="toolbar-chevron-icon" />
            </span>
          </button>
          <button
            aria-label="New Note"
            className="top-bar__new-note"
            disabled={!workspace}
            onClick={() => {
              void handleCreateDocument();
            }}
            type="button"
          >
            <SquarePen aria-hidden="true" className="top-bar__new-note-icon" />
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
          <button
            className="primary-button top-bar__publish-button"
            disabled={!workspace || isPublishing || unpublishedDocumentCount === 0}
            onClick={() => {
              void handlePublishWorkspaceChanges();
            }}
            type="button"
          >
            Publish
            {unpublishedDocumentCount > 0 ? (
              <span className="top-bar__badge" aria-label={`${unpublishedDocumentCount} unpublished documents`}>
                {unpublishedDocumentCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <div className="workspace-shell">
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
                Unpublished
                {unpublishedDocumentCount > 0 ? (
                  <span className="sidebar-tab__badge">{unpublishedDocumentCount}</span>
                ) : null}
              </button>
            </div>
          </section>

          <section className="sidebar__section">
            {isWorkspaceLoading ? (
              <p className="workspace-panel__copy">Loading current workspace...</p>
            ) : workspace ? (
              <>
                {leftSidebarDocumentCount === 0 ? (
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
                        selectedDocumentId,
                        expandedDirectoryIds,
                        depth: 0,
                        onSelect: handleSelectDocument,
                        onOpenDocumentContextMenu: (input) => {
                          setDocumentContextMenu(input);
                        },
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
            {publishError ? (
              <p className="workspace-panel__error" role="status">
                {publishError}
              </p>
            ) : null}
            {syncError ? (
              <p className="workspace-panel__error" role="status">
                {syncError}
              </p>
            ) : null}

            {documentContextMenu ? (
              <div
                ref={documentContextMenuRef}
                className="workspace-document-menu"
                role="menu"
                style={{
                  left: `${Math.max(8, documentContextMenu.x)}px`,
                  top: `${Math.max(8, documentContextMenu.y)}px`,
                }}
              >
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
                  {isWorkspaceOpening ? "Opening Workspace..." : "Open Workspace"}
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
            </div>
          </section>

          {rightSidebarTab === "assistant" ? (
            <>
              {assistantIsDetailView ? (
                <>
                  <section className="sidebar__section assistant-panel-header assistant-panel-header--detail">
                    <div className="assistant-panel-header__bar">
                      <div className="assistant-panel-header__main">
                        <button
                          aria-label="Back to chats"
                          className="assistant-panel__text-icon-button"
                          onClick={() => {
                            setAssistantView("list");
                            setIsAssistantMenuOpen(false);
                          }}
                          type="button"
                        >
                          <ArrowLeft aria-hidden="true" className="assistant-panel__icon" />
                        </button>
                        <div className="assistant-panel-header__title-group">
                          <h2 className="assistant-panel__thread-title">{assistantThreadTitle}</h2>
                        </div>
                      </div>

                      <div className="assistant-panel__menu">
                        <button
                          aria-expanded={isAssistantMenuOpen}
                          aria-haspopup="menu"
                          aria-label="Chat options"
                          className="assistant-panel__text-icon-button"
                          onClick={() => {
                            setIsAssistantMenuOpen((currentState) => !currentState);
                          }}
                          type="button"
                        >
                          <Ellipsis aria-hidden="true" className="assistant-panel__icon" />
                        </button>

                        {isAssistantMenuOpen ? (
                          <div
                            className="assistant-panel__menu-popover"
                            role="menu"
                          >
                            <button
                              className="assistant-panel__menu-item"
                              disabled={!workspace || assistantIsBusy}
                              onClick={() => {
                                void handleCreateAssistantThread();
                              }}
                              role="menuitem"
                              type="button"
                            >
                              New Chat
                            </button>
                            <button
                              className="assistant-panel__menu-item"
                              onClick={() => {
                                void handleRenameAssistantThread();
                              }}
                              role="menuitem"
                              type="button"
                            >
                              Rename Chat
                            </button>
                            <button
                              className="assistant-panel__menu-item assistant-panel__menu-item--danger"
                              onClick={() => {
                                void handleDeleteAssistantThread();
                              }}
                              role="menuitem"
                              type="button"
                            >
                              Delete Chat
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <div
                    ref={assistantBodyRef}
                    className="assistant-panel__body"
                    data-testid="assistant-transcript"
                  >
                    {!workspace ? null : !selectedDocumentId || !document ? (
                      <p className="assistant-panel__copy">
                        Select a note before asking Codex about this workspace.
                      </p>
                    ) : isAssistantThreadLoading ? (
                      <p className="assistant-panel__copy">Loading the selected Codex chat...</p>
                    ) : assistantVisibleMessages.length > 0 ? (
                      <ol className="assistant-message-list" aria-live="polite">
                        {assistantVisibleMessages.map((message) => (
                          <li
                            className={`assistant-message assistant-message--${message.role}`}
                            key={message.id}
                          >
                            <p className="assistant-message__role">
                              {message.role === "assistant" ? "Codex" : "You"}
                            </p>
                            <p className="assistant-message__content">{message.content}</p>
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {showAssistantThinking ? (
                      <p className="assistant-thinking-indicator" aria-live="polite">
                        Thinking...
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <section className="sidebar__section assistant-thread-list-section">
                    {!workspace || !selectedDocumentId ? (
                      <p className="workspace-panel__copy">Open a workspace to chat with the assistant</p>
                    ) : isAssistantListLoading ? (
                      <p className="workspace-panel__copy">Loading Codex chat history...</p>
                    ) : assistantThreads.length > 0 ? (
                      <ul className="assistant-thread-list" data-testid="assistant-thread-list">
                        {assistantThreads.map((thread) => (
                          <li key={thread.id}>
                            <button
                              className="assistant-thread-list__button"
                              onClick={() => {
                                handleOpenAssistantThread(thread.id);
                              }}
                              type="button"
                            >
                              <span className="assistant-thread-list__title">{thread.title || "New Chat"}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="workspace-panel__copy">No Codex chats yet for this workspace.</p>
                    )}
                  </section>
                </>
              )}

              {showAssistantFooter ? (
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
              ) : null}
            </>
          ) : (
            <section className="sidebar__section history-panel">
              {!workspace ? (
                <p className="workspace-panel__copy">Open a workspace to view history.</p>
              ) : !selectedDocumentId ? (
                <p className="workspace-panel__copy">Select a document to view commit history.</p>
              ) : (
                <>
                  {leftSidebarTab === "unpublished" ? (
                    <div className="history-remote-diff">
                      {isUnpublishedDiffLoading ? (
                        <p className="workspace-panel__copy">Loading remote diff...</p>
                      ) : unpublishedDiffError ? (
                        <p className="workspace-panel__error" role="status">
                          {unpublishedDiffError}
                        </p>
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
                  ) : (
                    <div className="history-commit-list">
                      {commitHistory.length > 0 ? (
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
                    </div>
                  )}
                </>
              )}

              {syncState?.status === "conflict" ? (
                <div className="history-conflicts">
                  {syncState.conflicts.map((conflict) => {
                    const selectedResolution = conflictSelectionByPath[conflict.relativePath] ?? "keep-local";
                    return (
                      <div className="history-conflict-card" key={conflict.relativePath}>
                        <p className="history-conflict-card__path">{conflict.relativePath}</p>
                        <div className="history-conflict-card__actions">
                          <button
                            className={`ghost-button${selectedResolution === "keep-local" ? " history-choice--active" : ""}`}
                            onClick={() => {
                              setConflictSelectionByPath((current) => ({
                                ...current,
                                [conflict.relativePath]: "keep-local",
                              }));
                            }}
                            type="button"
                          >
                            Keep local
                          </button>
                          <button
                            className={`ghost-button${selectedResolution === "keep-incoming" ? " history-choice--active" : ""}`}
                            onClick={() => {
                              setConflictSelectionByPath((current) => ({
                                ...current,
                                [conflict.relativePath]: "keep-incoming",
                              }));
                            }}
                            type="button"
                          >
                            Keep incoming
                          </button>
                          <button
                            className={`ghost-button${selectedResolution === "manual" ? " history-choice--active" : ""}`}
                            onClick={() => {
                              setConflictSelectionByPath((current) => ({
                                ...current,
                                [conflict.relativePath]: "manual",
                              }));
                              setManualConflictContentByPath((current) => ({
                                ...current,
                                [conflict.relativePath]: current[conflict.relativePath] ?? conflict.localContent,
                              }));
                            }}
                            type="button"
                          >
                            Combine manually
                          </button>
                        </div>
                        {selectedResolution === "manual" ? (
                          <textarea
                            className="history-conflict-card__textarea"
                            onChange={(event) => {
                              setManualConflictContentByPath((current) => ({
                                ...current,
                                [conflict.relativePath]: event.target.value,
                              }));
                            }}
                            value={manualConflictContentByPath[conflict.relativePath] ?? conflict.localContent}
                          />
                        ) : null}
                        <button
                          className="primary-button history-conflict-card__resolve"
                          disabled={isResolvingConflict}
                          onClick={() => {
                            void handleResolveSyncConflict(conflict);
                          }}
                          type="button"
                        >
                          Resolve file
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {historyError ? (
                <p className="workspace-panel__error" role="status">
                  {historyError}
                </p>
              ) : null}
            </section>
          )}
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
  onOpenDocumentContextMenu,
  onToggleDirectory,
}: {
  node: WorkspaceTreeNode;
  selectedDocumentId: string | null;
  expandedDirectoryIds: Set<string>;
  depth: number;
  onSelect: (documentId: string) => void;
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
        style={rowStyle}
        type="button"
      >
        <span className="tree-node__label">{node.displayTitle}</span>
      </button>
    </li>
  );
}

function countWorkspaceDocuments(nodes: WorkspaceTreeNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.kind === "document") {
      return count + 1;
    }

    return count + countWorkspaceDocuments(node.children);
  }, 0);
}

function getExpandedDirectoryIds(workspace: WorkspaceSummary | null): Set<string> {
  if (!workspace) {
    return new Set();
  }

  return new Set(collectDirectoryIds(workspace.documents));
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

function getLastAssistantMessage(thread: AssistantThread | null) {
  if (!thread) {
    return null;
  }

  for (let index = thread.messages.length - 1; index >= 0; index -= 1) {
    const message = thread.messages[index];

    if (message.role === "assistant") {
      return message;
    }
  }

  return null;
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

function getPreferredAssistantThreadId(
  threads: AssistantThreadSummary[],
  preferredThreadId?: string | null,
): string | null {
  if (preferredThreadId && threads.some((thread) => thread.id === preferredThreadId)) {
    return preferredThreadId;
  }

  return null;
}

export default App;
