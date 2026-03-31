import { promises as fs } from "node:fs";
import path from "node:path";
import { parseMarkdownDocument } from "@shared/document-format";
import type {
  RelatedDocument,
  RelatedDocumentType,
  WorkspaceDocumentNode,
  WorkspaceSearchMatch,
  WorkspaceSummary,
  WorkspaceTreeNode,
} from "@shared/mohio-types";

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdx"] as const;
const MARKDOWN_EXTENSION_SET = new Set<string>(MARKDOWN_EXTENSIONS);
const IGNORED_DIRECTORY_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);
interface WorkspaceDocumentRecord {
  bodyMarkdown: string;
  displayTitle: string;
  relativePath: string;
}

export async function getWorkspaceSummary(workspacePath: string): Promise<WorkspaceSummary> {
  const documents = await readWorkspaceNodes(workspacePath, workspacePath);

  return {
    name: path.basename(workspacePath),
    path: workspacePath,
    documents,
    documentCount: countDocuments(documents),
  };
}

async function readWorkspaceNodes(
  rootPath: string,
  currentPath: string,
): Promise<WorkspaceTreeNode[]> {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const nodes: WorkspaceTreeNode[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = path.relative(rootPath, absolutePath);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORY_NAMES.has(entry.name)) {
        continue;
      }

      const children = await readWorkspaceNodes(rootPath, absolutePath);

      if (children.length > 0) {
        nodes.push({
          id: relativePath,
          kind: "directory",
          name: entry.name,
          relativePath,
          children,
        });
      }

      continue;
    }

    if (!entry.isFile() || !isMarkdownDocument(entry.name)) {
      continue;
    }

    const markdown = await fs.readFile(absolutePath, "utf8");
    const parsedDocument = parseMarkdownDocument(markdown, entry.name);

    nodes.push({
      id: relativePath,
      kind: "document",
      name: entry.name,
      relativePath,
      displayTitle: parsedDocument.displayTitle,
    });
  }

  return nodes.sort(compareWorkspaceNodes);
}

function compareWorkspaceNodes(left: WorkspaceTreeNode, right: WorkspaceTreeNode): number {
  if (left.kind !== right.kind) {
    return left.kind === "directory" ? -1 : 1;
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

function countDocuments(nodes: WorkspaceTreeNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.kind === "document") {
      return count + 1;
    }

    return count + countDocuments(node.children);
  }, 0);
}

function isMarkdownDocument(fileName: string): boolean {
  return MARKDOWN_EXTENSION_SET.has(path.extname(fileName).toLowerCase());
}

export async function searchWorkspace(
  workspacePath: string,
  query: string,
): Promise<WorkspaceSearchMatch[]> {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const records = await readWorkspaceDocumentRecords(workspacePath);
  const matches: Array<WorkspaceSearchMatch & { score: number }> = [];

  for (const record of records) {
    const titleMatches = record.displayTitle.toLowerCase().includes(normalizedQuery);
    const pathMatches = record.relativePath.toLowerCase().includes(normalizedQuery);
    const contentIndex = record.bodyMarkdown.toLowerCase().indexOf(normalizedQuery);
    const contentMatches = contentIndex >= 0;

    if (!titleMatches && !pathMatches && !contentMatches) {
      continue;
    }

    const matchType = titleMatches
      ? "title"
      : pathMatches
        ? "path"
        : "content";
    const snippet = contentMatches
      ? buildContentSnippet(record.bodyMarkdown, contentIndex, normalizedQuery.length)
      : null;
    const score = matchType === "title"
      ? 300
      : matchType === "path"
        ? 200
        : 100;

    matches.push({
      relativePath: record.relativePath,
      displayTitle: record.displayTitle,
      matchType,
      snippet,
      score,
    });
  }

  return matches
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.relativePath.localeCompare(right.relativePath, undefined, {
        sensitivity: "base",
      });
    })
    .map(({ score: _score, ...match }) => match)
    .slice(0, 150);
}

