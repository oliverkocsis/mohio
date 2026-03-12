import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Mohio v5 Electron demo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders the desktop three-panel layout", () => {
    render(<App />);

    expect(screen.getByRole("complementary", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Markdown editor panel" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Agent and document context" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("creates, renames, deletes, and recent-tracks notes", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "New note" })[0]);
    expect(screen.getByDisplayValue("Untitled note.md")).toBeInTheDocument();

    const recentSection = screen.getByRole("region", { name: "Recent files" });
    expect(within(recentSection).getAllByText("Untitled note.md")[0]).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Rename Untitled note.md" })[0]);
    await user.clear(screen.getAllByLabelText("Rename Untitled note.md")[0]);
    await user.type(screen.getAllByLabelText("Rename Untitled note.md")[0], "Sprint recap");
    await user.click(screen.getAllByRole("button", { name: "Save" })[0]);

    expect(screen.getByDisplayValue("Sprint recap.md")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Delete Sprint recap.md" })[0]);
    expect(screen.queryByDisplayValue("Sprint recap.md")).not.toBeInTheDocument();
  });

  it("autosaves edits within the session and can open linked markdown files", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown editor");
    await user.click(editor);
    await user.keyboard(" More launch detail.");
    expect(screen.getByText(/unpublished changes/i)).toBeInTheDocument();

    const link = document.querySelector('[data-markdown-path="../plans/publish-checklist.md"]');
    expect(link).not.toBeNull();
    await user.click(link as Element);
    expect(screen.getByLabelText("Document title")).toHaveValue("Publish Checklist.md");
  });

  it("searches by file name and body text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Search notes"), "interview");
    const fileResults = within(screen.getByRole("region", { name: "File search results" }));
    expect(fileResults.getByText("User Interview Highlights.md")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search notes"));
    await user.type(screen.getByLabelText("Search notes"), "separate actions");
    const contentResults = within(screen.getByRole("region", { name: "Content search results" }));
    expect(contentResults.getByText("Launch Brief.md")).toBeInTheDocument();
  });

  it("creates and restores checkpoints, and publish stays separate", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "Create checkpoint" })[0]);
    await user.type(screen.getByLabelText("Checkpoint name"), "Before rewrite");
    await user.type(screen.getByLabelText("Checkpoint note"), "Keep the launch brief version before edits.");
    await user.click(screen.getByRole("button", { name: "Save checkpoint" }));

    const editor = screen.getByLabelText("Markdown editor");
    await user.click(editor);
    await user.keyboard(" Temporary change.");
    await user.click(screen.getAllByRole("button", { name: "Restore" })[0]);

    expect(screen.getByLabelText("Markdown editor")).not.toHaveValue(expect.stringContaining("Temporary change"));

    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(screen.getByText(/published state current/i)).toBeInTheDocument();

    await user.click(editor);
    await user.keyboard(" Another local edit.");
    expect(screen.getByText(/draft differs from the shared version/i)).toBeInTheDocument();
  });

  it("creates reviewable agent proposals, applies updates, creates notes, and discards safely", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Ask the agent"), "rewrite this note for a clearer shared update");
    await user.click(screen.getAllByRole("button", { name: "Send" })[0]);
    expect(screen.getByText(/rewrite launch brief\.md for clearer shared reading/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(screen.getByText(/proposal applied/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Ask the agent"), "create a launch FAQ note");
    await user.click(screen.getAllByRole("button", { name: "Send" })[0]);
    expect(screen.getByText(/create launch faq note\.md from the current workspace context/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByText(/workspace files are unchanged/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Launch FAQ note.md")).not.toBeInTheDocument();
  });
});
