import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const turndownService = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  headingStyle: "atx",
  strongDelimiter: "**",
});

turndownService.use(gfm);

export function markdownToHtml(markdown: string) {
  return marked.parse(normalizeMarkdown(markdown), {
    async: false,
    breaks: false,
    gfm: true,
  }) as string;
}

export function htmlToMarkdown(html: string) {
  return normalizeMarkdown(turndownService.turndown(html));
}

export function normalizeMarkdown(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^(\s*[-+*])\s+/gm, "$1 ")
    .replace(/^(\s*\d+\.)\s+/gm, "$1 ")
    .trim();
}
