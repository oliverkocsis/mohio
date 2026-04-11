import type {
  AssistantEvent,
  AssistantThread,
  AssistantThreadSummary,
  AutoSyncStatus,
  CloneRemoteRepositoryInput,
  CommitHistoryEntry,
  ConnectRemoteRepositoryInput,
  ConnectRemoteRepositoryResult,
  GitCapabilityState,
  RecentWorkspaceSummary,
  UnpublishedDiffResult,
  RecordRiskyCommitInput,
  AppInfo,
  CreateDocumentInput,
  DocumentChangedEvent,
  MohioApi,
  PublishSummary,
  ResolveConflictInput,
  RenameAssistantThreadInput,
  SetWorkspaceGitIdentityInput,
  SendAssistantMessageInput,
  SaveDocumentInput,
  SaveDocumentResult,
  SyncWorkspaceResult,
  SyncState,
  WorkspaceDocument,
  WorkspaceGitStatus,
  WorkspaceSearchMatch,
  WorkspaceSummary,
} from "./mohio-types";

export const MOHIO_CHANNELS = {
  getCurrentWorkspace: "mohio:workspace:get-current",
  openWorkspace: "mohio:workspace:open",
  openWorkspacePath: "mohio:workspace:open-path",
  listRecentWorkspaces: "mohio:workspace:list-recent",
  searchWorkspace: "mohio:workspace:search",
  readDocument: "mohio:document:read",
  createDocument: "mohio:document:create",
  deleteDocument: "mohio:document:delete",
  saveDocument: "mohio:document:save",
  recordRiskyCommit: "mohio:commit:record-risky",
  recordAutoSaveCommit: "mohio:commit:record-auto-save",
  listCommitHistory: "mohio:history:commits",
  getUnpublishedDiff: "mohio:history:unpublished-diff",
  getPublishSummary: "mohio:publish:summary",
  getGitCapabilityState: "mohio:git:capability",
  getWorkspaceGitStatus: "mohio:git:workspace-status",
  setWorkspaceGitIdentity: "mohio:git:set-identity",
  syncWorkspaceChanges: "mohio:sync:workspace-changes",
  getAutoSyncStatus: "mohio:sync:auto-status",
  syncIncomingChanges: "mohio:sync:incoming",
  getSyncState: "mohio:sync:state",
  resolveSyncConflict: "mohio:sync:resolve-conflict",
  connectRemoteRepository: "mohio:remote:connect-repository",
  chooseCloneDestination: "mohio:remote:choose-clone-destination",
  cloneRemoteRepository: "mohio:remote:clone-repository",
  watchDocument: "mohio:document:watch",
  listAssistantThreads: "mohio:assistant:list-threads",
  createAssistantThread: "mohio:assistant:create-thread",
  getAssistantThread: "mohio:assistant:get-thread",
  sendAssistantMessage: "mohio:assistant:send-message",
  cancelAssistantRun: "mohio:assistant:cancel-run",
  renameAssistantThread: "mohio:assistant:rename-thread",
  deleteAssistantThread: "mohio:assistant:delete-thread",
  documentChanged: "mohio:document:changed",
  workspaceChanged: "mohio:workspace:changed",
  assistantEvent: "mohio:assistant:event",
} as const;