export async function getRelatedDocuments(
  workspacePath: string,
  relativePath: string,
  recentRelativePaths: string[] = [],
): Promise<RelatedDocument[]> {
  const records = await readWorkspaceDocumentRecords(workspacePath);

  if (records.length === 0) {
    return [];
  }

  const byPath = new Map(records.map((record) => [record.relativePath, record]));

  if (!byPath.has(relativePath)) {
    return [];
  }

  const knownPaths = new Set(records.map((record) => toPosixPath(record.relativePath)));
  const displayTitlesByPath = new Map(
    records.map((record) => [toPosixPath(record.relativePath), record.displayTitle]),
  );
  const outgoingByPath = new Map<string, Set<string>>();

  for (const record of records) {
    const sourcePosixPath = toPosixPath(record.relativePath);
    const targets = new Set<string>();

    for (const rawTarget of extractInternalLinkTargets(record.bodyMarkdown)) {
      const resolvedTarget = resolveInternalTargetPath({
        rawTarget,
        sourceRelativePath: sourcePosixPath,
        knownPaths,
        displayTitlesByPath,
      });

      if (resolvedTarget && resolvedTarget !== sourcePosixPath) {
        targets.add(resolvedTarget);
      }
    }

    outgoingByPath.set(sourcePosixPath, targets);
  }

  const currentPath = toPosixPath(relativePath);
  const relatedByPath = new Map<string, { relationTypes: Set<RelatedDocumentType>; score: number }>();

  for (const outgoingPath of outgoingByPath.get(currentPath) ?? []) {
    addRelatedDocument({
      relatedByPath,
      relativePath: outgoingPath,
      relationType: "outgoing",
      score: 110,
    });
  }

  for (const [sourcePath, outgoingPaths] of outgoingByPath) {
    if (sourcePath === currentPath || !outgoingPaths.has(currentPath)) {
      continue;
    }

    addRelatedDocument({
      relatedByPath,
      relativePath: sourcePath,
      relationType: "backlink",
      score: 130,
    });
  }

  for (let index = 0; index < recentRelativePaths.length; index += 1) {
    const recentPath = toPosixPath(recentRelativePaths[index]);

    if (recentPath === currentPath || !knownPaths.has(recentPath)) {
      continue;
    }

    addRelatedDocument({
      relatedByPath,
      relativePath: recentPath,
      relationType: "recent",
      score: Math.max(15, 70 - index * 6),
    });
  }

  return Array.from(relatedByPath.entries())
    .map(([relatedPath, input]) => ({
      relativePath: relatedPath,
      displayTitle: displayTitlesByPath.get(relatedPath) ?? path.basename(relatedPath),
      relationTypes: Array.from(input.relationTypes).sort(compareRelationTypes),
      score: input.score,
    }))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.relativePath.localeCompare(right.relativePath, undefined, {
        sensitivity: "base",
      });
    })
    .slice(0, 30);
}

async function readWorkspaceDocumentRecords(
  workspacePath: string,
): Promise<WorkspaceDocumentRecord[]> {
  const summary = await getWorkspaceSummary(workspacePath);
  const documents = flattenDocumentNodes(summary.documents);
  const records: WorkspaceDocumentRecord[] = [];

  for (const document of documents) {
    const absolutePath = path.join(workspacePath, document.relativePath);
    const markdown = await fs.readFile(absolutePath, "utf8");
    const parsedDocument = parseMarkdownDocument(markdown, document.name);

    records.push({
      relativePath: document.relativePath,
      displayTitle: document.displayTitle,
      bodyMarkdown: parsedDocument.bodyMarkdown,
    });
  }

  return records;
}

function flattenDocumentNodes(nodes: WorkspaceTreeNode[]): WorkspaceDocumentNode[] {
  const documents: WorkspaceDocumentNode[] = [];

  for (const node of nodes) {
    if (node.kind === "document") {
      documents.push(node);
      continue;
    }

    documents.push(...flattenDocumentNodes(node.children));
  }

  return documents;
}

function buildContentSnippet(
  bodyMarkdown: string,
  matchIndex: number,
  queryLength: number,
): string {
  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(bodyMarkdown.length, matchIndex + queryLength + 60);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < bodyMarkdown.length ? "..." : "";
  const snippet = bodyMarkdown
    .slice(start, end)
    .replace(/\s+/gu, " ")
    .trim();

  return `${prefix}${snippet}${suffix}`;
}

