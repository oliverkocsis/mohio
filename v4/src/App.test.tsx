import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Mohio v4 simplified prototype", () => {
  it("renders the full-screen three-panel layout", () => {
    render(<App />);

    expect(screen.getByRole("complementary", { name: "Scratchpad panel" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Jot editor" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Wiki impact panel" })).toBeInTheDocument();
  });

  it("creates a new jot and selects it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New jot" }));
    await user.type(screen.getByRole("textbox", { name: "Jot editor" }), "Fresh research note");

    expect(screen.getAllByText("Fresh research note")[0]).toBeInTheDocument();
  });

  it("generates a proposal with rationale and diff content", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Generate proposal" }));

    expect(screen.getByText(/Turn rollout notes into a new shared Decision Log page/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple pilot notes point to decisions being made/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Create Decision Log\.md as a shared destination/i)).toBeInTheDocument();
  });

  it("accepts a proposal and creates the resulting wiki page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Generate proposal" }));
    await user.click(screen.getByRole("button", { name: "Accept proposal" }));

    expect(screen.getByRole("heading", { name: "Decision Log.md" })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Record important product and workflow decisions/i)).toBeInTheDocument();
  });

  it("allows direct editing of the resulting wiki page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Generate proposal" }));
    await user.click(screen.getByRole("button", { name: "Accept proposal" }));

    const wikiEditor = screen.getByRole("textbox", { name: "Wiki page editor" });
    await user.clear(wikiEditor);
    await user.type(wikiEditor, "# Decision Log\n\nEdited shared draft.");

    expect(screen.getByDisplayValue(/Edited shared draft\./)).toBeInTheDocument();
  });

  it("can generate a proposal for a newly created jot", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New jot" }));
    await user.type(screen.getByRole("textbox", { name: "Jot editor" }), "Research synthesis\n\nA clearer shared summary is needed.");
    await user.click(screen.getByRole("button", { name: "Generate proposal" }));

    const impactPanel = within(screen.getByRole("complementary", { name: "Wiki impact panel" }));
    expect(impactPanel.getByRole("heading", { name: "Create Research synthesis.md" })).toBeInTheDocument();
  });
});
