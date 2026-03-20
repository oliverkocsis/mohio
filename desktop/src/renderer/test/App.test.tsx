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
    };

    render(<App />);

    const topBar = screen.getByTestId("top-bar");

    expect(topBar).toBeInTheDocument();
    expect(screen.getByTestId("workspace-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-sidebar")).toBeInTheDocument();
    expect(within(topBar).getByRole("button", { name: "Select workspace" })).toHaveTextContent("Open a workspace");
    expect(within(topBar).getByLabelText("Search workspace")).toBeInTheDocument();
    expect(await screen.findByTestId("document-state")).toHaveTextContent("Open a workspace");
    expect(screen.getByText("No workspace selected")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Open folder" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading styles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Underline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text styles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulleted list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Numbered list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Text alignment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alignment options" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Align center" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Align right" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Justify" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Table" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear formatting" })).toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.queryByText("Ready for guided document work")).not.toBeInTheDocument();
    expect(screen.queryByText("Suggested actions")).not.toBeInTheDocument();
    expect(screen.getByText("Summarize note")).toBeInTheDocument();
    expect(screen.getByText("Discover related notes")).toBeInTheDocument();
    expect(screen.getByText("Resolve conflicting notes")).toBeInTheDocument();
    expect(within(topBar).getByRole("button", { name: "New note" })).toHaveClass("primary-button");
    expect(within(topBar).queryByText("Open a workspace")).toBeInTheDocument();
    expect(within(topBar).queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "New note" })).toHaveLength(1);
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
            },
          ],
        },
        {
          id: "README.md",
          kind: "document" as const,
          name: "README.md",
          relativePath: "README.md",
        },
        {
          id: "ROADMAP.md",
          kind: "document" as const,
          name: "ROADMAP.md",
          relativePath: "ROADMAP.md",
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
        },
      ],
    });

    window.mohio = {
      getAppInfo: () => ({
        name: "Mohio",
        version: "0.1.0",
        platform: "darwin",
      }),
      getCurrentWorkspace,
      openWorkspace,
    };

    render(<App />);

    expect(
      await screen.findByRole("button", { name: "Switch workspace from alpha" }),
    ).toHaveTextContent("alpha");
    expect(screen.getByText("/workspaces/alpha")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Architecture" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "README" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ROADMAP" })).toBeInTheDocument();
    expect(screen.getByTestId("document-state")).toHaveTextContent("Architecture");
    expect(screen.getByTestId("document-state")).toHaveTextContent("docs/Architecture.md");

    fireEvent.click(screen.getByRole("button", { name: "Switch workspace from alpha" }));

    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "Switch workspace from beta" }),
    ).toHaveTextContent("beta");
    expect(screen.getByText("/workspaces/beta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Team Handbook" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("document-state")).toHaveTextContent("Team Handbook");
  });
});
