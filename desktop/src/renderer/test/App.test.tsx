import { act, fireEvent, render, screen } from "@testing-library/react";
import type {
  MohioApi,
  WorkspaceSummary,
} from "@shared/mohio-types";
import App from "@renderer/App";

function createWorkspace(): WorkspaceSummary {
  return {
    name: "alpha",
    path: "/workspaces/alpha",
    documentCount: 3,
    documents: [
      {
        id: "docs",
        kind: "directory" as const,
        name: "docs",
        relativePath: "docs",
        children: [
          {
            id: "docs/Architecture.md",
            kind: "document" as const,
            name: "Architecture.md",
            relativePath: "docs/Architecture.md",
            displayTitle: "Architecture",
          },
          {
            id: "docs/Plan.md",
            kind: "document" as const,
            name: "Plan.md",
            relativePath: "docs/Plan.md",
            displayTitle: "Plan",
          },
        ],
      },
      {
        id: "README.md",
        kind: "document" as const,
        name: "README.md",
        relativePath: "README.md",
        displayTitle: "README",
      },
    ],
  };
}

function createMohioMock(overrides: Partial<MohioApi> = {}): MohioApi {
  return {
    getAppInfo: () => ({
      name: "Mohio",
      version: "0.1.0",
      platform: "darwin",
    }),
    getCurrentWorkspace: async () => null,
    openWorkspace: async () => null,
    openWorkspacePath: async () => createWorkspace(),
    listRecentWorkspaces: async () => [],
    searchWorkspace: async () => [],
    readDocument: async (relativePath) => ({
      relativePath,
      fileName: relativePath.split("/").at(-1) ?? relativePath,
      displayTitle: relativePath.includes("Architecture")
        ? "Architecture"
        : relativePath.includes("Plan")
          ? "Plan"
          : "README",
      markdown: relativePath.includes("Architecture")
        ? "See [Plan](docs/Plan.md)."
        : "Body.\n",
      titleMode: "h1-linked",
    }),
    createDocument: async () => ({
      relativePath: "Untitled.md",
      fileName: "Untitled.md",
      displayTitle: "Untitled",
      markdown: "",
      titleMode: "h1-linked",
    }),
    deleteDocument: async () => undefined,
    saveDocument: async (input) => ({
      relativePath: input.relativePath,
      fileName: input.relativePath.split("/").at(-1) ?? input.relativePath,
      displayTitle: input.title,
      markdown: input.markdown,
      titleMode: input.titleMode,
      savedAt: new Date().toISOString(),
    }),
    recordRiskyCommit: async () => false,
    recordAutoSaveCommit: async () => false,
    listCommitHistory: async () => [],
    getUnpublishedDiff: async (relativePath) => ({
      relativePath,
      hasRemoteVersion: true,
      patch: "",
      message: null,
    }),
    getPublishSummary: async () => ({
      documents: [],
      unpublishedCount: 0,
      unpublishedTree: [],
    }),
    getGitCapabilityState: async () => ({
      gitAvailable: true,
      gitVersion: "git version 2.47.0",
      installHint: null,
    }),
    getWorkspaceGitStatus: async () => ({
      gitAvailable: true,
      isRepository: true,
      remoteConnected: false,
      remoteName: null,
      remoteUrl: null,
      identityConfigured: true,
      userName: "Mohio Test",
      userEmail: "mohio@example.com",
      requiresIdentitySetup: false,
    }),
    setWorkspaceGitIdentity: async () => ({
      gitAvailable: true,
      isRepository: true,
      remoteConnected: false,
      remoteName: null,
      remoteUrl: null,
      identityConfigured: true,
      userName: "Mohio Test",
      userEmail: "mohio@example.com",
      requiresIdentitySetup: false,
    }),
    syncWorkspaceChanges: async () => ({
      committed: false,
      commitSha: null,
      syncedAt: null,
      message: "No changes",
      remoteConnected: false,
      requiresRemoteConnect: false,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    }),
    getAutoSyncStatus: async () => ({
      enabled: true,
      hasUncommittedChanges: false,
      lastSyncedAt: null,
      remoteConnected: false,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    }),
    syncIncomingChanges: async () => ({
      status: "idle",
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    }),
    getSyncState: async () => ({
      status: "idle",
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    }),
    resolveSyncConflict: async () => ({
      status: "idle",
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    }),
    connectRemoteRepository: async () => ({
      message: "Connected.",
      remoteConnected: true,
      requiresCloneForNonEmptyRemote: false,
    }),
    chooseCloneDestination: async () => "/tmp",
    cloneRemoteRepository: async () => createWorkspace(),
    watchDocument: async () => undefined,
    listAssistantThreads: async () => [],
    createAssistantThread: async () => ({
      id: "thread-1",
      workspacePath: "/workspaces/alpha",
      title: "New Chat",
      preview: "",
      messages: [],
      status: "idle",
      errorMessage: null,
    }),
    getAssistantThread: async () => ({
      id: "thread-1",
      workspacePath: "/workspaces/alpha",
      title: "New Chat",
      preview: "",
      messages: [],
      status: "idle",
      errorMessage: null,
    }),
    sendAssistantMessage: async () => ({
      id: "thread-1",
      workspacePath: "/workspaces/alpha",
      title: "New Chat",
      preview: "",
      messages: [],
      status: "running",
      errorMessage: null,
    }),
    cancelAssistantRun: async () => undefined,
    renameAssistantThread: async () => undefined,
    deleteAssistantThread: async () => undefined,
    onDocumentChanged: () => () => undefined,
    onWorkspaceChanged: () => () => undefined,
    onAssistantEvent: () => () => undefined,
    ...overrides,
  };
}

