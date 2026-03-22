import { buildMarkdownDocument, normalizeBodyMarkdown } from "./document-format";

describe("document-format", () => {
  it("preserves repeated blank lines and soft line breaks", () => {
    expect(
      normalizeBodyMarkdown([
        "First paragraph",
        "Second paragraph",
        "",
        "",
        "- One",
        "- Two",
        "",
        "After the list",
        "",
        "## Heading",
        "After heading",
      ].join("\n")),
    ).toBe([
      "First paragraph",
      "Second paragraph",
      "",
      "",
      "- One",
      "- Two",
      "",
      "After the list",
      "",
      "## Heading",
      "After heading",
    ].join("\n"));
  });

  it("returns the normalized body alongside the full markdown document", () => {
    expect(buildMarkdownDocument({
      bodyMarkdown: "Paragraph one\nParagraph two",
      existingMarkdown: "# Old Title\n",
      title: "New Title",
    })).toEqual({
      bodyMarkdown: "Paragraph one\nParagraph two\n",
      frontmatterTitle: undefined,
      markdown: "# New Title\n\nParagraph one\nParagraph two\n",
    });
  });
});
