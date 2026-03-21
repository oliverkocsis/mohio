import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const PRESERVED_BLOCK_LABELS = {
  table: "Preserved table block",
  "task-list": "Preserved task list block",
} as const;

const TABLE_BLOCK_PATTERN = /(?:^\|.*\|\r?\n^\|(?:[-: ]+\|)+\r?\n(?:^\|.*\|\r?\n?)*)/gmu;
const TASK_LIST_BLOCK_PATTERN = /(?:(?:^(?:[ \t]*)[-*] \[(?: |x|X)\] .*(?:\r?\n|$))+)/gmu;

interface PreservedBlockMatch {
  end: number;
  markdown: string;
  start: number;
  type: keyof typeof PRESERVED_BLOCK_LABELS;
}

marked.setOptions({
  async: false,
  breaks: false,
  gfm: true,
});

export function markdownToEditorHtml(markdown: string): string {
  const preservedMatches = findPreservedBlockMatches(markdown);

  if (preservedMatches.length === 0) {
    return String(marked.parse(markdown));
  }

  const fragments: string[] = [];
  let currentIndex = 0;

  for (const match of preservedMatches) {
    if (match.start > currentIndex) {
      fragments.push(String(marked.parse(markdown.slice(currentIndex, match.start))));
    }

    fragments.push(createPreservedBlockHtml(match));
    currentIndex = match.end;
  }

  if (currentIndex < markdown.length) {
    fragments.push(String(marked.parse(markdown.slice(currentIndex))));
  }

  return fragments.join("");
}

export function editorHtmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    headingStyle: "atx",
  });

  turndownService.use(gfm);
  turndownService.addRule("preserved-block", {
    filter: (node) =>
      node instanceof HTMLElement &&
      node.dataset.preservedMarkdown !== undefined,
    replacement: (_content, node) => {
      if (!(node instanceof HTMLElement)) {
        return "";
      }

      return `\n\n${decodePreservedMarkdown(node.dataset.preservedMarkdown ?? "")}\n\n`;
    },
  });

  const markdown = turndownService.turndown(html)
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  return markdown ? `${markdown}\n` : "";
}

function createPreservedBlockHtml(match: PreservedBlockMatch): string {
  return `
    <div
      class="mohio-preserved-block"
      data-preserved-block-type="${match.type}"
      data-preserved-markdown="${encodePreservedMarkdown(match.markdown)}"
    >
      <div class="mohio-preserved-block__label">${PRESERVED_BLOCK_LABELS[match.type]}</div>
      <pre class="mohio-preserved-block__preview">${escapeHtml(match.markdown.trim())}</pre>
    </div>
  `;
}

function findPreservedBlockMatches(markdown: string): PreservedBlockMatch[] {
  const matches = [
    ...collectMatches(markdown, TABLE_BLOCK_PATTERN, "table"),
    ...collectMatches(markdown, TASK_LIST_BLOCK_PATTERN, "task-list"),
  ];

  return matches
    .sort((left, right) => left.start - right.start)
    .filter((match, index) => {
      const previousMatch = matches[index - 1];

      if (!previousMatch) {
        return true;
      }

      return match.start >= previousMatch.end;
    });
}

function collectMatches(
  markdown: string,
  pattern: RegExp,
  type: keyof typeof PRESERVED_BLOCK_LABELS,
): PreservedBlockMatch[] {
  const matches: PreservedBlockMatch[] = [];
  const globalPattern = new RegExp(pattern);

  for (const match of markdown.matchAll(globalPattern)) {
    const matchedMarkdown = match[0];
    const start = match.index ?? 0;

    matches.push({
      start,
      end: start + matchedMarkdown.length,
      markdown: matchedMarkdown.trimEnd(),
      type,
    });
  }

  return matches;
}

function encodePreservedMarkdown(markdown: string): string {
  return encodeURIComponent(markdown);
}

function decodePreservedMarkdown(markdown: string): string {
  return decodeURIComponent(markdown);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}
