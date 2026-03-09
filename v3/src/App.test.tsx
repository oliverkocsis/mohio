import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Mohio v3 flagship prototype", () => {
  it("renders the flagship shell with nav tree, page canvas, and AI sidecar", () => {
    render(<App />);

    expect(screen.getByRole("complementary", { name: "Navigation tree" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Page canvas" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "AI sidecar" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Proposal Workflow")).toBeInTheDocument();
  });

  it("selects a page from the tree and updates the canvas and sidecar context", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Release Checklist/i }));

    expect(screen.getByDisplayValue("Release Checklist")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Working with Release Checklist" })).toBeInTheDocument();
  });

  it("applies an AI suggestion and marks the page as draft", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      screen.getByDisplayValue(
        "The flagship experience should let a teammate refine a shared page while an agent proposes edits, extracts decisions, and writes every accepted suggestion into draft state before anything is published to the shared wiki.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Draft changes")).toBeInTheDocument();
    expect(
      screen.getAllByText(/AI suggestion applied to draft: Clarify draft-first trust boundary./i).length,
    ).toBeGreaterThan(0);
  });

  it("dismisses a suggestion and records it in the activity log without changing the page", async () => {
    const user = userEvent.setup();
    render(<App />);
    const originalText =
      "The flagship experience should let a teammate refine a shared page while an agent proposes edits, extracts decisions, and keeps every change visible before it becomes canonical.";

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.getByDisplayValue(originalText)).toBeInTheDocument();
    expect(
      screen.getAllByText("Dismissed suggestion: Clarify draft-first trust boundary.").length,
    ).toBeGreaterThan(0);
    const activityPanel = within(screen.getByText("Activity log").closest("section") as HTMLElement);
    expect(activityPanel.getByText(/Dismissed suggestion: Clarify draft-first trust boundary./i)).toBeInTheDocument();
  });

  it("opens the slash-menu mock from the add-block control", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add block" }));

    expect(screen.getByRole("region", { name: "Block menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "/ Text" })).toBeInTheDocument();
  });
});
