import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { MOCK_ASSISTANT_REPLIES } from "./data/workspaces";

describe("Mohio v9 Electron prototype", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the three-pane desktop layout", () => {
    render(<App />);

    expect(screen.getByRole("complementary", { name: "Workspace navigation" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Document surface" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Assistant chat" })).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Message input")).toBeInTheDocument();
  });

  it("collapses and expands nested folders in the file tree", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: "Competitive notes.md" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Research" }));
    expect(screen.queryByRole("button", { name: "Competitive notes.md" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Research" }));
    expect(screen.getByRole("button", { name: "Competitive notes.md" })).toBeInTheDocument();
  });

  it("switches the active document when a file is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Changelog ritual.md" }));

    expect(screen.getByRole("heading", { name: "Changelog ritual.md" })).toBeInTheDocument();
    expect(screen.getByText(/release notes should read as a narrative/i)).toBeInTheDocument();
  });

  it("switches workspace tree, document, and chat seed when the workspace changes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Workspace"), "workspace-editorial");

    expect(screen.getByRole("heading", { name: "Homepage narrative.md" })).toBeInTheDocument();
    expect(screen.getByText(/tighten story structure/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publishing style.md" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Changelog ritual.md" })).not.toBeInTheDocument();
  });

  it("adds a user message and delayed mock assistant reply", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Message input"), {
      target: { value: "Can you shorten this note?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("Can you shorten this note?")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText(MOCK_ASSISTANT_REPLIES[0])).toBeInTheDocument();
  });
});
