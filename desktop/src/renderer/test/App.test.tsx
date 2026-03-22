import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type {
  AssistantEvent,
  AssistantThread,
  DocumentChangedEvent,
  MohioApi,
  WorkspaceSummary,
} from "@shared/mohio-types";
import App from "@renderer/App";

function createAssistantThread(
  noteRelativePath: string,
  overrides: Partial<AssistantThread> = {},
): AssistantThread {
  return {
    noteRelativePath,
    messages: [],
    status: "idle",
    errorMessage: null,
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
    getAssistantThread: async (noteRelativePath) => createAssistantThread(noteRelativePath),
    sendAssistantMessage: async (input) => createAssistantThread(input.noteRelativePath, {
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
    expect(within(topBar).getByRole("button", { name: "Select workspace" })).toHaveTextContent("Open a workspace");
    expect(within(topBar).getByLabelText("Search workspace")).toBeInTheDocument();
    expect(await screen.findByTestId("document-state")).toHaveTextContent("Choose a folder to open your Mohio workspace.");
    expect(screen.getByText("No workspace is open.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose folder" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Heading 1" })).not.toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.getByText("Open a workspace note to chat with Codex")).toBeInTheDocument();
    expect(screen.queryByText("Codex chat")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Open a workspace to start chatting with Codex inside Mohio."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Summarize this note" })).toBeDisabled();
    expect(screen.getByLabelText("Assistant composer")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
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
    const getAssistantThread = vi.fn().mockImplementation(async (noteRelativePath: string) => {
      if (noteRelativePath === "Team Handbook.md") {
        return createAssistantThread("Team Handbook.md", {
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

      return createAssistantThread(noteRelativePath);
    });

    window.mohio = createMohioMock({
      getCurrentWorkspace,
      openWorkspace,
      readDocument,
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
    expect(screen.queryByText("alpha · docs/Architecture.md")).not.toBeInTheDocument();
    expect(getAssistantThread).toHaveBeenCalledWith("docs/Architecture.md");

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
    expect(screen.getByText("Beta workspace summary.")).toBeInTheDocument();

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
      onAssistantEventListener?.({
        workspacePath: "/workspaces/beta",
        noteRelativePath: "Team Handbook.md",
        thread: createAssistantThread("Team Handbook.md", {
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

  it("sends assistant messages, streams updates, and keeps note conversations separate", async () => {
    let onAssistantEventListener: ((event: AssistantEvent) => void) | null = null;
    const sendAssistantMessage = vi.fn().mockImplementation(async (input) =>
      createAssistantThread(input.noteRelativePath, {
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
    const getAssistantThread = vi.fn().mockImplementation(async (noteRelativePath) =>
      createAssistantThread(noteRelativePath),
    );

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
      readDocument: vi.fn()
        .mockResolvedValueOnce({
          relativePath: "docs/Architecture.md",
          fileName: "Architecture.md",
          displayTitle: "Architecture Overview",
          markdown: "Current body.\n",
        })
        .mockResolvedValueOnce({
          relativePath: "README.md",
          fileName: "README.md",
          displayTitle: "README",
          markdown: "Readme body.\n",
        }),
      getAssistantThread,
      sendAssistantMessage,
      cancelAssistantRun: vi.fn().mockResolvedValue(undefined),
      onAssistantEvent: (listener) => {
        onAssistantEventListener = listener;
        return () => {
          onAssistantEventListener = null;
        };
      },
    });

    render(<App />);

    expect(await screen.findByLabelText("Document title")).toHaveValue("Architecture Overview");

    await act(async () => {
      fireEvent.change(screen.getByTestId("assistant-composer-input"), {
        target: { value: "What changed here?" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    expect(sendAssistantMessage).toHaveBeenCalledWith({
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
        workspacePath: "/workspaces/alpha",
        noteRelativePath: "docs/Architecture.md",
        thread: createAssistantThread("docs/Architecture.md", {
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
          status: "idle",
        }),
      });
    });

    expect(screen.getByText("Here is the streamed answer.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "README" }));
    });
    expect(await screen.findByLabelText("Document title")).toHaveValue("README");
    expect(getAssistantThread).toHaveBeenLastCalledWith("README.md");
    expect(screen.queryByText("Here is the streamed answer.")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Summarize this note" }));
    });
    expect(sendAssistantMessage).toHaveBeenLastCalledWith({
      noteRelativePath: "README.md",
      content: "Summarize this note",
      documentTitle: "README",
      documentMarkdown: "Readme body.\n",
    });
  });
});
