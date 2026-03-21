import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "@renderer/App";

describe("App", () => {
  it("renders the empty workspace shell", async () => {
    window.mohio = {
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
      onWorkspaceChanged: () => () => undefined,
    };

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
    expect(screen.queryByRole("button", { name: "Open folder" })).not.toBeInTheDocument();
    expect(screen.queryByText("Documents")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Heading 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Heading styles" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Heading 3" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bold" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Underline" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Italic" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Text styles" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bulleted list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Numbered list" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Text alignment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Alignment options" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Align center" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Align right" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Justify" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Table" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear formatting" })).not.toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.queryByText("Ready for guided document work")).not.toBeInTheDocument();
    expect(screen.queryByText("Suggested actions")).not.toBeInTheDocument();
    expect(screen.getByText("Summarize note")).toBeInTheDocument();
    expect(screen.getByText("Discover related notes")).toBeInTheDocument();
    expect(screen.getByText("Resolve conflicting notes")).toBeInTheDocument();
    expect(within(topBar).queryByText("Open a workspace")).toBeInTheDocument();
    expect(within(topBar).queryByRole("button", { name: "New note" })).not.toBeInTheDocument();
    expect(within(topBar).queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });

  it("renders the workspace tree and switches workspaces through the shared API", async () => {
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
    });

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
    });
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
    const saveDocument = vi.fn().mockResolvedValue({
      relativePath: "docs/Architecture.md",
      fileName: "Architecture.md",
      displayTitle: "Architecture Overview",
      markdown: "Current body.\n",
      savedAt: "2026-03-21T00:00:00.000Z",
    });

    window.mohio = {
      getAppInfo: () => ({
        name: "Mohio",
        version: "0.1.0",
        platform: "darwin",
      }),
      getCurrentWorkspace,
      openWorkspace,
      readDocument,
      saveDocument,
      onWorkspaceChanged: () => () => undefined,
    };

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Switch workspace from alpha" }),
    ).toHaveTextContent("alpha");
    const docsFolderToggle = screen.getByRole("button", { name: "docs" });
    expect(screen.queryByText("/workspaces/alpha")).not.toBeInTheDocument();
    expect(docsFolderToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Architecture Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "README" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ROADMAP" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Document title")).toHaveValue("Architecture Overview");
    expect(screen.getByTestId("save-state")).toHaveTextContent("Saved");
    expect(screen.queryByText("docs/Architecture.md")).not.toBeInTheDocument();

    fireEvent.click(docsFolderToggle);

    expect(docsFolderToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Architecture Overview" })).not.toBeInTheDocument();

    fireEvent.click(docsFolderToggle);

    expect(docsFolderToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Architecture Overview" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Switch workspace from alpha" }));

    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Switch workspace from beta" }),
    ).toHaveTextContent("beta");
    expect(screen.queryByText("/workspaces/beta")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Team Handbook" })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByLabelText("Document title")).toHaveValue("Team Handbook");
    expect(screen.queryByText("Team Handbook.md")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Strikethrough" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Horizontal rule" })).toBeInTheDocument();
    expect(saveDocument).not.toHaveBeenCalled();
  });
});
