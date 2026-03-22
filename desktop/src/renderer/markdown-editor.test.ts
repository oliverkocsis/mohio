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

  it("removes line and inline markdown formatting", () => {
    expect(applyClearFormatting("## **Alpha**", 0, 12).text).toBe("Alpha");
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
});
