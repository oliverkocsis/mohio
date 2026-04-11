import { watchFile, unwatchFile } from "node:fs";
import type { Stats } from "node:fs";
import { access } from "node:fs/promises";
import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import type { BaseWindow, IpcMainInvokeEvent, WebContents } from "electron";
import path from "node:path";
import { MOHIO_CHANNELS } from "@shared/mohio-api";
import type {
  AssistantEvent,
  ConnectRemoteRepositoryResult,
  DocumentChangedEvent,
  RecentWorkspaceSummary,
  WorkspaceSummary,
} from "@shared/mohio-types";
import { createAssistantRuntime } from "./assistant";
import { createGitCollaborationService } from "./git-collaboration";
import {
  createDocument,
  deleteDocument,
  readDocument,
  resolveWorkspacePath,
  saveDocument,
} from "./document-store";
import {
  addOrReplaceOriginRemote,
  cloneRemoteRepository,
  isRemoteRepositoryEmpty,
} from "./git-runtime";
import { buildAppMenuTemplate } from "./menu";
import { createRecentWorkspaceStore } from "./recent-workspaces";
import {
  getWorkspaceSummary,
  searchWorkspace,
} from "./workspace";

let currentWorkspacePath: string | null = null;
const assistantRuntime = createAssistantRuntime();
const gitCollaboration = createGitCollaborationService();
let recentWorkspaceStore: ReturnType<typeof createRecentWorkspaceStore> | null = null;
const activeDocumentWatches = new Map<number, {
  absolutePath: string;
  listener: (currentStats: Stats, previousStats: Stats) => void;
  relativePath: string;
}>();

function getRecentWorkspaceStore() {
  if (!recentWorkspaceStore) {
    recentWorkspaceStore = createRecentWorkspaceStore({
      maxEntries: 5,
      storageFilePath: path.join(app.getPath("userData"), "recent-workspaces.json"),
    });
  }

  return recentWorkspaceStore;
}

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
    buttonLabel: "Open Folder",
    properties: ["openDirectory"],
    title: "Open Mohio Workspace",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return loadCurrentWorkspace();
  }

  return switchWorkspace(result.filePaths[0]);
}

async function switchWorkspace(nextWorkspacePath: string) {
  currentWorkspacePath = nextWorkspacePath;
  clearDocumentWatches();

  const workspace = await loadCurrentWorkspace();
  void getRecentWorkspaceStore().rememberWorkspacePath(nextWorkspacePath).catch(() => undefined);
  broadcastWorkspaceChange(workspace);
  if (currentWorkspacePath) {
    void gitCollaboration.bootstrapWorkspace(currentWorkspacePath).catch(() => undefined);
    void gitCollaboration.syncIncomingChanges(currentWorkspacePath, "workspace-open").catch(() => undefined);
  }

  return workspace;
}

async function openWorkspacePath(nextWorkspacePath: string) {
  const trimmedPath = nextWorkspacePath.trim();
  if (!trimmedPath) {
    throw new Error("Enter a workspace folder path.");
  }

  if (!(await pathExists(trimmedPath))) {
    throw new Error("Folder not found.");
  }

  return switchWorkspace(trimmedPath);
}

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function listRecentWorkspaces(): Promise<RecentWorkspaceSummary[]> {
  const recentWorkspacePaths = await getRecentWorkspaceStore().listRecentWorkspacePaths();

  return Promise.all(
    recentWorkspacePaths.map(async (workspacePath) => {
      const folderName = path.basename(workspacePath);
      return {
        exists: await pathExists(workspacePath),
        name: folderName || workspacePath,
        path: workspacePath,
      };
    }),
  );
}

