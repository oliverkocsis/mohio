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

export interface WorkspaceDocument {
  relativePath: string;
  fileName: string;
  displayTitle: string;
  markdown: string;
  frontmatterTitle?: string;
}

export interface SaveDocumentInput {
  relativePath: string;
  title: string;
  markdown: string;
}

export interface SaveDocumentResult {
  relativePath: string;
  fileName: string;
  displayTitle: string;
  markdown: string;
  savedAt: string;
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
  readDocument: (relativePath: string) => Promise<WorkspaceDocument>;
  saveDocument: (input: SaveDocumentInput) => Promise<SaveDocumentResult>;
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
