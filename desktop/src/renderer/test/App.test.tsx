import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type {
  AssistantEvent,
  AssistantThread,
  AssistantThreadSummary,
  DocumentChangedEvent,
  MohioApi,
  WorkspaceSummary,
} from "@shared/mohio-types";
import App from "@renderer/App";

function createAssistantThread(
  threadId: string,
  overrides: Partial<AssistantThread> = {},
): AssistantThread {
  return {
    id: threadId,
    workspacePath: "/workspaces/alpha",
    title: "New Chat",
    preview: "",
    messages: [],
    status: "idle",
    errorMessage: null,
    ...overrides,
  };
}

function createAssistantThreadSummary(
  threadId: string,
  overrides: Partial<AssistantThreadSummary> = {},
): AssistantThreadSummary {
  return {
    id: threadId,
    title: "New Chat",
    preview: "",
    createdAt: "2026-03-23T00:00:00.000Z",
    updatedAt: "2026-03-23T00:00:00.000Z",
    status: "idle",
    ...overrides,
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
    readDocument: async () => {
      throw new Error("No document");
    },
    saveDocument: async () => {
      throw new Error("No document");
    },
    watchDocument: async () => undefined,
    listAssistantThreads: async () => [],
    createAssistantThread: async () => createAssistantThread("thread-1"),
    getAssistantThread: async (threadId) => createAssistantThread(threadId),
    sendAssistantMessage: async (input) => createAssistantThread(input.threadId, {
      messages: [
        {
          id: "user-1",
          role: "user",
          content: input.content,
          createdAt: "2026-03-22T00:00:00.000Z",
        },
      ],
      status: "running",
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
  it("renders the empty workspace shell", async () => {
    window.mohio = createMohioMock();

    render(<App />);

    const topBar = screen.getByTestId("top-bar");

    expect(topBar).toBeInTheDocument();
    expect(screen.getByTestId("workspace-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-sidebar")).toBeInTheDocument();
    expect(within(topBar).getByRole("button", { name: "Select workspace" })).toHaveTextContent("Open Workspace");
    expect(within(topBar).getByLabelText("Search workspace")).toBeInTheDocument();
    expect(await screen.findByTestId("document-state")).toHaveTextContent("Choose a folder to open your Mohio workspace.");
    expect(screen.getByText("No workspace is open.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Note" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Heading 1" })).not.toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.getByText("Open a workspace to chat with the assistant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Chat" })).toBeDisabled();
    expect(screen.queryByText("Codex chat")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Open a workspace to start chatting with Codex inside Mohio."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Summarize this note" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Assistant composer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the workspace tree, switches workspaces, and loads note assistant state", async () => {
    let onDocumentChangedListener: ((event: DocumentChangedEvent) => void) | null = null;
    let onAssistantEventListener: ((event: AssistantEvent) => void) | null = null;
    const getCurrentWorkspace = vi.fn().mockResolvedValue({
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
              displayTitle: "Architecture Overview",
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
        {
          id: "ROADMAP.md",
          kind: "document" as const,
          name: "ROADMAP.md",
          relativePath: "ROADMAP.md",
          displayTitle: "ROADMAP",
        },
      ],
    } satisfies WorkspaceSummary);
    const openWorkspace = vi.fn().mockResolvedValue({
      name: "beta",
      path: "/workspaces/beta",
      documentCount: 1,
      documents: [
        {
          id: "Team Handbook.md",
          kind: "document" as const,
          name: "Team Handbook.md",
          relativePath: "Team Handbook.md",
          displayTitle: "Team Handbook",
        },
      ],
    } satisfies WorkspaceSummary);
    const readDocument = vi.fn()
      .mockResolvedValueOnce({
        relativePath: "docs/Architecture.md",
        fileName: "Architecture.md",
        displayTitle: "Architecture Overview",
        markdown: "Current body.\n",
      })
      .mockResolvedValueOnce({
        relativePath: "Team Handbook.md",
        fileName: "Team Handbook.md",
        displayTitle: "Team Handbook",
        markdown: "Beta body.\n",
      });
    const listAssistantThreads = vi.fn()
      .mockResolvedValueOnce([
        createAssistantThreadSummary("thread-alpha", {
          preview: "Architecture follow-up",
          title: "Architecture follow-up",
        }),
      ])
      .mockResolvedValueOnce([
        createAssistantThreadSummary("thread-beta", {
          preview: "Beta workspace summary",
          title: "Beta workspace summary",
        }),
      ])
      .mockResolvedValue([
        createAssistantThreadSummary("thread-beta", {
          preview: "Beta workspace summary",
          title: "Beta workspace summary",
        }),
      ]);
    const getAssistantThread = vi.fn().mockImplementation(async (threadId: string) => {
      if (threadId === "thread-beta") {
        return createAssistantThread("thread-beta", {
          title: "Beta workspace summary",
          preview: "Beta workspace summary",
          workspacePath: "/workspaces/beta",
          messages: [
            {
              id: "assistant-1",
              role: "assistant",
              content: "Beta workspace summary.",
              createdAt: "2026-03-22T00:00:00.000Z",
            },
          ],
        });
      }

      return createAssistantThread(threadId, {
        title: "Architecture follow-up",
        preview: "Architecture follow-up",
      });
    });

    window.mohio = createMohioMock({
      getCurrentWorkspace,
      openWorkspace,
      readDocument,
      listAssistantThreads,
      getAssistantThread,
      onDocumentChanged: (listener) => {
        onDocumentChangedListener = listener;
        return () => {
          onDocumentChangedListener = null;
        };
      },
      onAssistantEvent: (listener) => {
        onAssistantEventListener = listener;
        return () => {
          onAssistantEventListener = null;
        };
      },
    });

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Switch workspace from alpha" }),
    ).toHaveTextContent("alpha");
    const docsFolderToggle = screen.getByRole("button", { name: "docs" });
    expect(docsFolderToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Architecture Overview" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByLabelText("Document title")).toHaveValue("Architecture Overview");
    expect(screen.getByRole("button", { name: "New Note" })).toBeDisabled();
    expect(screen.queryByText("alpha · docs/Architecture.md")).not.toBeInTheDocument();
    expect(listAssistantThreads).toHaveBeenCalledTimes(1);
    expect(getAssistantThread).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Architecture follow-up/ })).toBeInTheDocument();

    fireEvent.click(docsFolderToggle);
    expect(docsFolderToggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(docsFolderToggle);
    expect(docsFolderToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("button", { name: "Switch workspace from alpha" }));

    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Switch workspace from beta" }),
    ).toHaveTextContent("beta");
    expect(screen.getByRole("button", { name: "Team Handbook" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByLabelText("Document title")).toHaveValue("Team Handbook");
    expect(screen.queryByText("beta · Team Handbook.md")).not.toBeInTheDocument();
    expect(listAssistantThreads).toHaveBeenCalledTimes(2);
    expect(getAssistantThread).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Beta workspace summary/ })).toBeInTheDocument();

    expect(onDocumentChangedListener).not.toBeNull();
    expect(onAssistantEventListener).not.toBeNull();

    await act(async () => {
      onDocumentChangedListener?.({
        relativePath: "Team Handbook.md",
        document: {
          relativePath: "Team Handbook.md",
          fileName: "Team Handbook.md",
          displayTitle: "Team Handbook Updated",
          markdown: "Externally changed body.\n",
        },
        workspace: {
          name: "beta",
          path: "/workspaces/beta",
          documentCount: 1,
          documents: [
            {
              id: "Team Handbook.md",
              kind: "document",
              name: "Team Handbook.md",
              relativePath: "Team Handbook.md",
              displayTitle: "Team Handbook Updated",
            },
          ],
        },
      });
    });

    expect(await screen.findByLabelText("Document title")).toHaveValue("Team Handbook Updated");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Beta workspace summary/ }));
    });

    expect(getAssistantThread).toHaveBeenCalledWith("thread-beta");
    expect(await screen.findByText("Beta workspace summary.")).toBeInTheDocument();

    await act(async () => {
      onAssistantEventListener?.({
        type: "thread",
        workspacePath: "/workspaces/beta",
        thread: createAssistantThread("thread-beta", {
          title: "Beta workspace summary",
          preview: "Beta workspace summary",
          workspacePath: "/workspaces/beta",
          messages: [
            {
              id: "assistant-2",
              role: "assistant",
              content: "Updated assistant context.",
              createdAt: "2026-03-22T00:01:00.000Z",
            },
          ],
        }),
      });
    });

    expect(screen.getByText("Updated assistant context.")).toBeInTheDocument();
  });

  it("keeps newer local edits when a file-watch event arrives for Mohio's own older save", async () => {
    try {
      let onDocumentChangedListener: ((event: DocumentChangedEvent) => void) | null = null;
      let resolveSaveDocument: ((value: {
        relativePath: string;
        fileName: string;
        displayTitle: string;
        markdown: string;
        savedAt: string;
      }) => void) | null = null;
      const saveDocument = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSaveDocument = resolve;
          }),
      );

      window.mohio = createMohioMock({
        getCurrentWorkspace: async () => ({
          name: "alpha",
          path: "/workspaces/alpha",
          documentCount: 1,
          documents: [
            {
              id: "Team Handbook.md",
              kind: "document",
              name: "Team Handbook.md",
              relativePath: "Team Handbook.md",
              displayTitle: "Team Handbook",
            },
          ],
        }),
        readDocument: async () => ({
          relativePath: "Team Handbook.md",
          fileName: "Team Handbook.md",
          displayTitle: "Team Handbook",
          markdown: "Initial body.\n",
        }),
        saveDocument,
        onDocumentChanged: (listener) => {
          onDocumentChangedListener = listener;
          return () => {
            onDocumentChangedListener = null;
          };
        },
      });

      render(<App />);

      const titleInput = await screen.findByLabelText("Document title");
      expect(titleInput).toHaveValue("Team Handbook");

      vi.useFakeTimers();

      fireEvent.change(titleInput, { target: { value: "Team Handbook A" } });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(saveDocument).toHaveBeenCalledWith({
        relativePath: "Team Handbook.md",
        title: "Team Handbook A",
        markdown: "Initial body.\n",
      });

      fireEvent.change(titleInput, { target: { value: "Team Handbook AB" } });

      await act(async () => {
        onDocumentChangedListener?.({
          relativePath: "Team Handbook.md",
          document: {
            relativePath: "Team Handbook.md",
            fileName: "Team Handbook.md",
            displayTitle: "Team Handbook A",
            markdown: "Initial body.\n",
          },
          workspace: {
            name: "alpha",
            path: "/workspaces/alpha",
            documentCount: 1,
            documents: [
              {
                id: "Team Handbook.md",
                kind: "document",
                name: "Team Handbook.md",
                relativePath: "Team Handbook.md",
                displayTitle: "Team Handbook A",
              },
            ],
          },
        });
      });

      expect(screen.getByLabelText("Document title")).toHaveValue("Team Handbook AB");

      await act(async () => {
        resolveSaveDocument?.({
          relativePath: "Team Handbook.md",
          fileName: "Team Handbook.md",
          displayTitle: "Team Handbook A",
          markdown: "Initial body.\n",
          savedAt: "2026-03-21T00:00:00.000Z",
        });
      });
    } finally {
      vi.useRealTimers();
    }
  }, 10000);

  it("uses a list-first assistant flow with Codex chat actions", async () => {
    let onAssistantEventListener: ((event: AssistantEvent) => void) | null = null;
    const renameAssistantThread = vi.fn().mockResolvedValue(undefined);
    const deleteAssistantThread = vi.fn().mockResolvedValue(undefined);
    const createAssistantThreadMock = vi.fn().mockResolvedValue(
      createAssistantThread("thread-new", {
        title: "New Chat",
        preview: "",
      }),
    );
    const listAssistantThreads = vi.fn().mockResolvedValue([
      createAssistantThreadSummary("thread-architecture", {
        preview: "Architecture follow-up",
        title: "Architecture follow-up",
      }),
      createAssistantThreadSummary("thread-readme", {
        preview: "README research",
        title: "README research",
      }),
    ]);
    const sendAssistantMessage = vi.fn().mockImplementation(async (input) =>
      createAssistantThread(input.threadId, {
        preview: "Architecture follow-up",
        title: input.threadId === "thread-new" ? "New Chat" : "Architecture follow-up",
        messages: [
          {
            id: "user-1",
            role: "user",
            content: input.content,
            createdAt: "2026-03-22T00:00:00.000Z",
          },
          {
            id: "assistant-1",
            role: "assistant",
            content: "",
            createdAt: "2026-03-22T00:00:00.000Z",
          },
        ],
        status: "running",
      }),
    );
    const getAssistantThread = vi.fn().mockImplementation(async (threadId) => {
      if (threadId === "thread-readme") {
        return createAssistantThread("thread-readme", {
          preview: "README research",
          title: "README research",
          messages: [
            {
              id: "assistant-2",
              role: "assistant",
              content: "README history context.",
              createdAt: "2026-03-22T00:00:00.000Z",
            },
          ],
        });
      }

      if (threadId === "thread-new") {
        return createAssistantThread("thread-new", {
          title: "New Chat",
        });
      }

      return createAssistantThread("thread-architecture", {
        preview: "Architecture follow-up",
        title: "Architecture follow-up",
        messages: [
          {
            id: "assistant-architecture",
            role: "assistant",
            content: "Architecture thread context.",
            createdAt: "2026-03-22T00:00:00.000Z",
          },
        ],
      });
    });

    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => ({
        name: "alpha",
        path: "/workspaces/alpha",
        documentCount: 2,
        documents: [
          {
            id: "docs/Architecture.md",
            kind: "document",
            name: "Architecture.md",
            relativePath: "docs/Architecture.md",
            displayTitle: "Architecture Overview",
          },
          {
            id: "README.md",
            kind: "document",
            name: "README.md",
            relativePath: "README.md",
            displayTitle: "README",
          },
        ],
      }),
      readDocument: vi.fn().mockResolvedValue({
        relativePath: "docs/Architecture.md",
        fileName: "Architecture.md",
        displayTitle: "Architecture Overview",
        markdown: "Current body.\n",
      }),
      listAssistantThreads,
      createAssistantThread: createAssistantThreadMock,
      getAssistantThread,
      sendAssistantMessage,
      cancelAssistantRun: vi.fn().mockResolvedValue(undefined),
      renameAssistantThread,
      deleteAssistantThread,
      onAssistantEvent: (listener) => {
        onAssistantEventListener = listener;
        return () => {
          onAssistantEventListener = null;
        };
      },
    });

    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Renamed README chat");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    try {
      render(<App />);

      expect(await screen.findByLabelText("Document title")).toHaveValue("Architecture Overview");
      expect(getAssistantThread).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "New Chat" })).toBeEnabled();
      expect(screen.getByRole("button", { name: /Architecture follow-up/ })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Architecture follow-up/ }));
      });

      expect(getAssistantThread).toHaveBeenCalledWith("thread-architecture");
      expect(await screen.findByText("Architecture thread context.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back to chats" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Architecture follow-up" })).toBeInTheDocument();

      await act(async () => {
        fireEvent.change(screen.getByTestId("assistant-composer-input"), {
          target: { value: "What changed here?" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Send" }));
      });

      expect(sendAssistantMessage).toHaveBeenCalledWith({
        threadId: "thread-architecture",
        noteRelativePath: "docs/Architecture.md",
        content: "What changed here?",
        documentTitle: "Architecture Overview",
        documentMarkdown: "Current body.\n",
      });
      expect(await screen.findByText("What changed here?")).toBeInTheDocument();
      expect(screen.getByText("Thinking...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Summarize this note" })).toBeDisabled();

      await act(async () => {
        onAssistantEventListener?.({
          type: "thread",
          workspacePath: "/workspaces/alpha",
          thread: createAssistantThread("thread-architecture", {
            preview: "Architecture follow-up",
            title: "Architecture follow-up",
            messages: [
              {
                id: "user-1",
                role: "user",
                content: "What changed here?",
                createdAt: "2026-03-22T00:00:00.000Z",
              },
              {
                id: "assistant-1",
                role: "assistant",
                content: "Here is the streamed answer.",
                createdAt: "2026-03-22T00:00:00.000Z",
              },
            ],
            status: "running",
          }),
        });
      });

      expect(screen.getByText("Here is the streamed answer.")).toBeInTheDocument();
      expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();

      await act(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      });

      expect(screen.getByText("Here is the streamed answer.")).toBeInTheDocument();
      expect(screen.getByText("Thinking...")).toBeInTheDocument();

      await act(async () => {
        onAssistantEventListener?.({
          type: "thread",
          workspacePath: "/workspaces/alpha",
          thread: createAssistantThread("thread-architecture", {
            preview: "Architecture follow-up",
            title: "Architecture follow-up",
            messages: [
              {
                id: "user-1",
                role: "user",
                content: "What changed here?",
                createdAt: "2026-03-22T00:00:00.000Z",
              },
              {
                id: "assistant-1",
                role: "assistant",
                content: "Here is the streamed answer. It stays visible.",
                createdAt: "2026-03-22T00:00:00.000Z",
              },
            ],
            status: "idle",
          }),
        });
      });

      expect(screen.getByText("Here is the streamed answer. It stays visible.")).toBeInTheDocument();
      expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Back to chats" }));
      });

      expect(screen.queryByText("Here is the streamed answer. It stays visible.")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /README research/ })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /README research/ }));
      });

      expect(getAssistantThread).toHaveBeenLastCalledWith("thread-readme");
      expect(await screen.findByText("README history context.")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Chat options" }));
      expect(screen.getByRole("button", { name: "Chat options" })).toHaveAttribute("aria-expanded", "true");

      await act(async () => {
        fireEvent.click(screen.getByRole("menuitem", { name: "Rename Chat" }));
      });

      expect(renameAssistantThread).toHaveBeenCalledWith({
        threadId: "thread-readme",
        title: "Renamed README chat",
      });
      expect(await screen.findByRole("heading", { name: "Renamed README chat" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Chat options" }));
      expect(screen.getByRole("button", { name: "Chat options" })).toHaveAttribute("aria-expanded", "true");

      await act(async () => {
        fireEvent.click(screen.getByRole("menuitem", { name: "New Chat" }));
      });

      expect(createAssistantThreadMock).toHaveBeenCalledTimes(1);
      expect(await screen.findByRole("heading", { name: "New Chat" })).toBeInTheDocument();

      await act(async () => {
        onAssistantEventListener?.({
          type: "thread-list",
          workspacePath: "/workspaces/alpha",
          threads: [
            createAssistantThreadSummary("thread-architecture", {
              preview: "Architecture follow-up",
              title: "Architecture follow-up",
            }),
            createAssistantThreadSummary("thread-readme", {
              preview: "README research",
              title: "README research",
            }),
          ],
        });
      });

      expect(screen.getByRole("heading", { name: "New Chat" })).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Summarize this note" }));
      });

      expect(sendAssistantMessage).toHaveBeenLastCalledWith({
        threadId: "thread-new",
        noteRelativePath: "docs/Architecture.md",
        content: "Summarize this note",
        documentTitle: "Architecture Overview",
        documentMarkdown: "Current body.\n",
      });

      fireEvent.click(screen.getByRole("button", { name: "Chat options" }));
      expect(screen.getByRole("button", { name: "Chat options" })).toHaveAttribute("aria-expanded", "true");

      await act(async () => {
        fireEvent.click(screen.getByRole("menuitem", { name: "Delete Chat" }));
      });

      expect(deleteAssistantThread).toHaveBeenCalledWith("thread-new");
      expect(screen.getByRole("button", { name: /Architecture follow-up/ })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "New Chat" })).not.toBeInTheDocument();
    } finally {
      promptSpy.mockRestore();
      confirmSpy.mockRestore();
    }
  });

  it("auto-starts a new chat when sending from the list footer", async () => {
    const createAssistantThreadMock = vi.fn()
      .mockResolvedValueOnce(createAssistantThread("thread-action", { title: "New Chat" }))
      .mockResolvedValueOnce(createAssistantThread("thread-compose", { title: "New Chat" }));
    const sendAssistantMessage = vi.fn().mockImplementation(async (input) =>
      createAssistantThread(input.threadId, {
        title: "New Chat",
        preview: input.content,
        status: "running",
        messages: [
          {
            id: "user-1",
            role: "user",
            content: input.content,
            createdAt: "2026-03-22T00:00:00.000Z",
          },
          {
            id: "assistant-1",
            role: "assistant",
            content: "",
            createdAt: "2026-03-22T00:00:00.000Z",
          },
        ],
      }),
    );

    window.mohio = createMohioMock({
      getCurrentWorkspace: async () => ({
        name: "alpha",
        path: "/workspaces/alpha",
        documentCount: 1,
        documents: [
          {
            id: "docs/Architecture.md",
            kind: "document",
            name: "Architecture.md",
            relativePath: "docs/Architecture.md",
            displayTitle: "Architecture Overview",
          },
        ],
      }),
      readDocument: vi.fn().mockResolvedValue({
        relativePath: "docs/Architecture.md",
        fileName: "Architecture.md",
        displayTitle: "Architecture Overview",
        markdown: "Current body.\n",
      }),
      listAssistantThreads: vi.fn().mockResolvedValue([
        createAssistantThreadSummary("thread-history", {
          title: "History chat",
          preview: "Earlier thread",
        }),
      ]),
      createAssistantThread: createAssistantThreadMock,
      sendAssistantMessage,
    });

    render(<App />);

    expect(await screen.findByLabelText("Document title")).toHaveValue("Architecture Overview");
    expect(screen.getByRole("button", { name: "Summarize this note" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Summarize this note" }));
    });

    expect(createAssistantThreadMock).toHaveBeenCalledTimes(1);
    expect(sendAssistantMessage).toHaveBeenCalledWith({
      threadId: "thread-action",
      noteRelativePath: "docs/Architecture.md",
      content: "Summarize this note",
      documentTitle: "Architecture Overview",
      documentMarkdown: "Current body.\n",
    });
    expect(await screen.findByRole("heading", { name: "New Chat" })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Back to chats" }));
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId("assistant-composer-input"), {
        target: { value: "Draft a short summary." },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    expect(createAssistantThreadMock).toHaveBeenCalledTimes(2);
    expect(sendAssistantMessage).toHaveBeenLastCalledWith({
      threadId: "thread-compose",
      noteRelativePath: "docs/Architecture.md",
      content: "Draft a short summary.",
      documentTitle: "Architecture Overview",
      documentMarkdown: "Current body.\n",
    });
    expect(await screen.findByRole("heading", { name: "New Chat" })).toBeInTheDocument();
  });
});
