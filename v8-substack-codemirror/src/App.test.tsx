import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

function selectText(element: HTMLTextAreaElement, from: number, to: number) {
  element.focus();
  element.setSelectionRange(from, to);
  fireEvent.select(element);
}

describe("v8 Substack CodeMirror editor prototype", () => {
  it("renders a blank article editor with title and body placeholders", () => {
    render(<App />);

    expect(screen.getByRole("toolbar", { name: "Article formatting toolbar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Style" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inline code" })).toBeInTheDocument();
    expect(screen.getByLabelText("Markdown document")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Start writing...")).toBeInTheDocument();
  });

  it("applies style menu actions for paragraph and headings", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    await user.type(editor, "Launch");

    selectText(editor, 0, "Launch".length);
    await user.click(screen.getByRole("button", { name: "Style" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Heading 1" }));
    expect(editor.value).toBe("# Launch");

    selectText(editor, 0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "Style" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Paragraph" }));
    expect(editor.value).toBe("Launch");

    selectText(editor, 0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "Style" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Heading 2" }));
    expect(editor.value).toBe("## Launch");
  });

  it("applies blockquote and code block actions from the more menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    await user.type(editor, "Line one\nLine two");

    selectText(editor, 0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Blockquote" }));
    expect(editor.value).toBe("> Line one\n> Line two");

    selectText(editor, 0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Code block" }));
    expect(editor.value).toBe("```\n> Line one\n> Line two\n```");
  });

  it("switches modes from the more menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document");

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Source" }));
    expect(editor).toHaveAttribute("data-editor-mode", "source");

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Formatted" }));
    expect(editor).toHaveAttribute("data-editor-mode", "formatted");

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Hybrid" }));
    expect(editor).toHaveAttribute("data-editor-mode", "hybrid");
  });

  it("supports undo and redo in the textarea fallback", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    await user.type(editor, "Alpha");

    selectText(editor, 0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.value).toBe("**Alpha**");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(editor.value).toBe("Alpha");

    await user.click(screen.getByRole("button", { name: "Redo" }));
    expect(editor.value).toBe("**Alpha**");
  });
});