async function chooseCloneDestination(browserWindow?: BaseWindow): Promise<string | null> {
  const parentWindow = browserWindow ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(parentWindow, {
    buttonLabel: "Choose Folder",
    properties: ["openDirectory", "createDirectory"],
    title: "Choose Clone Destination",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0] ?? null;
}

function getRepositoryNameFromRemoteUrl(remoteUrl: string): string {
  const trimmed = remoteUrl.trim().replace(/\/+$/u, "");
  const withoutGitSuffix = trimmed.endsWith(".git")
    ? trimmed.slice(0, -4)
    : trimmed;
  const segment = withoutGitSuffix.split("/").at(-1)?.trim() ?? "";
  return segment || "workspace";
}

function registerMohioHandlers() {
  ipcMain.handle(MOHIO_CHANNELS.getCurrentWorkspace, () => loadCurrentWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.openWorkspace, (_event) => openWorkspace());
  ipcMain.handle(MOHIO_CHANNELS.openWorkspacePath, (_event, workspacePath: string) => openWorkspacePath(workspacePath));
  ipcMain.handle(MOHIO_CHANNELS.listRecentWorkspaces, () => listRecentWorkspaces());
  ipcMain.handle(MOHIO_CHANNELS.searchWorkspace, async (_event, query: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before searching.");
    }

    return searchWorkspace(currentWorkspacePath, query);
  });
  ipcMain.handle(MOHIO_CHANNELS.readDocument, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before loading documents.");
    }

    void gitCollaboration.syncIncomingChanges(currentWorkspacePath, "document-open").catch(() => undefined);
    return readDocument(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.createDocument, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before creating documents.");
    }

    return createDocument(currentWorkspacePath, input);
  });
  ipcMain.handle(MOHIO_CHANNELS.deleteDocument, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before deleting documents.");
    }

    return deleteDocument(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.saveDocument, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before saving documents.");
    }

    return saveDocument(currentWorkspacePath, input);
  });
  ipcMain.handle(MOHIO_CHANNELS.recordRiskyCommit, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before recording a commit.");
    }

    try {
      return await gitCollaboration.recordRiskyCommit(currentWorkspacePath, input);
    } catch {
      return false;
    }
  });
  ipcMain.handle(MOHIO_CHANNELS.recordAutoSaveCommit, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before recording a commit.");
    }

    try {
      return await gitCollaboration.recordAutoSaveCommit(currentWorkspacePath);
    } catch {
      return false;
    }
  });
  ipcMain.handle(MOHIO_CHANNELS.listCommitHistory, async (_event, relativePath: string | null) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before loading history.");
    }

    return gitCollaboration.listCommitHistory(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.getUnpublishedDiff, async (_event, relativePath: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before loading history.");
    }

    return gitCollaboration.getUnpublishedDiff(currentWorkspacePath, relativePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.getPublishSummary, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before loading publish state.");
    }

    const workspace = await loadCurrentWorkspace();

    if (!workspace) {
      throw new Error("Open a folder before loading publish state.");
    }

    return gitCollaboration.getPublishSummary(currentWorkspacePath, workspace.documents);
  });
  ipcMain.handle(MOHIO_CHANNELS.getGitCapabilityState, async () => {
    return gitCollaboration.getGitCapability();
  });
  ipcMain.handle(MOHIO_CHANNELS.getWorkspaceGitStatus, async () => {
    if (!currentWorkspacePath) {
      const capability = await gitCollaboration.getGitCapability();
      return {
        gitAvailable: capability.gitAvailable,
        isRepository: false,
        remoteConnected: false,
        remoteName: null,
        remoteUrl: null,
        identityConfigured: false,
        userName: null,
        userEmail: null,
        requiresIdentitySetup: false,
      };
    }

    return gitCollaboration.getWorkspaceStatus(currentWorkspacePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.setWorkspaceGitIdentity, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before setting workspace identity.");
    }

    return gitCollaboration.setWorkspaceIdentity(currentWorkspacePath, input);
  });
  ipcMain.handle(MOHIO_CHANNELS.connectRemoteRepository, async (_event, input): Promise<ConnectRemoteRepositoryResult> => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before connecting a repository.");
    }

    const status = await gitCollaboration.getWorkspaceStatus(currentWorkspacePath);
    if (!status.gitAvailable) {
      return {
        message: "Install Git before connecting a remote repository.",
        remoteConnected: false,
        requiresCloneForNonEmptyRemote: false,
      };
    }

    if (status.requiresIdentitySetup) {
      return {
        message: "Set a workspace Git identity before connecting a repository.",
        remoteConnected: false,
        requiresCloneForNonEmptyRemote: false,
      };
    }

    const remoteUrl = (input?.remoteUrl ?? "").trim();
    if (!remoteUrl) {
      return {
        message: "Enter a remote Git URL first.",
        remoteConnected: false,
        requiresCloneForNonEmptyRemote: false,
      };
    }

    const isEmptyRemote = await isRemoteRepositoryEmpty(remoteUrl);
    if (!isEmptyRemote) {
      return {
        message: "This remote already has commits. Use Open Remote Repository to clone it first.",
        remoteConnected: false,
        requiresCloneForNonEmptyRemote: true,
      };
    }

    await addOrReplaceOriginRemote({
      workspacePath: currentWorkspacePath,
      remoteUrl,
    });

    const workspace = await loadCurrentWorkspace().catch(() => null);
    broadcastWorkspaceChange(workspace);
    return {
      message: "Remote repository connected. Use Sync now to publish snapshots.",
      remoteConnected: true,
      requiresCloneForNonEmptyRemote: false,
    };
  });
  ipcMain.handle(MOHIO_CHANNELS.chooseCloneDestination, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    return chooseCloneDestination(parentWindow ?? undefined);
  });
  ipcMain.handle(MOHIO_CHANNELS.cloneRemoteRepository, async (_event, input) => {
    const remoteUrl = (input?.remoteUrl ?? "").trim();
    if (!remoteUrl) {
      throw new Error("Enter a remote Git URL before cloning.");
    }

    const localPath = await cloneRemoteRepository({
      cloneUrl: remoteUrl,
      parentDirectory: input.parentDirectory,
      repositoryName: getRepositoryNameFromRemoteUrl(remoteUrl),
    });

    return switchWorkspace(localPath);
  });
  ipcMain.handle(MOHIO_CHANNELS.syncWorkspaceChanges, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before syncing.");
    }

    const result = await gitCollaboration.syncWorkspaceChanges(currentWorkspacePath);
    const workspace = await loadCurrentWorkspace();
    broadcastWorkspaceChange(workspace);
    return result;
  });
  ipcMain.handle(MOHIO_CHANNELS.getAutoSyncStatus, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before loading sync status.");
    }

    return gitCollaboration.getAutoSyncStatus(currentWorkspacePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.syncIncomingChanges, async (_event, reason: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before syncing changes.");
    }

    const state = await gitCollaboration.syncIncomingChanges(currentWorkspacePath, reason);
    const workspace = await loadCurrentWorkspace().catch(() => null);
    broadcastWorkspaceChange(workspace);
    return state;
  });
  ipcMain.handle(MOHIO_CHANNELS.getSyncState, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before loading sync state.");
    }

    return gitCollaboration.getSyncState(currentWorkspacePath);
  });
  ipcMain.handle(MOHIO_CHANNELS.resolveSyncConflict, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before resolving conflicts.");
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
      throw new Error("Open a folder before starting an assistant conversation.");
    }

    return assistantRuntime.listThreads({
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.createAssistantThread, async () => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before starting an assistant conversation.");
    }

    return assistantRuntime.createThread({
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.getAssistantThread, async (_event, threadId: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before starting an assistant conversation.");
    }

    return assistantRuntime.getThread({
      threadId,
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.sendAssistantMessage, async (_event, input) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before starting an assistant conversation.");
    }

    const workspace = await loadCurrentWorkspace();

    if (!workspace) {
      throw new Error("Open a folder before starting an assistant conversation.");
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
      throw new Error("Open a folder before renaming an assistant conversation.");
    }

    await assistantRuntime.renameThread({
      threadId: input.threadId,
      title: input.title,
      workspacePath: currentWorkspacePath,
    });
  });
  ipcMain.handle(MOHIO_CHANNELS.deleteAssistantThread, async (_event, threadId: string) => {
    if (!currentWorkspacePath) {
      throw new Error("Open a folder before deleting an assistant conversation.");
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
