import { promises as fs } from "node:fs";
import path from "node:path";
import { parseMarkdownDocument } from "@shared/document-format";
import type {
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
