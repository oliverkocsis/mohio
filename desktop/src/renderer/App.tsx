import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleAlert,
  ChevronDown,
  ChevronRight,
  FileText,
  GlobeOff,
  History as HistoryIcon,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  RefreshCw,
  Search,
  SendHorizontal,
  SquarePen,
  Trash2,
} from "lucide-react";
import type {
  AutoSyncStatus,
  AssistantThread,
  AssistantThreadSummary,
  CommitHistoryEntry,
  GitCapabilityState,
  RecentWorkspaceSummary,
  SyncState,
  WorkspaceDocument,
  WorkspaceGitStatus,
  WorkspaceSummary,
  WorkspaceTreeNode,
  WorkspaceSearchMatch,
} from "@shared/mohio-types";
import { RichTextEditor } from "./markdown-editor";

type SaveState = "error" | "idle" | "loading" | "saved" | "saving";
type LeftSidebarTab = "documents" | "search";
type RightSidebarTab = "assistant" | "versions";

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

const ASSISTANT_QUICK_ACTIONS = [
  {
    label: "Summarise document",
    prompt: "Summarise document in concise bullets.",
  },
  {
    label: "Improve document",
    prompt: "Improve document clarity, structure, and flow while keeping the original meaning.",
  },
] as const;
const SEARCH_DOCUMENTS_PLACEHOLDER = "Search by file name, path, or document content.";

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
  const [workspaceEntryScreen, setWorkspaceEntryScreen] = useState<"connect" | "welcome">("welcome");
  const [workspaceAddressInput, setWorkspaceAddressInput] = useState("");
  const [workspaceSaveLocationInput, setWorkspaceSaveLocationInput] = useState("");
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspaceSummary[]>([]);
  const [workspaceEntryError, setWorkspaceEntryError] = useState<string | null>(null);
  const [isWorkspaceEntryConnecting, setIsWorkspaceEntryConnecting] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState<LeftSidebarTab>("documents");
  const [rightSidebarTab, setRightSidebarTab] = useState<RightSidebarTab>("assistant");
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeDocumentPath, setActiveDocumentPath] = useState<string | null>(null);
  const [documentContextMenu, setDocumentContextMenu] = useState<DocumentContextMenuState | null>(null);

  const [syncNowError, setSyncNowError] = useState<string | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState<AutoSyncStatus | null>(null);
  const [, setSyncState] = useState<SyncState | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [gitCapabilityState, setGitCapabilityState] = useState<GitCapabilityState | null>(null);
  const [workspaceGitStatus, setWorkspaceGitStatus] = useState<WorkspaceGitStatus | null>(null);
  const [isRemoteDialogOpen, setIsRemoteDialogOpen] = useState(false);
  const [remoteDialogMode, setRemoteDialogMode] = useState<"connect" | "clone">("connect");
  const [remoteUrlInput, setRemoteUrlInput] = useState("");
  const [cloneDestination, setCloneDestination] = useState("");
  const [remoteDialogError, setRemoteDialogError] = useState<string | null>(null);
  const [remoteDialogNotice, setRemoteDialogNotice] = useState<string | null>(null);
  const [isRemoteActionInFlight, setIsRemoteActionInFlight] = useState(false);
  const [identityName, setIdentityName] = useState("");
  const [identityEmail, setIdentityEmail] = useState("");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [isIdentityDialogOpen, setIsIdentityDialogOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
  const [commitHistory, setCommitHistory] = useState<CommitHistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkspaceSearchMatch[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [assistantThreads, setAssistantThreads] = useState<AssistantThreadSummary[]>([]);
  const [assistantThread, setAssistantThread] = useState<AssistantThread | null>(null);
  const [assistantComposerValue, setAssistantComposerValue] = useState("");
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const editor = useDocumentEditorSession({
    relativePath: activeDocumentPath,
    onRelativePathChange: (nextRelativePath) => {
      setActiveDocumentPath(nextRelativePath);
    },
  });
  const activeDocument = editor.document;
  const activeDraftTitle = editor.draftTitle;
  const activeDraftMarkdown = editor.draftMarkdown;

  const refreshWorkspaceSummary = async () => {
    try {
      const nextWorkspace = await window.mohio.getCurrentWorkspace();
      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
      setWorkspaceError(null);
      setIsWorkspaceLoading(false);

      if (!nextWorkspace) {
        setActiveDocumentPath(null);
        return;
      }

      const availablePaths = new Set(collectDocumentIds(nextWorkspace.documents));
      setActiveDocumentPath((current) => (
        current && availablePaths.has(current)
          ? current
          : getPreferredDocumentId(nextWorkspace)
      ));
    } catch {
      setWorkspaceError("Mohio could not load the current workspace.");
      setIsWorkspaceLoading(false);
    }
  };

  const refreshRecentWorkspaces = async () => {
    try {
      const nextRecentWorkspaces = await window.mohio.listRecentWorkspaces();
      setRecentWorkspaces(nextRecentWorkspaces);
    } catch {
      setRecentWorkspaces([]);
    }
  };

  useEffect(() => {
    void refreshWorkspaceSummary();
    void refreshGitCapabilityState();
    void refreshRecentWorkspaces();

    const disposeWorkspaceListener = window.mohio.onWorkspaceChanged((nextWorkspace) => {
      setWorkspace(nextWorkspace);
      setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
    });

    return () => {
      disposeWorkspaceListener();
    };
  }, []);

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

  const refreshAutoSyncStatus = async () => {
    if (!workspace) {
      setAutoSyncStatus(null);
      return;
    }

    try {
      const nextStatus = await window.mohio.getAutoSyncStatus();
      setAutoSyncStatus(nextStatus);
    } catch {
      setAutoSyncStatus(null);
    }
  };

  const refreshGitCapabilityState = async () => {
    try {
      const capability = await window.mohio.getGitCapabilityState();
      setGitCapabilityState(capability);
    } catch {
      setGitCapabilityState(null);
    }
  };

  const refreshWorkspaceGitStatus = async () => {
    if (!workspace) {
      setWorkspaceGitStatus(null);
      return;
    }

    try {
      const status = await window.mohio.getWorkspaceGitStatus();
      setWorkspaceGitStatus(status);
      if (status.userName) {
        setIdentityName(status.userName);
      }
      if (status.userEmail) {
        setIdentityEmail(status.userEmail);
      }
    } catch {
      setWorkspaceGitStatus(null);
    }
  };

  useEffect(() => {
    if (!workspace) {
      setSyncState(null);
      setAutoSyncStatus(null);
      setWorkspaceGitStatus(null);
      setSyncNowError(null);
      return;
    }

    void refreshSyncState();
    void refreshAutoSyncStatus();
    void refreshWorkspaceGitStatus();
  }, [workspace?.path]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    const intervalId = window.setInterval(() => {
      // Periodic fetch-pull-merge (non-blocking background sync)
      void (async () => {
        try {
          setIsSyncingNow(true);
          await window.mohio.syncIncomingChanges();
        } catch {
          // Silently handle sync errors - user will see status in UI
        } finally {
          await refreshAutoSyncStatus();
          setIsSyncingNow(false);
        }
      })();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [workspace?.path]);

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
    if (!workspace || leftSidebarTab !== "search" || searchQuery.trim().length === 0) {
      if (!workspace || searchQuery.trim().length === 0) {
        setSearchResults([]);
      }
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
  }, [leftSidebarTab, searchQuery, workspace?.path]);

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

  const leftSidebarNodes = leftSidebarTab === "documents"
    ? (workspace?.documents ?? [])
    : [];
  const leftSidebarDocumentCount = countWorkspaceDocuments(leftSidebarNodes);

  const applyOpenedWorkspace = (nextWorkspace: WorkspaceSummary | null) => {
    setWorkspace(nextWorkspace);
    setExpandedDirectoryIds(getExpandedDirectoryIds(nextWorkspace));
    setWorkspaceError(null);
    setActiveDocumentPath(getPreferredDocumentId(nextWorkspace));
    setSearchQuery("");
  };

  const handleOpenWorkspace = async () => {
    try {
      setIsWorkspaceOpening(true);
      const nextWorkspace = await window.mohio.openWorkspace();
      applyOpenedWorkspace(nextWorkspace);
      setWorkspaceEntryScreen("welcome");
      setWorkspaceAddressInput("");
      setWorkspaceSaveLocationInput("");
      setWorkspaceEntryError(null);
    } catch {
      setWorkspaceError("Mohio could not open that folder as a workspace.");
    } finally {
      setIsWorkspaceLoading(false);
      setIsWorkspaceOpening(false);
    }
  };

  const handleOpenRecentWorkspace = async (workspacePath: string) => {
    try {
      setIsWorkspaceOpening(true);
      setWorkspaceEntryError(null);
      const nextWorkspace = await window.mohio.openWorkspacePath(workspacePath);
      applyOpenedWorkspace(nextWorkspace);
      setWorkspaceEntryScreen("welcome");
      setWorkspaceAddressInput("");
      setWorkspaceSaveLocationInput("");
    } catch {
      setWorkspaceEntryError("Mohio could not open that workspace.");
      await refreshRecentWorkspaces();
    } finally {
      setIsWorkspaceLoading(false);
      setIsWorkspaceOpening(false);
    }
  };

  const openRemoteDialog = (mode: "connect" | "clone") => {
    setRemoteDialogMode(mode);
    setRemoteDialogError(null);
    setRemoteDialogNotice(null);
    setRemoteUrlInput("");
    setCloneDestination("");
    setIsRemoteDialogOpen(true);
  };

  const openIdentityDialog = () => {
    setIdentityError(null);
    setIsIdentityDialogOpen(true);
  };

  const openDocument = async (documentId: string) => {
    if (documentId === activeDocumentPath) {
      return;
    }

    await editor.saveNow().catch(() => undefined);
    setActiveDocumentPath(documentId);
  };

  const handleSelectDocument = (documentId: string) => {
    void openDocument(documentId);
  };

  const handleCreateDocument = async () => {
    if (!workspace) {
      return;
    }

    setLeftSidebarTab("documents");

    const targetPath = activeDocumentPath;
    const directoryRelativePath = getDocumentDirectoryRelativePath(targetPath);

    try {
      await editor.saveNow().catch(() => undefined);
      const nextDocument = await window.mohio.createDocument({ directoryRelativePath });
      await refreshWorkspaceSummary();
      await refreshAutoSyncStatus();
      setActiveDocumentPath(nextDocument.relativePath);
    } catch {
      setWorkspaceError("Mohio could not create a new document.");
    }
  };

  const handleDeleteDocument = async (relativePath: string) => {
    if (!workspace) {
      return;
    }

    const confirmed = window.confirm("Delete this document from the workspace?");

    if (!confirmed) {
      return;
    }

    setDocumentContextMenu(null);

    try {
      await window.mohio.deleteDocument(relativePath);
      await refreshWorkspaceSummary();
      await refreshAutoSyncStatus();
    } catch {
      setWorkspaceError("Mohio could not delete that document.");
    }
  };

  const handleSyncNow = async () => {
    if (!workspace) {
      return;
    }

    try {
      setIsSyncingNow(true);
      await editor.saveNow().catch(() => undefined);
      const result = await window.mohio.syncWorkspaceChanges();
      setSyncNowError(null);
      if (result.requiresGitInstall) {
        setSyncNowError(result.message);
      } else if (result.requiresIdentitySetup) {
        setSyncNowError(result.message);
        openIdentityDialog();
      } else if (result.requiresRemoteConnect) {
        openRemoteDialog("connect");
      }
      await refreshSyncState();
      await refreshAutoSyncStatus();
      await refreshWorkspaceGitStatus();
    } catch {
      setSyncNowError("Mohio could not sync your workspace changes.");
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleChooseCloneDestination = async () => {
    try {
      const selectedPath = await window.mohio.chooseCloneDestination();
      if (selectedPath) {
        setCloneDestination(selectedPath);
      }
    } catch {
      setRemoteDialogError("Mohio could not open the folder picker.");
    }
  };

  const handleChooseWorkspaceSaveLocation = async () => {
    try {
      const selectedPath = await window.mohio.chooseCloneDestination();
      if (selectedPath) {
        setWorkspaceSaveLocationInput(selectedPath);
      }
    } catch {
      setWorkspaceEntryError("Mohio could not open the folder picker.");
    }
  };

  const handleConnectRemoteRepository = async () => {
    const remoteUrl = remoteUrlInput.trim();
    if (!remoteUrl) {
      setRemoteDialogError("Enter a remote Git URL first.");
      return;
    }

    try {
      setIsRemoteActionInFlight(true);
      setRemoteDialogError(null);
      const result = await window.mohio.connectRemoteRepository({
        remoteUrl,
      });

      if (result.requiresCloneForNonEmptyRemote) {
        setRemoteDialogError(result.message);
        return;
      }

      setRemoteDialogNotice(result.message);
      await refreshAutoSyncStatus();
      await refreshWorkspaceGitStatus();
      setIsRemoteDialogOpen(false);
    } catch {
      setRemoteDialogError("Mohio could not connect that repository.");
    } finally {
      setIsRemoteActionInFlight(false);
    }
  };

  const handleCloneRemoteRepository = async () => {
    const remoteUrl = remoteUrlInput.trim();
    if (!remoteUrl) {
      setRemoteDialogError("Enter a remote Git URL first.");
      return;
    }

    if (!cloneDestination) {
      setRemoteDialogError("Choose a destination folder first.");
      return;
    }

    try {
      setIsRemoteActionInFlight(true);
      setRemoteDialogError(null);
      const nextWorkspace = await window.mohio.cloneRemoteRepository({
        remoteUrl,
        parentDirectory: cloneDestination,
      });
      applyOpenedWorkspace(nextWorkspace);
      setIsRemoteDialogOpen(false);
      await refreshWorkspaceGitStatus();
      await refreshAutoSyncStatus();
    } catch {
      setRemoteDialogError("Mohio could not clone and open that repository.");
    } finally {
      setIsRemoteActionInFlight(false);
    }
  };

  const handleConnectWorkspaceFromEntry = async () => {
    if (!normalizedWorkspaceAddress || !workspaceSaveLocationInput.trim()) {
      return;
    }

    if (gitCapabilityState && !gitCapabilityState.gitAvailable) {
      setWorkspaceEntryError("Install Git before connecting a workspace.");
      return;
    }

    try {
      setIsWorkspaceEntryConnecting(true);
      setWorkspaceEntryError(null);
      const nextWorkspace = await window.mohio.cloneRemoteRepository({
        remoteUrl: normalizedWorkspaceAddress,
        parentDirectory: workspaceSaveLocationInput,
      });
      applyOpenedWorkspace(nextWorkspace);
      setWorkspaceEntryScreen("welcome");
      setWorkspaceAddressInput("");
      setWorkspaceSaveLocationInput("");
      await refreshWorkspaceGitStatus();
      await refreshAutoSyncStatus();
    } catch {
      setWorkspaceEntryError("Mohio could not connect that workspace.");
    } finally {
      setIsWorkspaceEntryConnecting(false);
    }
  };

  const handleSaveWorkspaceIdentity = async () => {
    if (!workspace) {
      return;
    }

    try {
      setIsSavingIdentity(true);
      setIdentityError(null);
      const status = await window.mohio.setWorkspaceGitIdentity({
        name: identityName,
        email: identityEmail,
      });
      setWorkspaceGitStatus(status);
      await refreshAutoSyncStatus();
      if (!status.requiresIdentitySetup) {
        setIsIdentityDialogOpen(false);
      }
    } catch {
      setIdentityError("Mohio could not save the workspace Git identity.");
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleSendAssistantMessage = async (messageOverride?: string) => {
    const trimmedMessage = (messageOverride ?? assistantComposerValue).trim();

    if (!workspace || !activeDocumentPath || !activeDocument || trimmedMessage.length === 0) {
      return;
    }

    setAssistantComposerValue("");

    try {
      await editor.saveNow().catch(() => undefined);


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
        documentRelativePath: activeDocumentPath,
        content: trimmedMessage,
        documentTitle: activeDraftTitle,
        documentMarkdown: activeDraftMarkdown,
      });

      setAssistantThread(nextThread);
      setAssistantError(null);
      const nextThreads = await window.mohio.listAssistantThreads();
      setAssistantThreads(nextThreads);
      await refreshAutoSyncStatus();
    } catch {
      setAssistantError("Mohio could not send that message to Codex.");
    }
  };



  useEffect(() => {
    if (!workspace || !activeDocumentPath || editor.saveState !== "saved") {
      return;
    }

    void refreshAutoSyncStatus();
  }, [activeDocumentPath, editor.saveState, workspace?.path]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const openRelativePathFromLink = (rawTarget: string) => {
    if (!workspace) {
      return;
    }

    if (!activeDocumentPath) {
      return;
    }

    const resolvedPath = resolveInternalLinkPath({
      rawTarget,
      sourceRelativePath: activeDocumentPath,
      workspace,
    });

    if (!resolvedPath) {
      return;
    }

    void openDocument(resolvedPath);
  };

  const syncControlState = getSyncControlState({
    hasWorkspace: Boolean(workspace),
    isOnline,
    isSyncingNow,
    hasPendingChanges: editor.isDirty || (autoSyncStatus?.hasUncommittedChanges ?? false),
    changedFileCount: Math.max(autoSyncStatus?.changedFileCount ?? 0, editor.isDirty ? 1 : 0),
    remoteConnected: (workspaceGitStatus?.remoteConnected ?? false) || (autoSyncStatus?.remoteConnected ?? false),
    lastSyncedAt: autoSyncStatus?.lastSyncedAt ?? null,
    hasSyncError: Boolean(syncNowError || syncError),
    hasGitAvailable: !(autoSyncStatus?.requiresGitInstall ?? false) && (workspaceGitStatus?.gitAvailable ?? true),
    requiresIdentitySetup: (autoSyncStatus?.requiresIdentitySetup ?? false) || (workspaceGitStatus?.requiresIdentitySetup ?? false),
  });
  const hasWorkspace = Boolean(workspace);
  const workspaceNameFromAddress = getWorkspaceNameFromAddress(workspaceAddressInput);
  const normalizedWorkspaceAddress = normalizeWorkspaceAddress(workspaceAddressInput);
  const hasValidWorkspaceAddress = isWorkspaceAddressValid(workspaceAddressInput);
  const canConnectWorkspaceFromEntry = Boolean(
    normalizedWorkspaceAddress &&
    hasValidWorkspaceAddress &&
    workspaceSaveLocationInput.trim() &&
    workspaceNameFromAddress,
  );
  const workspacePathPreview = canConnectWorkspaceFromEntry && workspaceNameFromAddress
    ? joinPathForPreview(workspaceSaveLocationInput, workspaceNameFromAddress)
    : null;
  const activeLeftSidebarTab: LeftSidebarTab | null = hasWorkspace ? leftSidebarTab : null;
  const activeRightSidebarTab: RightSidebarTab | null = hasWorkspace ? rightSidebarTab : null;
  const workspaceShellClassName = hasWorkspace
    ? `workspace-shell${isLeftPanelOpen ? "" : " workspace-shell--left-collapsed"}${isRightPanelOpen ? "" : " workspace-shell--right-collapsed"}`
    : "workspace-shell workspace-shell--no-workspace";

  return (
    <div className="app-shell">
      {hasWorkspace ? (
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
              <span className="workspace-label__name">{workspace?.name ?? "Open Folder"}</span>
              <span className="workspace-label__chevron" aria-hidden="true">
                <ChevronDown aria-hidden="true" className="toolbar-chevron-icon" />
              </span>
            </button>

            <div className="top-bar__context-actions">
              <button
                aria-label="Quick New Document"
                className="top-bar__icon-action"
                onClick={() => {
                  void handleCreateDocument();
                }}
                type="button"
              >
                <SquarePen aria-hidden="true" className="top-bar__icon-action-icon" />
              </button>
            </div>
          </div>

          <div className="top-bar__actions">
            <button
              aria-label="Sync now"
              className={`top-bar__sync-status-action${syncControlState.variant === "offline" ? " top-bar__sync-status-action--offline" : ""}${syncControlState.variant === "error" ? " top-bar__sync-status-action--error" : ""}`}
              disabled={syncControlState.isDisabled}
              onClick={() => {
                if (syncControlState.action === "identity") {
                  openIdentityDialog();
                } else if (syncControlState.action === "connect-remote") {
                  openRemoteDialog("connect");
                } else {
                  void handleSyncNow();
                }
              }}
              type="button"
            >
              <span className="top-bar__sync-status-label">{syncControlState.label}</span>
              {syncControlState.icon === "alert" ? (
                <CircleAlert aria-hidden="true" className="top-bar__sync-icon" />
              ) : syncControlState.icon === "offline" ? (
                <GlobeOff aria-hidden="true" className="top-bar__sync-icon" />
              ) : (
                <RefreshCw
                  aria-hidden="true"
                  className={`top-bar__sync-icon${syncControlState.isSpinning ? " top-bar__sync-icon--spinning" : ""}`}
                />
              )}
            </button>

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
      ) : null}

      <div className={workspaceShellClassName}>
        {hasWorkspace && isLeftPanelOpen ? (
          <aside className="sidebar sidebar--left" data-testid="workspace-sidebar">
            <section className="sidebar__section sidebar__section--edge-tabs">
              <div className="sidebar-tabs sidebar-tabs--underlined" role="tablist" aria-label="Workspace views">
                <button
                  aria-selected={activeLeftSidebarTab === "documents"}
                  className={`sidebar-tab sidebar-tab--underlined${activeLeftSidebarTab === "documents" ? " sidebar-tab--active" : ""}`}
                  disabled={!hasWorkspace}
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
                  aria-selected={activeLeftSidebarTab === "search"}
                  className={`sidebar-tab sidebar-tab--underlined${activeLeftSidebarTab === "search" ? " sidebar-tab--active" : ""}`}
                  disabled={!hasWorkspace}
                  onClick={() => {
                    setLeftSidebarTab("search");
                  }}
                  role="tab"
                  type="button"
                >
                  <Search aria-hidden="true" className="sidebar-tab__icon" />
                  Search
                </button>
              </div>
            </section>

            <section className="sidebar__section workspace-panel">
              <div className="workspace-panel__scroll">
                {activeLeftSidebarTab === "search" ? (
                  <section className="workspace-search-panel" data-testid="workspace-search-panel">
                    <input
                      aria-label="Search documents"
                      className="search-input workspace-search-panel__input"
                      disabled={!workspace}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                      }}
                      placeholder={SEARCH_DOCUMENTS_PLACEHOLDER}
                      type="search"
                      value={searchQuery}
                    />

                    {isWorkspaceLoading ? (
                      <p className="workspace-panel__copy">Loading current workspace...</p>
                    ) : !workspace ? null : searchQuery.trim().length > 0 ? (
                      <div className="workspace-search-results" data-testid="workspace-search-results">
                        {isSearchLoading ? (
                          <p className="workspace-panel__copy">Searching workspace...</p>
                        ) : searchResults.length === 0 ? (
                          <p className="workspace-panel__copy">No matching documents found.</p>
                        ) : (
                          <ul className="workspace-tree" role="list">
                            {searchResults.map((result) => (
                              <li className="tree-node" key={`${result.relativePath}-${result.matchType}`}>
                                <button
                                  className="tree-node__button"
                                  onClick={() => {
                                    handleSelectDocument(result.relativePath);
                                  }}
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    setDocumentContextMenu({
                                      documentId: result.relativePath,
                                      x: event.clientX,
                                      y: event.clientY,
                                    });
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
                    ) : null}
                  </section>
                ) : isWorkspaceLoading ? (
                  <p className="workspace-panel__copy">Loading current workspace...</p>
                ) : workspace ? (
                  leftSidebarDocumentCount === 0 ? (
                    <p className="workspace-panel__copy">No Markdown documents found.</p>
                  ) : (
                    <ul className="workspace-tree" role="tree">
                      {leftSidebarNodes.map((node) =>
                        renderWorkspaceNode({
                          node,
                          selectedDocumentId: activeDocumentPath,
                          expandedDirectoryIds,
                          depth: 0,
                          onSelect: (documentId) => {
                            handleSelectDocument(documentId);
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
                ) : null}

                {workspaceError ? <p className="workspace-panel__error" role="status">{workspaceError}</p> : null}
                {syncNowError ? <p className="workspace-panel__error" role="status">{syncNowError}</p> : null}
                {syncError ? <p className="workspace-panel__error" role="status">{syncError}</p> : null}
                {workspace && workspaceGitStatus && !workspaceGitStatus.gitAvailable ? (
                  <p className="workspace-panel__error" role="status">
                    Install Git to enable snapshots and remote sync.
                  </p>
                ) : null}

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
                      className="workspace-document-menu__item workspace-document-menu__item--danger"
                      onClick={() => {
                        void handleDeleteDocument(documentContextMenu.documentId);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="workspace-document-menu__icon" />
                      <span>Delete Document</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        ) : null}

        <main className="editor-panel">
          {hasWorkspace ? (
            <EditorPane
              dataTestId="document-state-primary"
              editor={editor}
              hasWorkspace={hasWorkspace}
              highlightQuery={searchQuery}
              onOpenInternalLink={openRelativePathFromLink}
            />
          ) : null}
          {!hasWorkspace ? (
            <WorkspaceEntryCard
              canConnectWorkspace={canConnectWorkspaceFromEntry}
              recentWorkspaces={recentWorkspaces}
              isWorkspaceOpening={isWorkspaceOpening}
              isConnectingWorkspace={isWorkspaceEntryConnecting}
              pathPreview={workspacePathPreview}
              saveLocation={workspaceSaveLocationInput}
              screen={workspaceEntryScreen}
              workspaceAddress={workspaceAddressInput}
              error={workspaceEntryError}
              onChooseSaveLocation={() => {
                void handleChooseWorkspaceSaveLocation();
              }}
              onConnectWorkspace={() => {
                void handleConnectWorkspaceFromEntry();
              }}
              onOpenWorkspace={() => {
                void handleOpenWorkspace();
              }}
              onOpenRecentWorkspace={(workspacePath) => {
                void handleOpenRecentWorkspace(workspacePath);
              }}
              onSetScreen={(nextScreen) => {
                setWorkspaceEntryScreen(nextScreen);
                setWorkspaceEntryError(null);
              }}
              onWorkspaceAddressChange={setWorkspaceAddressInput}
            />
          ) : null}
        </main>

        {hasWorkspace && isRightPanelOpen ? (
          <aside className="sidebar sidebar--right" data-testid="assistant-sidebar">
            <section className="sidebar__section sidebar__section--edge-tabs">
              <div className="sidebar-tabs sidebar-tabs--underlined" role="tablist" aria-label="Right panel views">
                <button
                  aria-selected={activeRightSidebarTab === "assistant"}
                  className={`sidebar-tab sidebar-tab--underlined${activeRightSidebarTab === "assistant" ? " sidebar-tab--active" : ""}`}
                  disabled={!hasWorkspace}
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
                  aria-selected={activeRightSidebarTab === "versions"}
                  className={`sidebar-tab sidebar-tab--underlined${activeRightSidebarTab === "versions" ? " sidebar-tab--active" : ""}`}
                  disabled={!hasWorkspace}
                  onClick={() => {
                    setRightSidebarTab("versions");
                  }}
                  role="tab"
                  type="button"
                >
                  <HistoryIcon aria-hidden="true" className="sidebar-tab__icon" />
                  Versions
                </button>
              </div>
            </section>

            {activeRightSidebarTab === "assistant" ? (
              <section className="sidebar__section assistant-panel">
                {!workspace ? null : !activeDocumentPath ? (
                  <p className="workspace-panel__copy">Select a document to chat with Codex.</p>
                ) : (
                  <>
                    <div className="assistant-panel__body">
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
                    </div>

                    <div className="assistant-panel__footer">
                      <ul className="action-list">
                        {ASSISTANT_QUICK_ACTIONS.map((action) => (
                          <li key={action.label}>
                            <button
                              className="assistant-action-chip"
                              onClick={() => {
                                void handleSendAssistantMessage(action.prompt);
                              }}
                              type="button"
                            >
                              {action.label}
                            </button>
                          </li>
                        ))}
                      </ul>

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
                            placeholder="Ask about this document or workspace"
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
                    </div>
                  </>
                )}
              </section>
            ) : null}

            {activeRightSidebarTab === "versions" ? (
              <section className="sidebar__section history-panel">
                {!workspace ? null : !activeDocumentPath ? (
                  <p className="workspace-panel__copy">Select a document to view commit history.</p>
                ) : (
                  <>
                    {isHistoryLoading ? (
                      <p className="workspace-panel__copy">Loading commit history...</p>
                    ) : commitHistory.length > 0 ? (
                      <ul className="history-commit-list__items">
                        {commitHistory.map((commit) => (
                          <li className="history-commit-list__item" key={commit.sha}>
                            <p className="history-commit-list__subject">{formatCommitSubject(commit.subject)}</p>
                            <p className="history-commit-list__meta">
                              {new Date(commit.authoredAt).toLocaleString()} · {formatCommitAuthor(commit.authorName)} · {formatCommitFileCount(commit.shortStat)}
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
          </aside>
        ) : null}
      </div>

      {isIdentityDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="modal-dialog" role="dialog" aria-modal="true" aria-label="Set Git identity">
            <header className="modal-dialog__header">
              <h2>Set Git identity</h2>
              <button
                aria-label="Close Git identity dialog"
                className="top-bar__icon-action"
                onClick={() => {
                  setIsIdentityDialogOpen(false);
                }}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <p className="workspace-panel__copy">
              Mohio uses this identity for workspace snapshots and sync commits.
            </p>
            <div className="modal-dialog__section">
              <label className="modal-dialog__label" htmlFor="git-identity-name">Name</label>
              <input
                aria-label="Git author name"
                className="search-input"
                id="git-identity-name"
                onChange={(event) => {
                  setIdentityName(event.target.value);
                }}
                placeholder="Name"
                type="text"
                value={identityName}
              />
              <label className="modal-dialog__label" htmlFor="git-identity-email">Email</label>
              <input
                aria-label="Git author email"
                className="search-input"
                id="git-identity-email"
                onChange={(event) => {
                  setIdentityEmail(event.target.value);
                }}
                placeholder="Email"
                type="email"
                value={identityEmail}
              />
            </div>
            <div className="modal-dialog__actions">
              <button
                className="primary-button"
                disabled={isSavingIdentity}
                onClick={() => {
                  void handleSaveWorkspaceIdentity();
                }}
                type="button"
              >
                {isSavingIdentity ? "Saving..." : "Save identity"}
              </button>
            </div>
            {identityError ? <p className="workspace-panel__error" role="status">{identityError}</p> : null}
          </section>
        </div>
      ) : null}

      {isRemoteDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="modal-dialog" role="dialog" aria-modal="true" aria-label="Remote repository">
            <header className="modal-dialog__header">
              <h2>{remoteDialogMode === "clone" ? "Open Remote Repository" : "Connect Remote Repository"}</h2>
              <button
                aria-label="Close remote repository dialog"
                className="top-bar__icon-action"
                onClick={() => {
                  setIsRemoteDialogOpen(false);
                }}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </header>
            <div className="modal-dialog__section">
              <label className="modal-dialog__label" htmlFor="remote-repository-url">Workspace address</label>
              <input
                aria-label="Workspace address"
                className="search-input"
                id="remote-repository-url"
                onChange={(event) => {
                  setRemoteUrlInput(event.target.value);
                }}
                placeholder="e.g. github.com/your-team/workspace"
                type="text"
                value={remoteUrlInput}
              />
              <p className="modal-dialog__hint">
                The link your team shared. Works with GitHub, GitLab, or any Git address.
              </p>
            </div>

            {remoteDialogMode === "clone" ? (
              <div className="modal-dialog__section">
                <label className="modal-dialog__label" htmlFor="clone-destination">Clone destination</label>
                <div className="modal-dialog__destination-row">
                  <input className="search-input" id="clone-destination" readOnly type="text" value={cloneDestination} />
                  <button className="secondary-button" onClick={() => {
                    void handleChooseCloneDestination();
                  }} type="button">
                    Choose
                  </button>
                </div>
              </div>
            ) : null}

            <div className="modal-dialog__actions">
              <button
                className="primary-button"
                disabled={isRemoteActionInFlight}
                onClick={() => {
                  if (remoteDialogMode === "clone") {
                    void handleCloneRemoteRepository();
                  } else {
                    void handleConnectRemoteRepository();
                  }
                }}
                type="button"
              >
                {isRemoteActionInFlight
                  ? "Working..."
                  : remoteDialogMode === "clone"
                    ? "Clone and Open"
                    : "Connect Repository"}
              </button>
            </div>

            {remoteDialogNotice ? <p className="workspace-panel__copy" role="status">{remoteDialogNotice}</p> : null}
            {remoteDialogError ? <p className="workspace-panel__error" role="status">{remoteDialogError}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EditorPane({
  dataTestId,
  editor,
  hasWorkspace,
  highlightQuery,
  onOpenInternalLink,
}: {
  dataTestId: string;
  editor: DocumentEditorSession;
  hasWorkspace: boolean;
  highlightQuery: string;
  onOpenInternalLink: (rawTarget: string) => void;
}) {
  return (
    <section className="editor-pane editor-panel__inner" data-testid={dataTestId}>
      {editor.document ? (
        <RichTextEditor
          dataTestId={`${dataTestId}-editor`}
          highlightQuery={highlightQuery}
          markdown={editor.draftMarkdown}
          onChange={editor.setDraftMarkdown}
          onInternalLinkOpen={(selection) => {
            onOpenInternalLink(selection.target);
          }}
          onTitleChange={editor.setDraftTitle}
          sourceRelativePath={editor.document.relativePath}
          title={editor.draftTitle}
        />
      ) : (
        <section className="empty-workspace-state" data-testid={`${dataTestId}-empty`}>
          <p className="empty-workspace-state__copy">
            {hasWorkspace
              ? "Select a document to start writing."
              : "Choose a folder to open your Mohio workspace."}
          </p>
        </section>
      )}
    </section>
  );
}

function WorkspaceEntryCard({
  canConnectWorkspace,
  error,
  isConnectingWorkspace,
  isWorkspaceOpening,
  onChooseSaveLocation,
  onConnectWorkspace,
  onOpenWorkspace,
  onOpenRecentWorkspace,
  onSetScreen,
  onWorkspaceAddressChange,
  pathPreview,
  recentWorkspaces,
  saveLocation,
  screen,
  workspaceAddress,
}: {
  canConnectWorkspace: boolean;
  error: string | null;
  isConnectingWorkspace: boolean;
  isWorkspaceOpening: boolean;
  onChooseSaveLocation: () => void;
  onConnectWorkspace: () => void;
  onOpenWorkspace: () => void;
  onOpenRecentWorkspace: (workspacePath: string) => void;
  onSetScreen: (nextScreen: "connect" | "welcome") => void;
  onWorkspaceAddressChange: (nextValue: string) => void;
  pathPreview: string | null;
  recentWorkspaces: RecentWorkspaceSummary[];
  saveLocation: string;
  screen: "connect" | "welcome";
  workspaceAddress: string;
}) {
  const hasRecentWorkspaces = recentWorkspaces.length > 0;

  return (
    <section className="workspace-entry" data-testid="workspace-entry">
      <article className="workspace-entry__card">
        {screen === "welcome" ? (
          <div className="workspace-entry__welcome">
            <div className="workspace-entry__intro">
              <h1 className="workspace-entry__title">Welcome to Mohio</h1>
              <p className="workspace-entry__description">
                A simple workspace for your team to capture and share knowledge in plain text files that you own, built to work with your favourite AI.
              </p>
            </div>

            {hasRecentWorkspaces ? (
              <section className="workspace-entry__recent">
                <h2 className="workspace-entry__recent-title">Recent workspaces</h2>
                <ul className="workspace-entry__recent-list">
                  {recentWorkspaces.map((recentWorkspace) => (
                    <li key={recentWorkspace.path} className="workspace-entry__recent-item">
                      <button
                        className={`workspace-entry__cta-link${recentWorkspace.exists ? "" : " workspace-entry__recent-link--missing"}`}
                        disabled={!recentWorkspace.exists || isWorkspaceOpening}
                        onClick={() => {
                          onOpenRecentWorkspace(recentWorkspace.path);
                        }}
                        title={recentWorkspace.exists ? recentWorkspace.path : "Folder not found"}
                        type="button"
                      >
                        {recentWorkspace.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasRecentWorkspaces ? <hr className="workspace-entry__divider" /> : null}

            <div className="workspace-entry__actions">
              <button
                className="primary-button workspace-entry__action-button"
                disabled={isWorkspaceOpening}
                onClick={onOpenWorkspace}
                type="button"
              >
                {isWorkspaceOpening ? "Opening..." : "Open a folder as workspace"}
              </button>
              <button
                className="secondary-button workspace-entry__action-button"
                onClick={() => {
                  onSetScreen("connect");
                }}
                type="button"
              >
                Connect to a remote workspace
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="workspace-entry__title">Connect to a workspace</h1>
            <div className="workspace-entry__form">
              <label className="workspace-entry__label" htmlFor="workspace-address-input">Workspace address</label>
              <input
                className="search-input"
                id="workspace-address-input"
                onChange={(event) => {
                  onWorkspaceAddressChange(event.target.value);
                }}
                placeholder="e.g. github.com/your-team/workspace"
                type="text"
                value={workspaceAddress}
              />
              <p className="workspace-entry__hint">
                The link your team shared. Works with GitHub, GitLab, or any Git address.
              </p>

              <label className="workspace-entry__label" htmlFor="workspace-save-location-input">Save location</label>
              <div className="workspace-entry__location-row">
                <input
                  className="search-input"
                  id="workspace-save-location-input"
                  placeholder="Choose a folder..."
                  readOnly
                  type="text"
                  value={saveLocation}
                />
                <button
                  className="secondary-button"
                  onClick={onChooseSaveLocation}
                  type="button"
                >
                  Choose
                </button>
              </div>
              <p className="workspace-entry__hint">
                A new folder will be created here using the workspace name.
              </p>

              <p className={`workspace-entry__path-preview${pathPreview ? " workspace-entry__path-preview--visible" : ""}`} aria-hidden={!pathPreview}>
                {pathPreview ?? ""}
              </p>
            </div>

            <div className="workspace-entry__footer">
              <button
                className="primary-button workspace-entry__action-button"
                disabled={!canConnectWorkspace || isConnectingWorkspace}
                onClick={onConnectWorkspace}
                type="button"
              >
                {isConnectingWorkspace ? "Connecting..." : "Connect workspace"}
              </button>
              <button
                className="secondary-button workspace-entry__action-button"
                onClick={() => {
                  onSetScreen("welcome");
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {error ? <p className="workspace-panel__error workspace-entry__error" role="status">{error}</p> : null}
      </article>
    </section>
  );
}

type SyncControlIcon = "alert" | "offline" | "refresh";
type SyncControlVariant = "error" | "normal" | "offline" | "pending" | "syncing";

interface SyncControlState {
  action: "connect-remote" | "identity" | "sync";
  icon: SyncControlIcon;
  isDisabled: boolean;
  isSpinning: boolean;
  label: string;
  variant: SyncControlVariant;
}

function getSyncControlState({
  hasWorkspace,
  isOnline,
  isSyncingNow,
  hasPendingChanges,
  changedFileCount,
  remoteConnected,
  lastSyncedAt,
  hasSyncError,
  hasGitAvailable,
  requiresIdentitySetup,
}: {
  hasWorkspace: boolean;
  isOnline: boolean;
  isSyncingNow: boolean;
  hasPendingChanges: boolean;
  changedFileCount?: number;
  remoteConnected: boolean;
  lastSyncedAt: string | null;
  hasSyncError: boolean;
  hasGitAvailable: boolean;
  requiresIdentitySetup: boolean;
}): SyncControlState {
  const isDisabled = !hasWorkspace || !isOnline || isSyncingNow || !hasPendingChanges;

  if (!hasWorkspace) {
    return {
      action: "sync",
      icon: "refresh",
      isDisabled: true,
      isSpinning: false,
      label: "Open workspace",
      variant: "normal",
    };
  }

  if (isSyncingNow) {
    return {
      action: "sync",
      icon: "refresh",
      isDisabled: true,
      isSpinning: true,
      label: "Syncing...",
      variant: "syncing",
    };
  }

  const relative = lastSyncedAt ? formatRelativeTime(lastSyncedAt) : null;

  if (!hasGitAvailable) {
    return {
      action: "sync",
      icon: "alert",
      isDisabled: true,
      isSpinning: false,
      label: "Install Git",
      variant: "error",
    };
  }

  if (requiresIdentitySetup) {
    return {
      action: "identity",
      icon: "alert",
      isDisabled: false,
      isSpinning: false,
      label: "Set Git identity",
      variant: "error",
    };
  }

  if (!remoteConnected) {
    return {
      action: "connect-remote",
      icon: "alert",
      isDisabled: false,
      isSpinning: false,
      label: "Connect remote repo to share",
      variant: "pending",
    };
  }

  if (!isOnline) {
    return {
      action: "sync",
      icon: "offline",
      isDisabled: true,
      isSpinning: false,
      label: relative ? `Offline (last synced ${relative})` : "Offline",
      variant: "offline",
    };
  }

  if (hasSyncError) {
    return {
      action: "sync",
      icon: "alert",
      isDisabled: true,
      isSpinning: false,
      label: "Sync paused",
      variant: "error",
    };
  }

  // 3-state model: Syncing (handled above), Local Changes, or Synced
  if (hasPendingChanges) {
    const changeCount = changedFileCount ?? 1;
    const label = changeCount === 1 ? "1 local change" : `${changeCount} local changes`;
    return {
      action: "sync",
      icon: "refresh",
      isDisabled: false,
      isSpinning: false,
      label,
      variant: "pending",
    };
  }

  return {
    action: "sync",
    icon: "refresh",
    isDisabled,
    isSpinning: false,
    label: relative ? `Synced ${relative}` : "Synced",
    variant: "normal",
  };
}

function formatRelativeTime(isoDateTime: string): string | null {
  const sharedAt = new Date(isoDateTime);
  const milliseconds = sharedAt.getTime();
  if (!Number.isFinite(milliseconds)) {
    return null;
  }

  const secondsElapsed = Math.max(0, Math.floor((Date.now() - milliseconds) / 1000));
  if (secondsElapsed < 60) {
    return "just now";
  }

  const minutes = Math.floor(secondsElapsed / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(secondsElapsed / 3_600);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(secondsElapsed / 86_400);
  if (days <= 31) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function formatCommitSubject(subject: string): string {
  if (/^Snapshot:\s+\d{4}-\d{2}-\d{2}$/.test(subject)) {
    return "Snapshot";
  }

  return subject;
}

function formatCommitAuthor(authorName: string): string {
  const trimmed = authorName.trim();
  return trimmed.length > 0 ? trimmed : "Unknown";
}

function formatCommitFileCount(shortStat: string | null): string {
  if (!shortStat) {
    return "No file stats";
  }

  const fileMatch = shortStat.match(/(\d+)\s+files?\s+changed/);
  if (!fileMatch) {
    return shortStat;
  }

  const fileLabel = fileMatch[1] === "1" ? "file changed" : "files changed";
  return `${fileMatch[1]} ${fileLabel}`;
}

function normalizeWorkspaceAddress(rawAddress: string): string | null {
  const trimmed = rawAddress.trim();
  if (!trimmed) {
    return null;
  }

  if (
    /^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed) ||
    /^[^@\s]+@[^:\s]+:.+/u.test(trimmed)
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getWorkspaceNameFromAddress(rawAddress: string): string | null {
  const normalizedAddress = normalizeWorkspaceAddress(rawAddress);
  if (!normalizedAddress) {
    return null;
  }

  const withoutQuery = normalizedAddress
    .replace(/[?#].*$/u, "")
    .replace(/\/+$/u, "");
  const normalizedPath = withoutQuery.replace(/^([^@]+@[^:]+):/u, "$1/");
  const segment = normalizedPath.split("/").at(-1)?.trim() ?? "";
  if (!segment) {
    return null;
  }

  const withoutGitSuffix = segment.replace(/\.git$/iu, "");
  return withoutGitSuffix || null;
}

function isWorkspaceAddressValid(rawAddress: string): boolean {
  const normalizedAddress = normalizeWorkspaceAddress(rawAddress);
  if (!normalizedAddress) {
    return false;
  }

  if (/^[^@\s]+@[^:\s]+:.+/u.test(normalizedAddress)) {
    const pathPart = normalizedAddress.split(":").slice(1).join(":");
    return pathPart.split("/").filter((segment) => segment.trim().length > 0).length > 0;
  }

  try {
    const parsedUrl = new URL(normalizedAddress);
    return parsedUrl.pathname.split("/").filter((segment) => segment.trim().length > 0).length > 0;
  } catch {
    return false;
  }
}

function joinPathForPreview(parentPath: string, childName: string): string {
  const trimmedParentPath = parentPath.trim().replace(/[\\/]+$/u, "");
  if (!trimmedParentPath) {
    return childName;
  }

  const separator = trimmedParentPath.includes("\\") ? "\\" : "/";
  return `${trimmedParentPath}${separator}${childName}`;
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
