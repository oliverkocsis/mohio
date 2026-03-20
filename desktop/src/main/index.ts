import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { MOHIO_CHANNELS } from "@shared/mohio-api";
import { getWorkspaceSummary } from "./workspace";

let currentWorkspacePath: string | null = null;

function createMainWindow(): BrowserWindow {
  const appPath = app.getAppPath();
  const preloadPath = path.join(appPath, "dist/preload/index.cjs");
  const rendererPath = path.join(appPath, "dist/renderer/index.html");
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#f3f4f6",
    title: "Mohio",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(rendererPath);
  }

  return mainWindow;
}

async function loadCurrentWorkspace() {
  if (!currentWorkspacePath) {
    return null;
  }

  try {
    return await getWorkspaceSummary(currentWorkspacePath);
  } catch (error) {
    currentWorkspacePath = null;
    throw error;
  }
}

function registerMohioHandlers() {
  ipcMain.handle(MOHIO_CHANNELS.getCurrentWorkspace, () => loadCurrentWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.openWorkspace, async () => {
    const parentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const result = await dialog.showOpenDialog(parentWindow, {
      buttonLabel: "Open Workspace",
      properties: ["openDirectory"],
      title: "Open Mohio Workspace",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return loadCurrentWorkspace();
    }

    currentWorkspacePath = result.filePaths[0];

    return loadCurrentWorkspace();
  });
}

app.whenReady().then(() => {
  app.setName("Mohio");
  registerMohioHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
