import { watchFile, unwatchFile } from "node:fs";
import type { Stats } from "node:fs";
import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import type { BaseWindow, IpcMainInvokeEvent, WebContents } from "electron";
import path from "node:path";
import { MOHIO_CHANNELS } from "@shared/mohio-api";
import type { AssistantEvent, DocumentChangedEvent, WorkspaceSummary } from "@shared/mohio-types";
import { createAssistantRuntime } from "./assistant";
import { createGitCollaborationService } from "./git-collaboration";
import {
  createDocument,
  deleteDocument,
  readDocument,
  resolveWorkspacePath,
  saveDocument,
} from "./document-store";
import { buildAppMenuTemplate } from "./menu";
import { getWorkspaceSummary } from "./workspace";

let currentWorkspacePath: string | null = null;
const assistantRuntime = createAssistantRuntime();
const gitCollaboration = createGitCollaborationService();
const activeDocumentWatches = new Map<number, {
  absolutePath: string;
  listener: (currentStats: Stats, previousStats: Stats) => void;
  relativePath: string;
}>();

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

function broadcastAssistantEvent(event: AssistantEvent) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(MOHIO_CHANNELS.assistantEvent, event);
  }
}

async function broadcastDocumentChange({
  relativePath,
  webContents,
}: {
  relativePath: string;
  webContents: WebContents;
}) {
  if (webContents.isDestroyed()) {
    unwatchDocumentForContents(webContents.id);
    return;
  }

  const workspace = await loadCurrentWorkspace().catch(() => null);
  const document = currentWorkspacePath
    ? await readDocument(currentWorkspacePath, relativePath).catch(() => null)
    : null;
  const payload: DocumentChangedEvent = {
    relativePath,
    document,
    workspace,
  };

  if (!webContents.isDestroyed()) {
    webContents.send(MOHIO_CHANNELS.documentChanged, payload);
  }
}

function unwatchDocumentForContents(contentsId: number) {
  const activeWatch = activeDocumentWatches.get(contentsId);

  if (!activeWatch) {
    return;
  }

  unwatchFile(activeWatch.absolutePath, activeWatch.listener);
  activeDocumentWatches.delete(contentsId);
}

function clearDocumentWatches() {
  for (const contentsId of activeDocumentWatches.keys()) {
    unwatchDocumentForContents(contentsId);
  }
}

function watchDocumentForEventSender(
  event: IpcMainInvokeEvent,
  relativePath: string | null,
) {
  unwatchDocumentForContents(event.sender.id);

  if (!relativePath || !currentWorkspacePath || event.sender.isDestroyed()) {
    return;
  }

  const absolutePath = resolveWorkspacePath(currentWorkspacePath, relativePath);
  const listener = (currentStats: Stats, previousStats: Stats) => {
    if (
      currentStats.mtimeMs === previousStats.mtimeMs &&
      currentStats.size === previousStats.size
    ) {
      return;
    }

    void broadcastDocumentChange({
      relativePath,
      webContents: event.sender,
    });
  };

  watchFile(absolutePath, { interval: 500 }, listener);
  activeDocumentWatches.set(event.sender.id, {
    absolutePath,
    listener,
    relativePath,
  });
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
  clearDocumentWatches();

  const workspace = await loadCurrentWorkspace();
  broadcastWorkspaceChange(workspace);
  if (currentWorkspacePath) {
    void gitCollaboration.syncIncomingChanges(currentWorkspacePath, "workspace-open").catch(() => undefined);
  }

  return workspace;
}

