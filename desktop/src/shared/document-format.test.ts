import {
  buildMarkdownDocument,
  normalizeBodyMarkdown,
  parseMarkdownDocument,
} from "./document-format";

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
      titleMode: "h1-linked",
    })).toEqual({
      bodyMarkdown: "Paragraph one  \n\n```\n  code  \n```\n",
      frontmatterTitle: undefined,
      markdown: "# New Title\n\nParagraph one  \n\n```\n  code  \n```\n",
    });
  });

  it("detects h1-linked mode when the first heading follows blank lines", () => {
    expect(parseMarkdownDocument("\n\n# Team Plan\n\nBody.\n", "Team Plan.md")).toEqual({
      bodyMarkdown: "Body.\n",
      displayTitle: "Team Plan",
      titleMode: "h1-linked",
      frontmatterTitle: undefined,
      hasTitleFrontmatter: false,
      headingTitle: "Team Plan",
    });
  });

  it("falls back to filename-linked mode when no leading H1 exists", () => {
    expect(parseMarkdownDocument("Paragraph.\n# Secondary Heading\n", "Roadmap.md")).toEqual({
      bodyMarkdown: "Paragraph.\n# Secondary Heading\n",
      displayTitle: "Roadmap",
      titleMode: "filename-linked",
      frontmatterTitle: undefined,
      hasTitleFrontmatter: false,
      headingTitle: undefined,
    });
  });

  it("uses filename-linked mode when sanitized H1 and filename do not match", () => {
    expect(parseMarkdownDocument("# Product Vision\n\nBody.\n", "Roadmap.md")).toEqual({
      bodyMarkdown: "# Product Vision\n\nBody.\n",
      displayTitle: "Roadmap",
      titleMode: "filename-linked",
      frontmatterTitle: undefined,
      hasTitleFrontmatter: false,
      headingTitle: "Product Vision",
    });
  });

  it("ignores frontmatter title for visible-title mode selection", () => {
    expect(parseMarkdownDocument(
      "---\ntitle: Frontmatter Title\n---\n# README\n\nBody.\n",
      "README.md",
    )).toEqual({
      bodyMarkdown: "Body.\n",
      displayTitle: "README",
      titleMode: "h1-linked",
      frontmatterTitle: "Frontmatter Title",
      hasTitleFrontmatter: true,
      headingTitle: "README",
    });
  });

  it("saves filename-linked mode without rewriting an H1", () => {
    expect(buildMarkdownDocument({
      bodyMarkdown: "# Keep Me\n\nBody.\n",
      existingMarkdown: "# Old Title\n",
      title: "Renamed",
      titleMode: "filename-linked",
    })).toEqual({
      bodyMarkdown: "# Keep Me\n\nBody.\n",
      frontmatterTitle: undefined,
      markdown: "# Keep Me\n\nBody.\n",
    });
  });

  it("preserves existing frontmatter title values instead of syncing them", () => {
    expect(buildMarkdownDocument({
      bodyMarkdown: "Body.\n",
      existingMarkdown: "---\ntitle: Legacy Frontmatter\nowner: Docs\n---\n# README\n",
      title: "README",
      titleMode: "h1-linked",
    })).toEqual({
      bodyMarkdown: "Body.\n",
      frontmatterTitle: "Legacy Frontmatter",
      markdown: "---\ntitle: Legacy Frontmatter\nowner: Docs\n---\n# README\n\nBody.\n",
    });
  });
});
