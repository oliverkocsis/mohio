export type ToolbarAction =
  | "bold"
  | "italic"
  | "heading1"
  | "heading2"
  | "bulletList"
  | "numberedList"
  | "blockquote"
  | "code"
  | "link";

export interface TextSelection {
  from: number;
  to: number;
}

export interface FormattingResult {
  text: string;
  selection: TextSelection;
}

export function applyToolbarAction(
  action: ToolbarAction,
  text: string,
  selection: TextSelection,
): FormattingResult {
  switch (action) {
    case "bold":
      return wrapInline(text, selection, "**", "**", "Bold text");
    case "italic":
      return wrapInline(text, selection, "*", "*", "Italic text");
    case "heading1":
      return transformSelectedLines(text, selection, (line) => normalizeHeading(line, "# "));
    case "heading2":
      return transformSelectedLines(text, selection, (line) => normalizeHeading(line, "## "));
    case "bulletList":
      return transformSelectedLines(text, selection, (line) => `- ${line}`);
    case "numberedList":
      return transformSelectedLines(text, selection, (line, index) => `${index + 1}. ${line}`);
    case "blockquote":
      return transformSelectedLines(text, selection, (line) => `> ${line}`);
    case "code":
      return applyCodeFormatting(text, selection);
    case "link":
      return applyLinkFormatting(text, selection);
    default:
      return { text, selection };
  }
}

function wrapInline(
  text: string,
  selection: TextSelection,
  prefix: string,
  suffix: string,
  placeholder: string,
): FormattingResult {
  const { from, to } = normalizeSelection(selection);
  const content = from === to ? placeholder : text.slice(from, to);
  const replacement = `${prefix}${content}${suffix}`;
  const nextText = `${text.slice(0, from)}${replacement}${text.slice(to)}`;
  const selectionStart = from + prefix.length;

  return {
    text: nextText,
    selection: {
      from: selectionStart,
      to: selectionStart + content.length,
    },
  };
}

function applyCodeFormatting(text: string, selection: TextSelection): FormattingResult {
  const { from, to } = normalizeSelection(selection);

  if (from === to) {
    return wrapInline(text, selection, "`", "`", "code");
  }

  const content = text.slice(from, to);
  if (!content.includes("\n")) {
    return wrapInline(text, selection, "`", "`", content);
  }

  const replacement = `\`\`\`\n${content}\n\`\`\``;
  return {
    text: `${text.slice(0, from)}${replacement}${text.slice(to)}`,
    selection: {
      from: from + 4,
      to: from + 4 + content.length,
    },
  };
}

function applyLinkFormatting(text: string, selection: TextSelection): FormattingResult {
  const { from, to } = normalizeSelection(selection);
  const label = from === to ? "Link text" : text.slice(from, to);
  const url = "https://example.com";
  const replacement = `[${label}](${url})`;
  const urlStart = from + replacement.indexOf(url);

  return {
    text: `${text.slice(0, from)}${replacement}${text.slice(to)}`,
    selection: {
      from: urlStart,
      to: urlStart + url.length,
    },
  };
}

function transformSelectedLines(
  text: string,
  selection: TextSelection,
  transformLine: (line: string, index: number) => string,
): FormattingResult {
  const { from, to } = normalizeSelection(selection);
  const start = findLineStart(text, from);
  const end = findLineEnd(text, normalizeLineSelectionEnd(text, from, to));
  const block = text.slice(start, end);
  const lines = block.length > 0 ? block.split("\n") : [""];
  const replacement = lines.map(transformLine).join("\n");

  return {
    text: `${text.slice(0, start)}${replacement}${text.slice(end)}`,
    selection: {
      from: start,
      to: start + replacement.length,
    },
  };
}

function normalizeHeading(line: string, prefix: string) {
  const stripped = line.trimStart().replace(/^#{1,6}\s*/, "");
  return `${prefix}${stripped}`;
}

function normalizeSelection(selection: TextSelection): TextSelection {
  return selection.from <= selection.to
    ? selection
    : {
        from: selection.to,
        to: selection.from,
      };
}

function findLineStart(text: string, position: number) {
  const newlineIndex = text.lastIndexOf("\n", Math.max(0, position - 1));
  return newlineIndex === -1 ? 0 : newlineIndex + 1;
}

function findLineEnd(text: string, position: number) {
  if (position >= text.length) {
    return text.length;
  }

  const newlineIndex = text.indexOf("\n", position);
  return newlineIndex === -1 ? text.length : newlineIndex;
}

function normalizeLineSelectionEnd(text: string, from: number, to: number) {
  if (to <= from) {
    return from;
  }

  return text[to - 1] === "\n" ? to - 1 : to;
}
