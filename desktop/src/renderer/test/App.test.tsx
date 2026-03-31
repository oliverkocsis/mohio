import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
    getRelatedDocuments: async () => [],
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
    publishWorkspaceChanges: async () => ({
      committed: false,
      commitSha: null,
      publishedAt: null,
      message: "No changes",
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
    expect(screen.getByLabelText("Search workspace")).toBeInTheDocument();
    expect(await screen.findByTestId("document-state-primary-empty")).toBeInTheDocument();
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

  it("uses current-tab on single-click and opens a new tab on double-click", async () => {
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

    expect(screen.getByRole("tab", { name: /Architecture/i })).toBeInTheDocument();

    const planButton = screen.getByRole("button", { name: "Plan" });

    await act(async () => {
      fireEvent.click(planButton);
    });

    expect(screen.queryByRole("tab", { name: /Architecture/i })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Plan/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.doubleClick(architectureButton);
    });

    expect(screen.getByRole("tab", { name: /Plan/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Architecture/i })).toBeInTheDocument();
  });

  it("renders document tabs above the editor toolbar", async () => {
    const workspace = createWorkspace();
    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
    });

    render(<App />);

    const pane = await screen.findByTestId("document-state-primary");
    const tablist = within(pane).getByRole("tablist", { name: "Open document tabs" });
    const toolbar = within(pane).getByRole("button", { name: "Heading 1" }).closest(".editor-toolbar");

    expect(tablist).toBeInTheDocument();
    expect(toolbar).toBeInTheDocument();
    expect(tablist.compareDocumentPosition(toolbar as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
      fireEvent.change(screen.getByLabelText("Search workspace"), {
        target: { value: "roadmap" },
      });
    });

    const result = await screen.findByRole("button", { name: "Plan" });

    await act(async () => {
      fireEvent.click(result);
    });

    expect(searchWorkspace).toHaveBeenCalledWith("roadmap");
    expect(screen.getByRole("tab", { name: /Plan/i })).toBeInTheDocument();
  });

  it("loads related notes in the right sidebar related tab", async () => {
    const workspace = createWorkspace();
    const getRelatedDocuments = vi.fn().mockResolvedValue([
      {
        relativePath: "docs/Plan.md",
        displayTitle: "Plan",
        relationTypes: ["backlink", "recent"],
        score: 200,
      },
    ]);

    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => workspace,
      getRelatedDocuments,
    });

    render(<App />);

    await screen.findByTestId("assistant-sidebar");

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: "Related" }));
    });

    const relatedPanel = await screen.findByTestId("related-panel");
    expect(relatedPanel).toBeInTheDocument();
    expect(within(relatedPanel).getByRole("button", { name: /Plan/ })).toBeInTheDocument();
    expect(getRelatedDocuments).toHaveBeenCalled();
  });
});
