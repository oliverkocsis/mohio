import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as mockAssistant from "./lib/mock-assistant";

describe("v10 tauri app", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the three-pane workspace shell with seeded content", () => {
    render(<App />);

    expect(screen.getByLabelText("Workspace navigation")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace document")).toBeInTheDocument();
    expect(screen.getByLabelText("Assistant chat")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product HQ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Q2 workspace overview", level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Morning sync:/i)).toBeInTheDocument();
  });

  it("supports nested folder expand and collapse", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("button", { name: /Roadmap/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Q2 workspace overview.md/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Roadmap/i }));

    expect(screen.getByRole("button", { name: /Roadmap/i })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /Q2 workspace overview.md/i })).not.toBeInTheDocument();
  });

  it("updates the document surface when selecting a different file", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Interview notes.md/i }));

    expect(screen.getByRole("heading", { name: "Interview notes", level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Teams want a workspace/i)).toBeInTheDocument();
  });

  it("switches workspaces and resets the seeded document state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText("Active workspace"), "studio-ops");

    expect(screen.getByRole("heading", { name: "Studio Ops" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Studio handbook", level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/This workspace is tuned for design operations/i)).toBeInTheDocument();
  });

  it("adds a user message and then a mock assistant reply", async () => {
    vi.useFakeTimers();
    vi.spyOn(mockAssistant, "createMockAssistantReply").mockReturnValue(
      "A clean next step would be: Keep the center pane dominant.",
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText("Message the assistant"), {
      target: { value: "Give me a layout note" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send/i }));

    expect(screen.getByText("Give me a layout note")).toBeInTheDocument();
    expect(screen.getByText("typing")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByText(/Keep the center pane dominant/i)).toBeInTheDocument();
  });

  it("does not expose real editor or filesystem controls", () => {
    render(<App />);

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
  });
});
