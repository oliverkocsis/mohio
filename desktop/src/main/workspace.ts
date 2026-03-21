import { promises as fs } from "node:fs";
import path from "node:path";
import { parseMarkdownDocument } from "@shared/document-format";
import type { WorkspaceSummary, WorkspaceTreeNode } from "@shared/mohio-types";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);
const IGNORED_DIRECTORY_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
]);

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
  return MARKDOWN_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}
