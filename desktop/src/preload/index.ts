import { contextBridge, ipcRenderer } from "electron";
import packageJson from "../../package.json";
import { MOHIO_CHANNELS, createMohioApi } from "@shared/mohio-api";

const mohioApi = createMohioApi({
  appInfo: {
    name: "Mohio",
    version: packageJson.version,
    platform: process.platform,
  },
  getCurrentWorkspace: () => ipcRenderer.invoke(MOHIO_CHANNELS.getCurrentWorkspace),
  openWorkspace: () => ipcRenderer.invoke(MOHIO_CHANNELS.openWorkspace),
  readDocument: (relativePath) => ipcRenderer.invoke(MOHIO_CHANNELS.readDocument, relativePath),
  createDocument: (input) => ipcRenderer.invoke(MOHIO_CHANNELS.createDocument, input),
  deleteDocument: (relativePath) => ipcRenderer.invoke(MOHIO_CHANNELS.deleteDocument, relativePath),
  saveDocument: (input) => ipcRenderer.invoke(MOHIO_CHANNELS.saveDocument, input),
  recordRiskyCommit: (input) => ipcRenderer.invoke(MOHIO_CHANNELS.recordRiskyCommit, input),
  recordAutoSaveCommit: () => ipcRenderer.invoke(MOHIO_CHANNELS.recordAutoSaveCommit),
  listCommitHistory: (relativePath) => ipcRenderer.invoke(MOHIO_CHANNELS.listCommitHistory, relativePath),
  getUnpublishedDiff: (relativePath) => ipcRenderer.invoke(MOHIO_CHANNELS.getUnpublishedDiff, relativePath),
  getPublishSummary: () => ipcRenderer.invoke(MOHIO_CHANNELS.getPublishSummary),
  publishWorkspaceChanges: () => ipcRenderer.invoke(MOHIO_CHANNELS.publishWorkspaceChanges),
  syncIncomingChanges: (reason) => ipcRenderer.invoke(MOHIO_CHANNELS.syncIncomingChanges, reason),
  getSyncState: () => ipcRenderer.invoke(MOHIO_CHANNELS.getSyncState),
  resolveSyncConflict: (input) => ipcRenderer.invoke(MOHIO_CHANNELS.resolveSyncConflict, input),
  watchDocument: (relativePath) => ipcRenderer.invoke(MOHIO_CHANNELS.watchDocument, relativePath),
  listAssistantThreads: () =>
    ipcRenderer.invoke(MOHIO_CHANNELS.listAssistantThreads),
  createAssistantThread: () =>
    ipcRenderer.invoke(MOHIO_CHANNELS.createAssistantThread),
  getAssistantThread: (threadId) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.getAssistantThread, threadId),
  sendAssistantMessage: (input) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.sendAssistantMessage, input),
  cancelAssistantRun: (threadId) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.cancelAssistantRun, threadId),
  renameAssistantThread: (input) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.renameAssistantThread, input),
  deleteAssistantThread: (threadId) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.deleteAssistantThread, threadId),
  onDocumentChanged: (listener) => {
    const handleDocumentChanged = (
      _event: Electron.IpcRendererEvent,
      documentChangedEvent: Awaited<ReturnType<typeof ipcRenderer.invoke>>,
    ) => {
      listener(documentChangedEvent);
    };

    ipcRenderer.on(MOHIO_CHANNELS.documentChanged, handleDocumentChanged);

    return () => {
      ipcRenderer.removeListener(MOHIO_CHANNELS.documentChanged, handleDocumentChanged);
    };
  },
  onWorkspaceChanged: (listener) => {
    const handleWorkspaceChanged = (
      _event: Electron.IpcRendererEvent,
      workspace: Awaited<ReturnType<typeof ipcRenderer.invoke>>,
    ) => {
      listener(workspace);
    };

    ipcRenderer.on(MOHIO_CHANNELS.workspaceChanged, handleWorkspaceChanged);

    return () => {
      ipcRenderer.removeListener(MOHIO_CHANNELS.workspaceChanged, handleWorkspaceChanged);
    };
  },
  onAssistantEvent: (listener) => {
    const handleAssistantEvent = (
      _event: Electron.IpcRendererEvent,
      assistantEvent: Awaited<ReturnType<typeof ipcRenderer.invoke>>,
    ) => {
      listener(assistantEvent);
    };

    ipcRenderer.on(MOHIO_CHANNELS.assistantEvent, handleAssistantEvent);

    return () => {
      ipcRenderer.removeListener(MOHIO_CHANNELS.assistantEvent, handleAssistantEvent);
    };
  },
});

contextBridge.exposeInMainWorld("mohio", mohioApi);
