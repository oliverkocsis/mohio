import type {
  AssistantEvent,
  AssistantThread,
  AssistantThreadSummary,
  AppInfo,
  DocumentChangedEvent,
  MohioApi,
  RenameAssistantThreadInput,
  SendAssistantMessageInput,
  SaveDocumentInput,
  SaveDocumentResult,
  WorkspaceDocument,
  WorkspaceSummary,
} from "./mohio-types";

export const MOHIO_CHANNELS = {
  getCurrentWorkspace: "mohio:workspace:get-current",
  openWorkspace: "mohio:workspace:open",
  readDocument: "mohio:document:read",
  saveDocument: "mohio:document:save",
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

export function createMohioApi({
  appInfo,
  getCurrentWorkspace,
  openWorkspace,
  readDocument,
  saveDocument,
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
    saveDocument,
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
