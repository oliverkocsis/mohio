import { createElement } from "react";
import { render } from "@testing-library/react";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  applyBlockQuote,
  applyBulletList,
  applyClearFormatting,
  applyCodeBlock,
  applyHeading,
  applyInlineWrap,
  applyLink,
  getInternalLinkAtPosition,
  handleMarkdownEnter,
  handleMarkdownTab,
  RichTextEditor,
} from "@renderer/markdown-editor";

describe("markdown editor toolbar transforms", () => {
  it("wraps and unwraps inline markers", () => {
    expect(applyInlineWrap("Alpha", 0, 5, "**").text).toBe("**Alpha**");
    expect(applyInlineWrap("**Alpha**", 2, 7, "**").text).toBe("Alpha");
  });

  it("toggles headings on the current line", () => {
    expect(applyHeading("Alpha", 0, 0, 2).text).toBe("## Alpha");
    expect(applyHeading("## Alpha", 0, 0, 2).text).toBe("Alpha");
  });

  it("applies block quotes and bullet lists line by line", () => {
    expect(applyBlockQuote("Alpha\nBeta", 0, 10).text).toBe("> Alpha\n> Beta");
    expect(applyBulletList("1. Alpha\n2. Beta", 0, 16).text).toBe("- Alpha\n- Beta");
  });

  it("wraps selected text in fenced code blocks", () => {
    expect(applyCodeBlock("const x = 1;", 0, 12).text).toBe("```\nconst x = 1;\n```");
  });

  it("builds markdown links directly from the current selection", () => {
    expect(applyLink("Alpha", 0, 5, "https://example.com").text).toBe("[Alpha](https://example.com)");
  });

  it("extracts markdown and wiki internal links by cursor position", () => {
    const markdownLink = "[Plan](docs/Plan.md)";
    expect(getInternalLinkAtPosition(markdownLink, 2)).toEqual({ target: "docs/Plan.md" });

    const wikiLink = "[[Architecture|System Design]]";
    expect(getInternalLinkAtPosition(wikiLink, 4)).toEqual({ target: "Architecture" });
  });

  it("removes line and inline markdown formatting", () => {
    expect(applyClearFormatting("## **Alpha**", 0, 12).text).toBe("Alpha");
    expect(applyClearFormatting("- [ ] Alpha", 0, 11).text).toBe("Alpha");
    expect(applyClearFormatting("Title\n-----", 0, 11).text).toBe("Title\n");
  });

  it("keeps list formatting active after continuing a bullet list with Enter", () => {
    const handleChange = vi.fn();
    const { container } = render(createElement(RichTextEditor, {
      markdown: "- First item",
      onChange: handleChange,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const editorElement = container.querySelector(".cm-editor");

    expect(editorElement).not.toBeNull();

    const view = EditorView.findFromDOM(editorElement as HTMLElement);

    expect(view).not.toBeNull();

    view!.dispatch({
      selection: EditorSelection.cursor(view!.state.doc.length),
    });

    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("- First item\n- ");
    expect(handleChange).toHaveBeenLastCalledWith("- First item\n- ");
    const bulletItems = Array.from(container.querySelectorAll(".cm-md-bullet-item"));

    expect(bulletItems).toHaveLength(2);
    expect(bulletItems[0]?.classList.contains("cm-md-list-item--continued")).toBe(true);
  });

  it("renders image markdown without crashing the presentation layer", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "![Alt text](https://example.com/image.png)",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    expect(container.querySelectorAll(".cm-md-image-alt")).toHaveLength(1);
  });

  it("decorates heading and inline code markdown syntax in the editor surface", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "# Heading\n\nUse `inline` code.",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));
    const content = container.querySelector(".cm-content");

    expect(container.querySelectorAll(".cm-md-heading-1")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-md-inline-code")).toHaveLength(1);
    expect(content).not.toBeNull();
    expect(content?.textContent).toContain("Heading");
    expect(content?.textContent).toContain("Use inline code.");
    expect(content?.textContent).not.toContain("# Heading");
    expect(content?.textContent).not.toContain("`inline`");
  });

  it("keeps mixed inline markdown decorated without falling back to raw text", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "# Lorem Ipsum\n\n~~What~~ if I `do` *this*\n# Or this\nThen \n- \n- T****hen **nothing** a\n\n1. HEll\n2. **advdv**\n3. This is a change\n4. ",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const content = container.querySelector(".cm-content");

    expect(content).not.toBeNull();
    expect(content?.textContent).not.toContain("# Lorem Ipsum");
    expect(content?.textContent).not.toContain("~~What~~");
    expect(content?.textContent).not.toContain("`do`");
    expect(container.querySelectorAll(".cm-md-heading-1")).toHaveLength(2);
    expect(container.querySelectorAll(".cm-md-strikethrough")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-md-inline-code")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-md-strong").length).toBeGreaterThanOrEqual(2);
  });

  it("does not decorate inline styles inside inline code spans", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "_this makes italic_ but `in_this_text_should_be_NO_italic`",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    expect(container.querySelectorAll(".cm-md-emphasis")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-md-inline-code")).toHaveLength(1);
  });

  it("does not decorate inline styles inside fenced code blocks", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "_outside_\n\n```\n_inside_\n**bold**\n```",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    expect(container.querySelectorAll(".cm-md-emphasis")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-md-strong")).toHaveLength(0);
  });

  it("highlights search matches in the visible document text", () => {
    const { container, rerender } = render(createElement(RichTextEditor, {
      highlightQuery: "alpha",
      markdown: "Alpha beta alpha",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    expect(container.querySelectorAll(".cm-search-highlight").length).toBeGreaterThanOrEqual(2);

    rerender(createElement(RichTextEditor, {
      highlightQuery: "",
      markdown: "Alpha beta alpha",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    expect(container.querySelectorAll(".cm-search-highlight")).toHaveLength(0);
  });

  it("decorates nested mixed lists with four-space indentation depth", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "1. Hello World\n2. Lorem Ipsum\n    1. dolor sit amet\n    2. consectetur adipiscing elit\n        - Sed tristique libero",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const orderedItems = Array.from(container.querySelectorAll(".cm-md-ordered-item"));
    const bulletItems = Array.from(container.querySelectorAll(".cm-md-bullet-item"));

    expect(orderedItems).toHaveLength(4);
    expect(bulletItems).toHaveLength(1);
    expect(orderedItems[0]?.getAttribute("style")).toContain("--md-list-depth: 0");
    expect(orderedItems[2]?.getAttribute("style")).toContain("--md-list-depth: 1");
    expect(bulletItems[0]?.getAttribute("style")).toContain("--md-list-depth: 2");
  });

  it("joins consecutive blockquotes into one visual quote block", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "> First quote line\n> Second quote line\nNormal paragraph",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const quoteLines = Array.from(container.querySelectorAll(".cm-md-blockquote"));

    expect(quoteLines).toHaveLength(2);
    expect(quoteLines[0]?.classList.contains("cm-md-blockquote--continued")).toBe(true);
    expect(quoteLines[1]?.classList.contains("cm-md-blockquote--continued")).toBe(false);
  });

  it("removes top-level list marker on second Enter from an empty continuation line", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "- First item",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const view = EditorView.findFromDOM(container.querySelector(".cm-editor") as HTMLElement);

    expect(view).not.toBeNull();

    view!.dispatch({
      selection: EditorSelection.cursor(view!.state.doc.length),
    });

    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("- First item\n- ");
    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("- First item\n");
  });

  it("removes top-level blockquote marker on second Enter from an empty continuation line", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "> This",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const view = EditorView.findFromDOM(container.querySelector(".cm-editor") as HTMLElement);

    expect(view).not.toBeNull();

    view!.dispatch({
      selection: EditorSelection.cursor(view!.state.doc.length),
    });

    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("> This\n> ");
    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("> This\n");
  });

  it("decreases nested list depth on Enter from an empty continuation line", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "    - First nested item",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const view = EditorView.findFromDOM(container.querySelector(".cm-editor") as HTMLElement);

    expect(view).not.toBeNull();

    view!.dispatch({
      selection: EditorSelection.cursor(view!.state.doc.length),
    });

    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("    - First nested item\n    - ");
    expect(handleMarkdownEnter(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("    - First nested item\n- ");
  });

  it("increases list depth by four spaces on Tab", () => {
    const { container } = render(createElement(RichTextEditor, {
      markdown: "- First item",
      onChange: () => undefined,
      onTitleChange: () => undefined,
      title: "Title",
    }));

    const view = EditorView.findFromDOM(container.querySelector(".cm-editor") as HTMLElement);

    expect(view).not.toBeNull();

    view!.dispatch({
      selection: EditorSelection.cursor(0),
    });

    expect(handleMarkdownTab(view!)).toBe(true);
    expect(view!.state.doc.toString()).toBe("    - First item");
  });

});
