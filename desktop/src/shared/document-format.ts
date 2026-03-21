import path from "node:path";
import { parse, stringify } from "yaml";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/u;
const LEADING_H1_PATTERN = /^(?:\r?\n)*#\s+(.+?)\s*(?:\r?\n|$)/u;
const ILLEGAL_FILENAME_CHARACTERS_PATTERN = /[<>:"/\\|?*;\u0000-\u001F]/gu;
const WINDOWS_RESERVED_BASENAME_PATTERN = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu;
const MARKDOWN_EXTENSION_PATTERN = /\.(md|markdown|mdx)$/iu;

export interface ParsedMarkdownDocument {
  bodyMarkdown: string;
  displayTitle: string;
  frontmatterTitle?: string;
  hasTitleFrontmatter: boolean;
  headingTitle?: string;
}

interface ParsedFrontmatter {
  metadata: Record<string, unknown>;
  rawFrontmatter: string | null;
  body: string;
}

export function parseMarkdownDocument(
  markdown: string,
  fileName: string,
): ParsedMarkdownDocument {
  const parsedFrontmatter = parseFrontmatter(markdown);
  const headingTitle = getLeadingHeadingTitle(parsedFrontmatter.body);
  const displayTitle = getDisplayTitle({
    fallbackFileName: fileName,
    frontmatterTitle: getFrontmatterTitle(parsedFrontmatter.metadata),
    headingTitle,
  });

  return {
    bodyMarkdown: removeLeadingHeading(parsedFrontmatter.body),
    displayTitle,
    frontmatterTitle: getFrontmatterTitle(parsedFrontmatter.metadata),
    hasTitleFrontmatter: typeof parsedFrontmatter.metadata.title === "string",
    headingTitle,
  };
}

export function buildMarkdownDocument({
  bodyMarkdown,
  existingMarkdown,
  title,
}: {
  bodyMarkdown: string;
  existingMarkdown: string;
  title: string;
}): { frontmatterTitle?: string; markdown: string } {
  const parsedFrontmatter = parseFrontmatter(existingMarkdown);
  const nextMetadata = { ...parsedFrontmatter.metadata };
  const normalizedTitle = normalizeTitle(title);
  const fileSystemTitle = sanitizeFileSystemTitle(normalizedTitle);

  if (fileSystemTitle.wasModified) {
    nextMetadata.title = normalizedTitle;
  } else {
    delete nextMetadata.title;
  }

  const header = `# ${normalizedTitle}`;
  const trimmedBody = bodyMarkdown.replace(/^\s+/u, "").trimEnd();
  const nextBody = trimmedBody ? `${header}\n\n${trimmedBody}` : header;
  const nextFrontmatter = serializeFrontmatter(nextMetadata);

  return {
    frontmatterTitle: typeof nextMetadata.title === "string" ? nextMetadata.title : undefined,
    markdown: nextFrontmatter ? `${nextFrontmatter}\n${nextBody}\n` : `${nextBody}\n`,
  };
}

export function getDisplayTitle({
  fallbackFileName,
  frontmatterTitle,
  headingTitle,
}: {
  fallbackFileName: string;
  frontmatterTitle?: string;
  headingTitle?: string;
}): string {
  return normalizeTitle(frontmatterTitle ?? headingTitle ?? stripMarkdownExtension(fallbackFileName) ?? "Untitled");
}

export function stripMarkdownExtension(fileName: string): string {
  return fileName.replace(MARKDOWN_EXTENSION_PATTERN, "");
}

export function sanitizeFileSystemTitle(title: string): {
  sanitizedTitle: string;
  wasModified: boolean;
} {
  const normalizedTitle = normalizeTitle(title);
  let sanitizedTitle = normalizedTitle
    .replace(ILLEGAL_FILENAME_CHARACTERS_PATTERN, "")
    .replace(/[\r\n\t]/gu, " ")
    .replace(/[ ]+$/gu, "")
    .replace(/[. ]+$/gu, "")
    .trim();

  let wasModified = sanitizedTitle !== normalizedTitle;

  if (WINDOWS_RESERVED_BASENAME_PATTERN.test(sanitizedTitle)) {
    sanitizedTitle = `${sanitizedTitle} Note`;
    wasModified = true;
  }

  if (!sanitizedTitle) {
    sanitizedTitle = "Untitled";
    wasModified = true;
  }

  return {
    sanitizedTitle,
    wasModified,
  };
}

export function getRenamedRelativePath({
  extension,
  relativePath,
  sanitizedTitle,
}: {
  extension: string;
  relativePath: string;
  sanitizedTitle: string;
}): string {
  const parsedPath = path.parse(relativePath);
  return path.join(parsedPath.dir, `${sanitizedTitle}${extension}`);
}

function normalizeTitle(title: string): string {
  const trimmedTitle = title.trim();
  return trimmedTitle || "Untitled";
}

function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const frontmatterMatch = markdown.match(FRONTMATTER_PATTERN);

  if (!frontmatterMatch) {
    return {
      metadata: {},
      rawFrontmatter: null,
      body: markdown,
    };
  }

  const metadata = parse(frontmatterMatch[1]);

  return {
    metadata: isObject(metadata) ? metadata : {},
    rawFrontmatter: frontmatterMatch[0],
    body: markdown.slice(frontmatterMatch[0].length),
  };
}

function serializeFrontmatter(metadata: Record<string, unknown>): string {
  if (Object.keys(metadata).length === 0) {
    return "";
  }

  return `---\n${stringify(metadata).trimEnd()}\n---`;
}

function getFrontmatterTitle(metadata: Record<string, unknown>): string | undefined {
  return typeof metadata.title === "string" ? metadata.title.trim() || undefined : undefined;
}

function getLeadingHeadingTitle(bodyMarkdown: string): string | undefined {
  const match = bodyMarkdown.match(LEADING_H1_PATTERN);
  return match?.[1]?.trim() || undefined;
}

function removeLeadingHeading(bodyMarkdown: string): string {
  const match = bodyMarkdown.match(LEADING_H1_PATTERN);

  if (!match || match.index !== 0) {
    return bodyMarkdown.trimStart();
  }

  return bodyMarkdown.slice(match[0].length).trimStart();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