interface CreateMohioApiOptions {
  appInfo: AppInfo;
  getCurrentWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspacePath: (workspacePath: string) => Promise<WorkspaceSummary | null>;
  listRecentWorkspaces: () => Promise<RecentWorkspaceSummary[]>;
  searchWorkspace: (query: string) => Promise<WorkspaceSearchMatch[]>;
  readDocument: (relativePath: string) => Promise<WorkspaceDocument>;
  createDocument: (input: CreateDocumentInput) => Promise<WorkspaceDocument>;
  deleteDocument: (relativePath: string) => Promise<void>;
  saveDocument: (input: SaveDocumentInput) => Promise<SaveDocumentResult>;
  recordRiskyCommit: (input: RecordRiskyCommitInput) => Promise<boolean>;
  recordAutoSaveCommit: () => Promise<boolean>;
  listCommitHistory: (relativePath: string | null) => Promise<CommitHistoryEntry[]>;
  getUnpublishedDiff: (relativePath: string) => Promise<UnpublishedDiffResult>;
  getPublishSummary: () => Promise<PublishSummary>;
  getGitCapabilityState: () => Promise<GitCapabilityState>;
  getWorkspaceGitStatus: () => Promise<WorkspaceGitStatus>;
  setWorkspaceGitIdentity: (input: SetWorkspaceGitIdentityInput) => Promise<WorkspaceGitStatus>;
  syncWorkspaceChanges: () => Promise<SyncWorkspaceResult>;
  getAutoSyncStatus: () => Promise<AutoSyncStatus>;
  syncIncomingChanges: (reason: string) => Promise<SyncState>;
  getSyncState: () => Promise<SyncState>;
  resolveSyncConflict: (input: ResolveConflictInput) => Promise<SyncState>;
  connectRemoteRepository: (input: ConnectRemoteRepositoryInput) => Promise<ConnectRemoteRepositoryResult>;
  chooseCloneDestination: () => Promise<string | null>;
  cloneRemoteRepository: (input: CloneRemoteRepositoryInput) => Promise<WorkspaceSummary>;
  watchDocument: (relativePath: string | null) => Promise<void>;
  listAssistantThreads: () => Promise<AssistantThreadSummary[]>;
  createAssistantThread: () => Promise<AssistantThread>;
  getAssistantThread: (threadId: string) => Promise<AssistantThread>;
  sendAssistantMessage: (input: SendAssistantMessageInput) => Promise<AssistantThread>;
  cancelAssistantRun: (threadId: string) => Promise<void>;
  renameAssistantThread: (input: RenameAssistantThreadInput) => Promise<void>;
  deleteAssistantThread: (threadId: string) => Promise<void>;
  onDocumentChanged: (
    listener: (event: DocumentChangedEvent) => void,
  ) => () => void;
  onWorkspaceChanged: (
    listener: (workspace: WorkspaceSummary | null) => void,
  ) => () => void;
  onAssistantEvent: (
    listener: (event: AssistantEvent) => void,
  ) => () => void;
}

export function createMohioApi({
  appInfo,
  getCurrentWorkspace,
  openWorkspace,
  openWorkspacePath,
  listRecentWorkspaces,
  searchWorkspace,
  readDocument,
  createDocument,
  deleteDocument,
  saveDocument,
  recordRiskyCommit,
  recordAutoSaveCommit,
  listCommitHistory,
  getUnpublishedDiff,
  getPublishSummary,
  getGitCapabilityState,
  getWorkspaceGitStatus,
  setWorkspaceGitIdentity,
  syncWorkspaceChanges,
  getAutoSyncStatus,
  syncIncomingChanges,
  getSyncState,
  resolveSyncConflict,
  connectRemoteRepository,
  chooseCloneDestination,
  cloneRemoteRepository,
  watchDocument,
  listAssistantThreads,
  createAssistantThread,
  getAssistantThread,
  sendAssistantMessage,
  cancelAssistantRun,
  renameAssistantThread,
  deleteAssistantThread,
  onDocumentChanged,
  onWorkspaceChanged,
  onAssistantEvent,
}: CreateMohioApiOptions): MohioApi {
  return {
    getAppInfo: () => appInfo,
    getCurrentWorkspace,
    openWorkspace,
    openWorkspacePath,
    listRecentWorkspaces,
    searchWorkspace,
    readDocument,
    createDocument,
    deleteDocument,
    saveDocument,
    recordRiskyCommit,
    recordAutoSaveCommit,
    listCommitHistory,
    getUnpublishedDiff,
    getPublishSummary,
    getGitCapabilityState,
    getWorkspaceGitStatus,
    setWorkspaceGitIdentity,
    syncWorkspaceChanges,
    getAutoSyncStatus,
    syncIncomingChanges,
    getSyncState,
    resolveSyncConflict,
    connectRemoteRepository,
    chooseCloneDestination,
    cloneRemoteRepository,
    watchDocument,
    listAssistantThreads,
    createAssistantThread,
    getAssistantThread,
    sendAssistantMessage,
    cancelAssistantRun,
    renameAssistantThread,
    deleteAssistantThread,
    onDocumentChanged,
    onWorkspaceChanged,
    onAssistantEvent,
  };
}
