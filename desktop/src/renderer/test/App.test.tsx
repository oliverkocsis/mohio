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
    syncWorkspaceChanges: async () => ({
      committed: false,
      commitSha: null,
      syncedAt: null,
      message: "No changes",
    }),
    getAutoSyncStatus: async () => ({
      enabled: true,
      hasUncommittedChanges: false,
      lastSyncedAt: null,
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

    expect(screen.getByTestId("top-bar")).toBeInTheDocument();
    expect(screen.getByLabelText("Collapse left panel")).toBeInTheDocument();
    expect(screen.getByLabelText("Collapse right panel")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Documents" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Search" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Assistant" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Versions" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Documents" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Search" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Assistant" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Versions" })).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("tab", { name: "Unpublished" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
    expect(screen.queryByLabelText("Search workspace")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Related" })).not.toBeInTheDocument();
    expect(await screen.findByTestId("document-state-primary-empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Folder" })).toBeInTheDocument();
  });

  it("collapses and reopens left and right panels from top bar controls", async () => {
    window.mohio = createMohioMock();

    render(<App />);

    await screen.findByTestId("document-state-primary-empty");

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
    });
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      syncWorkspaceChanges,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: true,
        lastSyncedAt: new Date().toISOString(),
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    });

    expect(syncWorkspaceChanges).toHaveBeenCalledTimes(1);
  });

  it("keeps Sync disabled when no uncommitted changes are present", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getAutoSyncStatus: async () => ({
        enabled: true,
        hasUncommittedChanges: false,
        lastSyncedAt: new Date().toISOString(),
      }),
    });

    render(<App />);

    await screen.findByTestId("workspace-sidebar");

    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
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