describe("App", () => {
  it("renders the empty workspace shell with panel toggles", async () => {
    window.mohio = createMohioMock();

    render(<App />);

    expect(screen.queryByTestId("top-bar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse left panel")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse right panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspace-sidebar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("assistant-sidebar")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Unpublished" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quick New Document" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sync now" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search workspace")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Related" })).not.toBeInTheDocument();
    expect(await screen.findByTestId("workspace-entry")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome to Mohio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open a folder as workspace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect to a remote workspace" })).toBeInTheDocument();
  });

  it("collapses and reopens left and right panels from top bar controls", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Collapse left panel"));
    });

    expect(screen.queryByTestId("workspace-sidebar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Open left panel")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Collapse right panel"));
    });

    expect(screen.queryByTestId("assistant-sidebar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Open right panel")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Open left panel"));
      fireEvent.click(screen.getByLabelText("Open right panel"));
    });

    expect(screen.getByTestId("workspace-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-sidebar")).toBeInTheDocument();
  });

  it("opens the clicked document in the single editor surface", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    const architectureButton = await screen.findByRole("button", { name: "Architecture" });

    await act(async () => {
      fireEvent.click(architectureButton);
    });

    expect(await screen.findByDisplayValue("Architecture")).toBeInTheDocument();

    const planButton = screen.getByRole("button", { name: "Plan" });

    await act(async () => {
      fireEvent.click(planButton);
    });

    expect(await screen.findByDisplayValue("Plan")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Architecture")).not.toBeInTheDocument();
  });

  it("does not render tab-strip or split-view controls in the main editor", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
    });

    render(<App />);

    await screen.findByTestId("document-state-primary");

    expect(screen.queryByRole("tablist", { name: "Open document tabs" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/split view/i)).not.toBeInTheDocument();
  });

  it("uses unified search results to open matching documents", async () => {
    const workspace = createWorkspace();
    const searchWorkspace = vi.fn().mockResolvedValue([
      {
        relativePath: "docs/Plan.md",
        displayTitle: "Plan",
        matchType: "content",
        snippet: "...Roadmap steps...",
      },
    ]);
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      searchWorkspace,
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Search" }));
    });

    const searchInput = await screen.findByLabelText("Search documents");

    await act(async () => {
      fireEvent.change(searchInput, {
        target: { value: "roadmap" },
      });
    });

    const result = await screen.findByRole("button", { name: "Plan" });

    await act(async () => {
      fireEvent.click(result);
    });

    expect(searchWorkspace).toHaveBeenCalledWith("roadmap");
    expect(await screen.findByDisplayValue("Plan")).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(searchInput, {
        target: { value: "" },
      });
    });

    expect(searchInput).toHaveValue("");
  });

  it("renders assistant quick-action pills above the composer and sends quick prompts", async () => {
    const workspace = createWorkspace();
    const sendAssistantMessage = vi.fn().mockResolvedValue({
      id: "thread-1",
      workspacePath: "/workspaces/alpha",
      title: "New Chat",
      preview: "",
      messages: [],
      status: "running",
      errorMessage: null,
    });

    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      sendAssistantMessage,
    });

    render(<App />);

    await screen.findByTestId("assistant-sidebar");

    const quickAction = await screen.findByRole("button", { name: "Summarise document" });
    const composerInput = await screen.findByLabelText("Assistant composer");

    expect(quickAction.compareDocumentPosition(composerInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await act(async () => {
      fireEvent.click(quickAction);
    });

    expect(sendAssistantMessage).toHaveBeenCalledWith(expect.objectContaining({
      content: "Summarise document in concise bullets.",
    }));
  });

  it("shows delete-only actions in the document context menu", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
    });

    render(<App />);

    const architectureButton = await screen.findByRole("button", { name: "Architecture" });

    await act(async () => {
      fireEvent.contextMenu(architectureButton);
    });

    expect(screen.getByRole("menuitem", { name: "Delete Document" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Open in New Tab" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Open in Split View" })).not.toBeInTheDocument();
  });

  it("switches the left panel back to Documents when creating a new document", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Search" }));
    });

    expect(screen.getByRole("tab", { name: "Search" })).toHaveAttribute("aria-selected", "true");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Quick New Document" }));
    });

    expect(screen.getByRole("tab", { name: "Documents" })).toHaveAttribute("aria-selected", "true");
  });

  it("syncs immediately from the top bar Sync control", async () => {
    const workspace = createWorkspace();
    const syncWorkspaceChanges = vi.fn().mockResolvedValue({
      committed: true,
      commitSha: "abc123",
      syncedAt: new Date().toISOString(),
      message: "Synced.",
      remoteConnected: true,
      requiresRemoteConnect: false,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    });
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      syncWorkspaceChanges,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: true,
        lastSyncedAt: new Date().toISOString(),
        remoteConnected: true,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    });

    expect(syncWorkspaceChanges).toHaveBeenCalledTimes(1);
  });

  it("opens connect prompt when Sync requires a remote repository", async () => {
    const workspace = createWorkspace();
    const syncWorkspaceChanges = vi.fn().mockResolvedValue({
      committed: true,
      commitSha: "abc123",
      syncedAt: null,
      message: "Connect a remote repository to sync this workspace.",
      remoteConnected: false,
      requiresRemoteConnect: true,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    });
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getWorkspaceGitStatus: async () => ({
        gitAvailable: true,
        isRepository: true,
        remoteConnected: true,
        remoteName: "origin",
        remoteUrl: "https://git.example.com/example/existing.git",
        identityConfigured: true,
        userName: "Mohio Test",
        userEmail: "mohio@example.com",
        requiresIdentitySetup: false,
      }),
      syncWorkspaceChanges,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: true,
        lastSyncedAt: null,
        remoteConnected: true,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    });

    expect(syncWorkspaceChanges).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("dialog", { name: "Remote repository" })).toBeInTheDocument();
  });

  it("shows connect-remote CTA when workspace has no remote and opens connect dialog on click", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getWorkspaceGitStatus: async () => ({
        gitAvailable: true,
        isRepository: true,
        remoteConnected: false,
        remoteName: null,
        remoteUrl: null,
        identityConfigured: true,
        userName: "Mohio Test",
        userEmail: "mohio@example.com",
        requiresIdentitySetup: false,
      }),
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: false,
        lastSyncedAt: "2026-04-04T11:56:01.000Z",
        remoteConnected: false,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    const syncButton = screen.getByRole("button", { name: "Sync now" });
    expect(screen.getByText("Connect remote repo to share")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(syncButton);
    });

    expect(await screen.findByRole("dialog", { name: "Remote repository" })).toBeInTheDocument();
  });

  it("replaces welcome card with in-place connect form and enables connect only when complete", async () => {
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => null,
      chooseCloneDestination: async () => "/Users/oliver/Documents",
    });

    render(<App />);

    await screen.findByTestId("workspace-entry");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Connect to a remote workspace" }));
    });

    expect(screen.getByRole("heading", { name: "Connect to a workspace" })).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace address")).toBeInTheDocument();
    expect(screen.getByLabelText("Save location")).toBeInTheDocument();

    const connectButton = screen.getByRole("button", { name: "Connect workspace" });
    expect(connectButton).toBeDisabled();
    expect(screen.getByText("The link your team shared. Works with GitHub, GitLab, or any Git address.")).toBeInTheDocument();
    expect(screen.queryByText("/Users/oliver/Documents/workspace")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Workspace address"), {
        target: { value: "github.com/your-team/workspace.git" },
      });
    });
    expect(connectButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Choose" }));
    });

    expect(connectButton).toBeEnabled();
    expect(screen.getByText("/Users/oliver/Documents/workspace")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(screen.getByRole("heading", { name: "Welcome to Mohio" })).toBeInTheDocument();
  });

  it("renders recent workspaces with missing-folder mute state and opens existing entries", async () => {
    const openWorkspacePath = vi.fn().mockResolvedValue(createWorkspace());
    window.mohio = createMohioMock({
      listRecentWorkspaces: async () => [
        {
          name: "alpha",
          path: "/workspaces/alpha",
          exists: true,
        },
        {
          name: "missing-workspace",
          path: "/workspaces/missing-workspace",
          exists: false,
        },
      ],
      openWorkspacePath,
    });

    render(<App />);

    await screen.findByTestId("workspace-entry");

    const existingRecentButton = screen.getByRole("button", { name: "alpha" });
    const missingRecentButton = screen.getByRole("button", { name: "missing-workspace" });

    expect(existingRecentButton).toHaveAttribute("title", "/workspaces/alpha");
    expect(missingRecentButton).toBeDisabled();
    expect(missingRecentButton).toHaveAttribute("title", "Folder not found");

    await act(async () => {
      fireEvent.click(existingRecentButton);
    });

    expect(openWorkspacePath).toHaveBeenCalledWith("/workspaces/alpha");
  });

  it("opens identity popup when Set Git identity warning is clicked", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getWorkspaceGitStatus: async () => ({
        gitAvailable: true,
        isRepository: true,
        remoteConnected: false,
        remoteName: null,
        remoteUrl: null,
        identityConfigured: false,
        userName: null,
        userEmail: null,
        requiresIdentitySetup: true,
      }),
      getAutoSyncStatus: async () => ({
        enabled: false,
        hasUncommittedChanges: false,
        lastSyncedAt: null,
        remoteConnected: false,
        requiresIdentitySetup: true,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByText("Set Git identity"));
    });

    expect(await screen.findByRole("dialog", { name: "Set Git identity" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Workspace Git identity")).not.toBeInTheDocument();
  });

  it("keeps Sync disabled when no uncommitted changes are present", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: false,
        lastSyncedAt: new Date().toISOString(),
        remoteConnected: true,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
  });

  it("shows unsynced changes and enables Sync when editor content is dirty", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: false,
        lastSyncedAt: new Date().toISOString(),
        remoteConnected: true,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");
    const titleInput = await screen.findByDisplayValue("Architecture");

    await act(async () => {
      fireEvent.change(titleInput, {
        target: { value: "Architecture updated" },
      });
    });

    expect(screen.getByText("Changes pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeEnabled();
  });

  it("saves dirty editor content before manual Sync", async () => {
    const workspace = createWorkspace();
    const saveDocument = vi.fn().mockImplementation(async (input) => ({
      relativePath: input.relativePath,
      fileName: input.relativePath.split("/").at(-1) ?? input.relativePath,
      displayTitle: input.title,
      markdown: input.markdown,
      titleMode: input.titleMode,
      savedAt: new Date().toISOString(),
    }));
    const syncWorkspaceChanges = vi.fn().mockResolvedValue({
      committed: true,
      commitSha: "abc123",
      syncedAt: new Date().toISOString(),
      message: "Synced.",
      remoteConnected: true,
      requiresRemoteConnect: false,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    });

    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      saveDocument,
      syncWorkspaceChanges,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: false,
        lastSyncedAt: new Date().toISOString(),
        remoteConnected: true,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");
    const titleInput = await screen.findByDisplayValue("Architecture");

    await act(async () => {
      fireEvent.change(titleInput, {
        target: { value: "Architecture updated" },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    });

    expect(saveDocument).toHaveBeenCalled();
    expect(syncWorkspaceChanges).toHaveBeenCalledTimes(1);

    const saveCallOrder = saveDocument.mock.invocationCallOrder.at(0) ?? 0;
    const syncCallOrder = syncWorkspaceChanges.mock.invocationCallOrder.at(0) ?? 0;
    expect(saveCallOrder).toBeGreaterThan(0);
    expect(syncCallOrder).toBeGreaterThan(0);
    expect(saveCallOrder).toBeLessThan(syncCallOrder);
  });

  it("shows concise synced status with floored relative time", async () => {
    const now = new Date("2026-04-04T12:00:00.000Z").getTime();
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

    try {
      const workspace = createWorkspace();
      window.mohio = createMohioMock({
        getCurrentWorkspace: async () => workspace,
        getAutoSyncStatus: async () => ({
          enabled: true,
          hasUncommittedChanges: false,
          lastSyncedAt: "2026-04-04T11:56:01.000Z",
          remoteConnected: true,
          requiresIdentitySetup: false,
          requiresGitInstall: false,
        }),
      });

      render(<App />);

      await screen.findByTestId("workspace-sidebar");

      expect(screen.getByText("Synced 3 minutes ago")).toBeInTheDocument();
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it("shows offline sync status with last synced time", async () => {
    const now = new Date("2026-04-04T12:00:00.000Z").getTime();
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(now);

    try {
      const workspace = createWorkspace();
      window.mohio = createMohioMock({
        getCurrentWorkspace: async () => workspace,
        getAutoSyncStatus: async () => ({
          enabled: true,
          hasUncommittedChanges: false,
          lastSyncedAt: "2026-04-04T11:56:01.000Z",
          remoteConnected: true,
          requiresIdentitySetup: false,
          requiresGitInstall: false,
        }),
      });

      render(<App />);
      await screen.findByTestId("workspace-sidebar");

      await act(async () => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(screen.getByText("Offline (last synced 3 minutes ago)")).toBeInTheDocument();

      await act(async () => {
        window.dispatchEvent(new Event("online"));
      });
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it("shows simplified snapshot subject and summed line update stats in Versions", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      listCommitHistory: async () => [
        {
          sha: "abc123",
          shortSha: "abc123",
          subject: "Snapshot: 2026-04-04",
          authoredAt: "2026-04-04T19:33:03.000Z",
          authorName: "Mohio Test",
          shortStat: "1 file changed, 1 insertion(+), 1 deletion(-)",
        },
      ],
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Versions" }));
    });

    expect(await screen.findByText("Snapshot")).toBeInTheDocument();
    expect(screen.queryByText("Snapshot: 2026-04-04")).not.toBeInTheDocument();
    expect(screen.getByText(/Mohio Test/)).toBeInTheDocument();
    expect(screen.getByText(/1 file changed/)).toBeInTheDocument();
    expect(screen.queryByText(/lines updated/)).not.toBeInTheDocument();
  });

});
