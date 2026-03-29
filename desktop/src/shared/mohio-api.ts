import type {
  AssistantEvent,
  AssistantThread,
  AssistantThreadSummary,
  CommitHistoryEntry,
  UnpublishedDiffResult,
  RecordRiskyCommitInput,
  AppInfo,
  CreateDocumentInput,
  DocumentChangedEvent,
  MohioApi,
  PublishResult,
  PublishSummary,
  ResolveConflictInput,
  RenameAssistantThreadInput,
  SendAssistantMessageInput,
  SaveDocumentInput,
  SaveDocumentResult,
  SyncState,
  WorkspaceDocument,
  WorkspaceSummary,
} from "./mohio-types";

export const MOHIO_CHANNELS = {
  getCurrentWorkspace: "mohio:workspace:get-current",
  openWorkspace: "mohio:workspace:open",
  readDocument: "mohio:document:read",
  createDocument: "mohio:document:create",
  deleteDocument: "mohio:document:delete",
  saveDocument: "mohio:document:save",
  recordRiskyCommit: "mohio:commit:record-risky",
  recordAutoSaveCommit: "mohio:commit:record-auto-save",
  listCommitHistory: "mohio:history:commits",
  getUnpublishedDiff: "mohio:history:unpublished-diff",
  getPublishSummary: "mohio:publish:summary",
  publishWorkspaceChanges: "mohio:publish:changes",
  syncIncomingChanges: "mohio:sync:incoming",
  getSyncState: "mohio:sync:state",
  resolveSyncConflict: "mohio:sync:resolve-conflict",
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
  readDocument: (relativePath: string) => Promise<WorkspaceDocument>;
  createDocument: (input: CreateDocumentInput) => Promise<WorkspaceDocument>;
  deleteDocument: (relativePath: string) => Promise<void>;
  saveDocument: (input: SaveDocumentInput) => Promise<SaveDocumentResult>;
  recordRiskyCommit: (input: RecordRiskyCommitInput) => Promise<boolean>;
  recordAutoSaveCommit: () => Promise<boolean>;
  listCommitHistory: (relativePath: string | null) => Promise<CommitHistoryEntry[]>;
  getUnpublishedDiff: (relativePath: string) => Promise<UnpublishedDiffResult>;
  getPublishSummary: () => Promise<PublishSummary>;
  publishWorkspaceChanges: () => Promise<PublishResult>;
  syncIncomingChanges: (reason: string) => Promise<SyncState>;
  getSyncState: () => Promise<SyncState>;
  resolveSyncConflict: (input: ResolveConflictInput) => Promise<SyncState>;
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
  readDocument,
  createDocument,
  deleteDocument,
  saveDocument,
  recordRiskyCommit,
  recordAutoSaveCommit,
  listCommitHistory,
  getUnpublishedDiff,
  getPublishSummary,
  publishWorkspaceChanges,
  syncIncomingChanges,
  getSyncState,
  resolveSyncConflict,
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
    readDocument,
    createDocument,
    deleteDocument,
    saveDocument,
    recordRiskyCommit,
    recordAutoSaveCommit,
    listCommitHistory,
    getUnpublishedDiff,
    getPublishSummary,
    publishWorkspaceChanges,
    syncIncomingChanges,
    getSyncState,
    resolveSyncConflict,
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
