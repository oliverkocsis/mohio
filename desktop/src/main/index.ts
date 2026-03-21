import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import type { BaseWindow } from "electron";
import path from "node:path";
import { MOHIO_CHANNELS } from "@shared/mohio-api";
import type { WorkspaceSummary } from "@shared/mohio-types";
import { readDocument, saveDocument } from "./document-store";
import { buildAppMenuTemplate } from "./menu";
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

function broadcastWorkspaceChange(workspace: WorkspaceSummary | null) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(MOHIO_CHANNELS.workspaceChanged, workspace);
  }
}

async function openWorkspace(browserWindow?: BaseWindow) {
  const parentWindow = browserWindow ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(parentWindow, {
    buttonLabel: "Open Workspace",
    properties: ["openDirectory"],
    title: "Open Mohio Workspace",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return loadCurrentWorkspace();
  }

  currentWorkspacePath = result.filePaths[0];

  const workspace = await loadCurrentWorkspace();
  broadcastWorkspaceChange(workspace);

  return workspace;
}

function registerMohioHandlers() {
  ipcMain.handle(MOHIO_CHANNELS.getCurrentWorkspace, () => loadCurrentWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.openWorkspace, (_event) => openWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.readDocument, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading documents.");
    }

    return readDocument(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.saveDocument, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before saving documents.");
    }

    return saveDocument(currentWorkspacePath, input);
  });
}

function registerApplicationMenu() {
  const template = buildAppMenuTemplate({
    appName: app.name,
    isMac: process.platform === "darwin",
    onOpenWorkspace: openWorkspace,
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  app.setName("Mohio");
  registerMohioHandlers();
  registerApplicationMenu();
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
