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
  saveDocument: (input) => ipcRenderer.invoke(MOHIO_CHANNELS.saveDocument, input),
  watchDocument: (relativePath) => ipcRenderer.invoke(MOHIO_CHANNELS.watchDocument, relativePath),
  getAssistantThread: (noteRelativePath) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.getAssistantThread, noteRelativePath),
  sendAssistantMessage: (input) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.sendAssistantMessage, input),
  cancelAssistantRun: (noteRelativePath) =>
    ipcRenderer.invoke(MOHIO_CHANNELS.cancelAssistantRun, noteRelativePath),
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