function extractInternalLinkTargets(markdown: string): string[] {
  const targets: string[] = [];
  const markdownLinkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/gu;
  const wikiLinkPattern = /\[\[([^[\]]+)\]\]/gu;

  for (const match of markdown.matchAll(markdownLinkPattern)) {
    const target = match[1]?.trim();

    if (target) {
      targets.push(target);
    }
  }

  for (const match of markdown.matchAll(wikiLinkPattern)) {
    const rawWikiContent = match[1]?.trim();

    if (!rawWikiContent) {
      continue;
    }

    const [target] = rawWikiContent.split("|", 1);

    if (target?.trim()) {
      targets.push(target.trim());
    }
  }

  return targets;
}

function resolveInternalTargetPath({
  rawTarget,
  sourceRelativePath,
  knownPaths,
  displayTitlesByPath,
}: {
  rawTarget: string;
  sourceRelativePath: string;
  knownPaths: Set<string>;
  displayTitlesByPath: Map<string, string>;
}): string | null {
  if (!rawTarget.trim()) {
    return null;
  }

  const hashIndex = rawTarget.indexOf("#");
  const rawPathPart = hashIndex >= 0 ? rawTarget.slice(0, hashIndex) : rawTarget;

  if (
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(rawPathPart) ||
    rawPathPart.startsWith("mailto:")
  ) {
    return null;
  }

  if (!rawPathPart || rawPathPart === ".") {
    return sourceRelativePath;
  }

  const decodedPath = decodePath(rawPathPart);
  const normalizedCandidate = normalizeLinkPath(decodedPath, sourceRelativePath);
  const directMatch = resolveKnownPath(normalizedCandidate, knownPaths);

  if (directMatch) {
    return directMatch;
  }

  if (!path.posix.extname(normalizedCandidate)) {
    const normalizedLabel = path.posix.basename(normalizedCandidate).toLowerCase();
    const titleMatches = Array.from(displayTitlesByPath.entries())
      .filter((entry) => entry[1].toLowerCase() === normalizedLabel)
      .map((entry) => entry[0]);

    if (titleMatches.length === 1) {
      return titleMatches[0];
    }
  }

  return null;
}

function normalizeLinkPath(targetPath: string, sourceRelativePath: string): string {
  const normalizedTarget = targetPath.replace(/\\/gu, "/").trim();

  if (normalizedTarget.startsWith("/")) {
    return path.posix.normalize(normalizedTarget.slice(1));
  }

  return path.posix.normalize(
    path.posix.join(path.posix.dirname(sourceRelativePath), normalizedTarget),
  );
}

function resolveKnownPath(candidate: string, knownPaths: Set<string>): string | null {
  if (knownPaths.has(candidate)) {
    return candidate;
  }

  if (!path.posix.extname(candidate)) {
    for (const extension of MARKDOWN_EXTENSIONS) {
      const withExtension = `${candidate}${extension}`;

      if (knownPaths.has(withExtension)) {
        return withExtension;
      }
    }
  }

  const lowerCandidate = candidate.toLowerCase();

  for (const knownPath of knownPaths) {
    if (knownPath.toLowerCase() === lowerCandidate) {
      return knownPath;
    }
  }

  return null;
}

function decodePath(rawPath: string): string {
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function toPosixPath(relativePath: string): string {
  return relativePath.replace(/\\/gu, "/");
}

function addRelatedDocument({
  relatedByPath,
  relativePath,
  relationType,
  score,
}: {
  relatedByPath: Map<string, { relationTypes: Set<RelatedDocumentType>; score: number }>;
  relativePath: string;
  relationType: RelatedDocumentType;
  score: number;
}) {
  const existingItem = relatedByPath.get(relativePath);

  if (existingItem) {
    existingItem.relationTypes.add(relationType);
    existingItem.score += score;
    return;
  }

  relatedByPath.set(relativePath, {
    relationTypes: new Set([relationType]),
    score,
  });
}

function compareRelationTypes(left: RelatedDocumentType, right: RelatedDocumentType): number {
  const relationOrder: Record<RelatedDocumentType, number> = {
    backlink: 0,
    outgoing: 1,
    recent: 2,
  };

  return relationOrder[left] - relationOrder[right];
}
