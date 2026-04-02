export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

export interface WorkspaceNodeBase {
  id: string;
  name: string;
  relativePath: string;
}

export interface WorkspaceDirectoryNode extends WorkspaceNodeBase {
  kind: "directory";
  children: WorkspaceTreeNode[];
}

export interface WorkspaceDocumentNode extends WorkspaceNodeBase {
  kind: "document";
  displayTitle: string;
}

export type WorkspaceTreeNode = WorkspaceDirectoryNode | WorkspaceDocumentNode;

export interface WorkspaceSummary {
  name: string;
  path: string;
  documents: WorkspaceTreeNode[];
  documentCount: number;
}

export type WorkspaceSearchMatchType = "content" | "path" | "title";

export interface WorkspaceSearchMatch {
  relativePath: string;
  displayTitle: string;
  matchType: WorkspaceSearchMatchType;
  snippet: string | null;
}

export interface WorkspaceDocument {
  relativePath: string;
  fileName: string;
  displayTitle: string;
  markdown: string;
  titleMode: DocumentTitleMode;
  frontmatterTitle?: string;
}

export type DocumentTitleMode = "filename-linked" | "h1-linked";

export interface SaveDocumentInput {
  relativePath: string;
  title: string;
  markdown: string;
  titleMode: DocumentTitleMode;
}

export interface CreateDocumentInput {
  directoryRelativePath: string | null;
}

export interface SaveDocumentResult {
  relativePath: string;
  fileName: string;
  displayTitle: string;
  markdown: string;
  titleMode: DocumentTitleMode;
  savedAt: string;
}

export type DocumentPublishState =
  | "published"
  | "unpublished-changes"
  | "never-published";

export interface DocumentPublishStatus {
  relativePath: string;
  state: DocumentPublishState;
  lastPublishedAt: string | null;
}

export interface PublishSummary {
  documents: DocumentPublishStatus[];
  unpublishedCount: number;
  unpublishedTree: WorkspaceTreeNode[];
}

export type RiskyCommitTrigger =
  | "ai-change"
  | "document-switch"
  | "idle-burst"
  | "publish"
  | "rename-move"
  | "delete"
  | "bulk-edit"
  | "sync-before"
  | "sync-after"
  | "manual"
  | "revert";

export interface RecordRiskyCommitInput {
  trigger: RiskyCommitTrigger;
  force?: boolean;
  relativePath?: string;
}

export interface CommitHistoryEntry {
  sha: string;
  shortSha: string;
  subject: string;
  authoredAt: string;
  shortStat: string | null;
}

export interface UnpublishedDiffResult {
  relativePath: string;
  hasRemoteVersion: boolean;
  patch: string;
  message: string | null;
}

export interface PublishResult {
  committed: boolean;
  commitSha: string | null;
  publishedAt: string | null;
  message: string;
}

export interface SyncConflict {
  relativePath: string;
  localContent: string;
  incomingContent: string;
  baseContent: string | null;
}

export type SyncStatus = "idle" | "checking" | "syncing" | "conflict" | "error";

export interface SyncState {
  status: SyncStatus;
  lastCheckedAt: string | null;
  lastAppliedAt: string | null;
  message: string | null;
  conflicts: SyncConflict[];
}

export interface ResolveConflictInput {
  relativePath: string;
  resolution: "keep-local" | "keep-incoming" | "manual";
  manualContent?: string;
}

export interface DocumentChangedEvent {
  relativePath: string;
  document: WorkspaceDocument | null;
  workspace: WorkspaceSummary | null;
}

export type AssistantMessageRole = "assistant" | "user";
export type AssistantRunStatus = "error" | "idle" | "running";

export interface AssistantMessage {
  id: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
}

export interface AssistantThreadSummary {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  status: AssistantRunStatus;
}

export interface AssistantThread {
  id: string;
  workspacePath: string;
  title: string;
  preview: string;
  messages: AssistantMessage[];
  status: AssistantRunStatus;
  errorMessage: string | null;
}

export type AssistantEvent =
  | {
    type: "thread";
    workspacePath: string;
    thread: AssistantThread;
  }
  | {
    type: "thread-list";
    workspacePath: string;
    threads: AssistantThreadSummary[];
  };

export interface SendAssistantMessageInput {
  threadId: string;
  noteRelativePath: string;
  content: string;
  documentTitle: string;
  documentMarkdown: string;
}

export interface RenameAssistantThreadInput {
  threadId: string;
  title: string;
}

export interface MohioApi {
  getAppInfo: () => AppInfo;
  getCurrentWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspace: () => Promise<WorkspaceSummary | null>;
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
