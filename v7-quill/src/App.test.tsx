import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeAll(() => {
  vi.spyOn(window, "prompt").mockImplementation(() => "https://example.com");
});

describe("v7-quill app", () => {
  it("renders a single full-screen editor with the required toolbar actions", () => {
    render(<App />);

    expect(screen.getByRole("main", { name: "Markdown editor prototype" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Source" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hybrid" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Formatted" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bulleted list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Numbered list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blockquote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inline code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Code block" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
  });

  it("switches the editor mode controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    const source = screen.getByRole("tab", { name: "Source" });
    const hybrid = screen.getByRole("tab", { name: "Hybrid" });
    const formatted = screen.getByRole("tab", { name: "Formatted" });

    expect(hybrid).toHaveAttribute("aria-selected", "true");
    await user.click(source);
    expect(source).toHaveAttribute("aria-selected", "true");
    await user.click(formatted);
    expect(formatted).toHaveAttribute("aria-selected", "true");
  });

  it("seeds the editor with example Markdown content", () => {
    render(<App />);

    const editor = screen.getByRole("textbox", { name: "Markdown editor" }) as HTMLTextAreaElement;
    expect(editor.value).toContain("# Mohio Prototype Draft");
    expect(editor.value).toContain("**bold**");
    expect(editor.value).toContain("```ts");
  });

  it("applies toolbar formatting and keeps the document in Markdown state", async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByRole("textbox", { name: "Markdown editor" }) as HTMLTextAreaElement;
    await user.clear(editor);
    await user.type(editor, "writer");

    editor.setSelectionRange(0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.value).toBe("**writer**");

    editor.setSelectionRange(2, 8);
    await user.click(screen.getByRole("button", { name: "Link" }));
    expect(editor.value).toBe("**[writer](https://example.com)**");

    await user.clear(editor);
    await user.type(editor, "Heading line");
    editor.setSelectionRange(0, editor.value.length);
    await user.click(screen.getByRole("button", { name: "Heading 1" }));
    expect(editor.value.startsWith("# ")).toBe(true);
  });

  it("does not render extra product management features", () => {
    render(<App />);

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /history/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /search/i })).not.toBeInTheDocument();
  });
});
