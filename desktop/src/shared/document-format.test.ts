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

  it("preserves trailing spaces and fenced code block whitespace", () => {
    expect(
      normalizeBodyMarkdown([
        "Line with hard break  ",
        "",
        "```",
        "  const value = 1;  ",
        "```",
        "",
      ].join("\n")),
    ).toBe([
      "Line with hard break  ",
      "",
      "```",
      "  const value = 1;  ",
      "```",
      "",
    ].join("\n"));
  });

  it("returns the normalized body alongside the full markdown document", () => {
    expect(buildMarkdownDocument({
      bodyMarkdown: "Paragraph one  \n\n```\n  code  \n```\n",
      existingMarkdown: "# Old Title\n",
      title: "New Title",
    })).toEqual({
      bodyMarkdown: "Paragraph one  \n\n```\n  code  \n```\n",
      frontmatterTitle: undefined,
      markdown: "# New Title\n\nParagraph one  \n\n```\n  code  \n```\n\n",
    });
  });
});
