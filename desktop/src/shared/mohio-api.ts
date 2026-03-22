import type {
  AssistantEvent,
  AssistantThread,
  AppInfo,
  DocumentChangedEvent,
  MohioApi,
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
  getAssistantThread: "mohio:assistant:get-thread",
  sendAssistantMessage: "mohio:assistant:send-message",
  cancelAssistantRun: "mohio:assistant:cancel-run",
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
  getAssistantThread: (noteRelativePath: string) => Promise<AssistantThread>;
  sendAssistantMessage: (input: SendAssistantMessageInput) => Promise<AssistantThread>;
  cancelAssistantRun: (noteRelativePath: string) => Promise<void>;
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
  getAssistantThread,
  sendAssistantMessage,
  cancelAssistantRun,
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
    getAssistantThread,
    sendAssistantMessage,
    cancelAssistantRun,
    onDocumentChanged,
    onWorkspaceChanged,
    onAssistantEvent,
  };
}
