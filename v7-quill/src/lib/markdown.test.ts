import { describe, expect, it } from "vitest";
import { htmlToMarkdown, markdownToHtml, normalizeMarkdown } from "./markdown";

describe("markdown conversion", () => {
  it("round-trips the supported Markdown formatting set", () => {
    const source = normalizeMarkdown(`# Heading 1

## Heading 2

This has **bold**, *italic*, and a [link](https://example.com).

- one
- two

1. first
2. second

> quoted

Use \`inline code\`.

\`\`\`ts
const answer = 42;
\`\`\``);

    const html = markdownToHtml(source);
    const roundTrip = htmlToMarkdown(html);

    expect(roundTrip).toContain("# Heading 1");
    expect(roundTrip).toContain("## Heading 2");
    expect(roundTrip).toContain("**bold**");
    expect(roundTrip).toContain("*italic*");
    expect(roundTrip).toContain("[link](https://example.com)");
    expect(roundTrip).toContain("- one");
    expect(roundTrip).toContain("1. first");
    expect(roundTrip).toContain("> quoted");
    expect(roundTrip).toContain("`inline code`");
    expect(roundTrip).toContain("```");
    expect(roundTrip).toContain("const answer = 42;");
  });

  it("normalizes line endings and trims trailing whitespace", () => {
    expect(normalizeMarkdown("Hello\r\nworld  \r\n")).toBe("Hello\nworld");
  });
});
