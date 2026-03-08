import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Mohio v2 prototype", () => {
  it("renders the workspace shell and switches between main views", async () => {
    const user = userEvent.setup();
    render(<App />);
    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace views" }));

    expect(screen.getByText("Core workspace")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Capture rough notes first. Organise later." })).toBeInTheDocument();

    await user.click(workspaceTabs.getByRole("button", { name: "Wiki" }));
    expect(screen.getAllByRole("heading", { name: "Team Handbook.md" })[0]).toBeInTheDocument();

    await user.click(workspaceTabs.getByRole("button", { name: "Proposals" }));
    expect(screen.getAllByRole("heading", { name: "Create Decision Log.md" })[0]).toBeInTheDocument();
  });

  it("captures a jot and shows it in the scratchpad stream", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New jot"), "# Interview notes\nCustomer wants clearer publish history.");
    await user.click(screen.getByRole("button", { name: "Capture jot" }));

    expect(screen.getByRole("button", { name: /Interview notes/i })).toBeInTheDocument();
    expect(screen.getByText("New jot captured in the personal scratchpad.")).toBeInTheDocument();
  });

  it("stages a proposal and exposes it in publish review", async () => {
    const user = userEvent.setup();
    render(<App />);
    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace views" }));

    await user.click(workspaceTabs.getByRole("button", { name: "Proposals" }));
    await user.click(screen.getByRole("button", { name: /Tighten proposal review guidance/i }));
    await user.click(screen.getByRole("button", { name: "Stage proposal" }));
    await user.click(workspaceTabs.getByRole("button", { name: "Publish" }));

    expect(screen.getByText("Tighten proposal review guidance was staged for publish review.")).toBeInTheDocument();
    expect(screen.getByText("Update the Proposal Workflow page so onboarding emphasizes staging and explicit publish.")).toBeInTheDocument();
  });

  it("publishes staged changes and records them in page history", async () => {
    const user = userEvent.setup();
    render(<App />);
    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace views" }));
    const contextTabs = within(screen.getByRole("tablist", { name: "Context panel" }));

    await user.click(workspaceTabs.getByRole("button", { name: "Publish" }));
    await user.click(screen.getByRole("button", { name: "Publish selected changes" }));
    await user.click(workspaceTabs.getByRole("button", { name: "Wiki" }));
    await user.click(contextTabs.getByRole("button", { name: "History" }));

    expect(screen.getByText(/Published 2 workspace changes./i)).toBeInTheDocument();
    expect(screen.getByText("Unsaved shared guidance about readable page histories.")).toBeInTheDocument();
  });

  it("updates the context panel when a different page is selected", async () => {
    const user = userEvent.setup();
    render(<App />);
    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace views" }));
    const contextPanel = within(screen.getByRole("complementary", { name: "Context panel surface" }));

    await user.click(workspaceTabs.getByRole("button", { name: "Wiki" }));
    await user.click(screen.getAllByRole("button", { name: /Workspace Model.md/i })[0]);

    expect(screen.getAllByText("Workspace Model.md")[0]).toBeInTheDocument();
    expect(contextPanel.getByRole("button", { name: /Release Checklist.md/i })).toBeInTheDocument();
  });
});
