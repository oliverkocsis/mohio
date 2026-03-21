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
});

contextBridge.exposeInMainWorld("mohio", mohioApi);
