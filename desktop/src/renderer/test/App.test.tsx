import { render, screen, within } from "@testing-library/react";
import App from "@renderer/App";

describe("App", () => {
  it("renders the initial desktop shell", () => {
    window.mohio = {
      getAppInfo: () => ({
        name: "Mohio",
        version: "0.1.0",
        platform: "darwin",
      }),
    };

    render(<App />);

    const topBar = screen.getByTestId("top-bar");

    expect(topBar).toBeInTheDocument();
    expect(screen.getByTestId("workspace-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-sidebar")).toBeInTheDocument();
    expect(within(topBar).getByText("Mohio")).toBeInTheDocument();
    expect(within(topBar).queryByRole("button", { name: "Select workspace" })).not.toBeInTheDocument();
    expect(within(topBar).getByLabelText("Search workspace")).toBeInTheDocument();
    expect(screen.getByTestId("hello-state")).toHaveTextContent("Hello Mohio");
    expect(screen.queryByText("Desktop foundation")).not.toBeInTheDocument();
    expect(screen.queryByText("Document")).not.toBeInTheDocument();
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
    expect(within(topBar).queryByText("Hello Mohio")).not.toBeInTheDocument();
    expect(within(topBar).queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "New note" })).toHaveLength(1);
  });
});