function registerMohioHandlers() {
  ipcMain.handle(MOHIO_CHANNELS.getCurrentWorkspace, () => loadCurrentWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.openWorkspace, (_event) => openWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.readDocument, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading documents.");
    }

    void gitCollaboration.syncIncomingChanges(currentWorkspacePath, "document-open").catch(() => undefined);
    return readDocument(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.createDocument, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before creating documents.");
    }

    return createDocument(currentWorkspacePath, input);
  });
  ipcMain.handle(MOHIO_CHANNELS.deleteDocument, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before deleting documents.");
    }

    return deleteDocument(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.saveDocument, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before saving documents.");
    }

    return saveDocument(currentWorkspacePath, input);
  });
  ipcMain.handle(MOHIO_CHANNELS.createCheckpoint, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before creating a checkpoint.");
    }

    return gitCollaboration.createCheckpoint(currentWorkspacePath, input);
  });
  ipcMain.handle(
    MOHIO_CHANNELS.createAiChangeCheckpoint,
    async (_event, relativePath: string, reason: string) => {
      if (!currentWorkspacePath) {
        throw new Error("Open a workspace before creating a checkpoint.");
      }

      return gitCollaboration.createAiChangeCheckpoint(currentWorkspacePath, relativePath, reason);
    },
  );
  ipcMain.handle(MOHIO_CHANNELS.listCheckpoints, async (_event, relativePath: string | null) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading history.");
    }

    return gitCollaboration.listCheckpoints(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.listCommitHistory, async (_event, relativePath: string | null) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading history.");
    }

    return gitCollaboration.listCommitHistory(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.getUnpublishedDiff, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading history.");
    }

    return gitCollaboration.getUnpublishedDiff(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.getCheckpointDiff, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading history.");
    }

    return gitCollaboration.getCheckpointDiff(currentWorkspacePath, input);
  });
  ipcMain.handle(MOHIO_CHANNELS.revertToCheckpoint, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before reverting history.");
    }

    await gitCollaboration.revertToCheckpoint(currentWorkspacePath, input);
    const workspace = await loadCurrentWorkspace();
    broadcastWorkspaceChange(workspace);
  });
  ipcMain.handle(MOHIO_CHANNELS.getPublishSummary, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading publish state.");
    }

    const workspace = await loadCurrentWorkspace();

    if (!workspace) {
      throw new Error("Open a workspace before loading publish state.");
    }

    return gitCollaboration.getPublishSummary(currentWorkspacePath, workspace.documents);
  });
  ipcMain.handle(MOHIO_CHANNELS.publishWorkspaceChanges, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before publishing.");
    }

    const result = await gitCollaboration.publishWorkspaceChanges(currentWorkspacePath);
    const workspace = await loadCurrentWorkspace();
    broadcastWorkspaceChange(workspace);
    return result;
  });
  ipcMain.handle(MOHIO_CHANNELS.syncIncomingChanges, async (_event, reason: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before syncing changes.");
    }

    const state = await gitCollaboration.syncIncomingChanges(currentWorkspacePath, reason);
    const workspace = await loadCurrentWorkspace().catch(() => null);
    broadcastWorkspaceChange(workspace);
    return state;
  });
  ipcMain.handle(MOHIO_CHANNELS.getSyncState, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before loading sync state.");
    }

    return gitCollaboration.getSyncState(currentWorkspacePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.resolveSyncConflict, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before resolving conflicts.");
    }

    const state = await gitCollaboration.resolveSyncConflict(currentWorkspacePath, input);
    const workspace = await loadCurrentWorkspace().catch(() => null);
    broadcastWorkspaceChange(workspace);
    return state;
  });
  ipcMain.handle(MOHIO_CHANNELS.watchDocument, async (event, relativePath: string | null) => {
    watchDocumentForEventSender(event, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.listAssistantThreads, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before starting an assistant conversation.");
    }

    return assistantRuntime.listThreads({
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.createAssistantThread, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before starting an assistant conversation.");
    }

    return assistantRuntime.createThread({
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.getAssistantThread, async (_event, threadId: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before starting an assistant conversation.");
    }

    return assistantRuntime.getThread({
      threadId,
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.sendAssistantMessage, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before starting an assistant conversation.");
    }

    const workspace = await loadCurrentWorkspace();

    if (!workspace) {
      throw new Error("Open a workspace before starting an assistant conversation.");
    }

    return assistantRuntime.sendMessage({
      workspacePath: currentWorkspacePath,
      workspaceName: workspace.name,
      ...input,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.cancelAssistantRun, async (_event, threadId: string) => {
    if (!currentWorkspacePath) {
      return;
    }

    await assistantRuntime.cancelRun({
      threadId,
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.renameAssistantThread, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before renaming an assistant conversation.");
    }

    await assistantRuntime.renameThread({
      threadId: input.threadId,
      title: input.title,
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.deleteAssistantThread, async (_event, threadId: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a workspace before deleting an assistant conversation.");
    }

    await assistantRuntime.deleteThread({
      threadId,
      workspacePath: currentWorkspacePath,
    });
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
  assistantRuntime.onEvent((event) => {
    broadcastAssistantEvent(event);
  });
  registerMohioHandlers();
  registerApplicationMenu();
  const mainWindow = createMainWindow();

  mainWindow.webContents.on("destroyed", () => {
    unwatchDocumentForContents(mainWindow.webContents.id);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const nextWindow = createMainWindow();
      nextWindow.webContents.on("destroyed", () => {
        unwatchDocumentForContents(nextWindow.webContents.id);
      });
    }
  });
});

app.on("window-all-closed", () => {
  clearDocumentWatches();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
