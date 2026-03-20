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
});

contextBridge.exposeInMainWorld("mohio", mohioApi);
