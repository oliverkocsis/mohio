import { createElement } from "react";
import { render } from "@testing-library/react";
import { EditorSelection } from "@codemirror/state";
import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown";
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

    expect(insertNewlineContinueMarkup(view!)).toBe(true);
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

});
