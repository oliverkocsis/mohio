import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

function selectText(element: HTMLTextAreaElement, from: number, to: number) {
  element.focus();
  element.setSelectionRange(from, to);
  fireEvent.select(element);
}

describe("v6 CodeMirror standalone editor prototype", () => {
  it("renders only the minimal editor surface", () => {
    render(<App />);

    expect(screen.getByRole("toolbar", { name: "Editor state" })).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Text formatting" })).toBeInTheDocument();
    expect(screen.getByLabelText("Markdown document")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("seeds the editor with example Markdown content", () => {
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    expect(editor.value).toContain("# Q2 Launch Narrative");
    expect(editor.value).toContain("[Launch checklist](https://example.com)");
    expect(editor).toHaveAttribute("data-editor-mode", "hybrid");
  });

  it("switches between source, hybrid, and formatted modes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Source" }));
    expect(screen.getByLabelText("Markdown document")).toHaveAttribute("data-editor-mode", "source");

    await user.click(screen.getByRole("button", { name: "Formatted" }));
    expect(screen.getByLabelText("Markdown document")).toHaveAttribute("data-editor-mode", "formatted");

    await user.click(screen.getByRole("button", { name: "Hybrid" }));
    expect(screen.getByLabelText("Markdown document")).toHaveAttribute("data-editor-mode", "hybrid");
  });

  it("applies inline toolbar actions from the toolbar", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    const target = "single command center";
    const start = editor.value.indexOf(target);
    selectText(editor, start, start + target.length);

    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.value).toContain(`**${target}**`);

    const codeTarget = "customer value";
    const codeStart = editor.value.indexOf(codeTarget);
    selectText(editor, codeStart, codeStart + codeTarget.length);

    await user.click(screen.getByRole("button", { name: "Code" }));
    expect(editor.value).toContain(`\`${codeTarget}\``);
  });

  it("inserts placeholders for collapsed inline actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    selectText(editor, 0, 0);

    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(editor.value.startsWith("*Italic text*# Q2 Launch Narrative")).toBe(true);

    selectText(editor, 0, 0);
    await user.click(screen.getByRole("button", { name: "Link" }));
    expect(editor.value.startsWith("[Link text](https://example.com)*Italic text*")).toBe(true);
  });

  it("normalizes headings and prefixes selected lines for block actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    const headingStart = editor.value.indexOf("## Goals");
    selectText(editor, headingStart, headingStart + "## Goals".length);

    await user.click(screen.getByRole("button", { name: "Heading 1" }));
    expect(editor.value).toContain("# Goals");
    expect(editor.value).not.toContain("## Goals");

    const blockStart = editor.value.indexOf("- Share the headline story in one place");
    const blockEnd =
      editor.value.indexOf("- Make the next actions easy to scan") +
      "- Make the next actions easy to scan".length;
    selectText(editor, blockStart, blockEnd);

    await user.click(screen.getByRole("button", { name: "Blockquote" }));
    expect(editor.value).toContain("> - Share the headline story in one place");
    expect(editor.value).toContain("> - Make the next actions easy to scan");
  });

  it("numbers and fences multiline selections", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText("Markdown document") as HTMLTextAreaElement;
    const listStart = editor.value.indexOf("1. Start with customer value");
    const listEnd =
      editor.value.indexOf("3. Close with launch-day ownership") +
      "3. Close with launch-day ownership".length;
    selectText(editor, listStart, listEnd);

    await user.click(screen.getByRole("button", { name: "Numbered list" }));
    expect(editor.value).toContain("1. 1. Start with customer value");
    expect(editor.value).toContain("2. 2. Highlight the operational plan");
    expect(editor.value).toContain("3. 3. Close with launch-day ownership");

    const quoteStart = editor.value.indexOf("> Draft in public");
    const quoteEnd = editor.value.indexOf("[Launch checklist]");
    selectText(editor, quoteStart, quoteEnd - 2);

    await user.click(screen.getByRole("button", { name: "Code" }));
    expect(editor.value).toContain("```\n> Draft in public, edit with intent, and keep the document easy to read.");
  });
});
