import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildMarkdownDocument,
  getRenamedRelativePath,
  parseMarkdownDocument,
  sanitizeFileSystemTitle,
} from "@shared/document-format";
import type {
  SaveDocumentInput,
  SaveDocumentResult,
  WorkspaceDocument,
} from "@shared/mohio-types";

export async function readDocument(
  workspacePath: string,
  relativePath: string,
): Promise<WorkspaceDocument> {
  const absolutePath = resolveWorkspacePath(workspacePath, relativePath);
  const markdown = await fs.readFile(absolutePath, "utf8");
  const parsedDocument = parseMarkdownDocument(markdown, path.basename(relativePath));

  return {
    relativePath,
    fileName: path.basename(relativePath),
    displayTitle: parsedDocument.displayTitle,
    markdown: parsedDocument.bodyMarkdown,
    frontmatterTitle: parsedDocument.frontmatterTitle,
  };
}

export async function saveDocument(
  workspacePath: string,
  input: SaveDocumentInput,
): Promise<SaveDocumentResult> {
  const currentAbsolutePath = resolveWorkspacePath(workspacePath, input.relativePath);
  const existingMarkdown = await fs.readFile(currentAbsolutePath, "utf8");
  const { markdown } = buildMarkdownDocument({
    bodyMarkdown: input.markdown,
    existingMarkdown,
    title: input.title,
  });
  const extension = path.extname(input.relativePath) || ".md";
  const { sanitizedTitle } = sanitizeFileSystemTitle(input.title);
  const desiredRelativePath = getRenamedRelativePath({
    extension,
    relativePath: input.relativePath,
    sanitizedTitle,
  });
  const nextRelativePath = await ensureAvailableRelativePath({
    currentRelativePath: input.relativePath,
    desiredRelativePath,
    workspacePath,
  });
  const nextAbsolutePath = resolveWorkspacePath(workspacePath, nextRelativePath);

  await fs.writeFile(nextAbsolutePath, markdown, "utf8");

  if (nextAbsolutePath !== currentAbsolutePath) {
    await fs.rm(currentAbsolutePath, { force: true });
  }

  return {
    relativePath: nextRelativePath,
    fileName: path.basename(nextRelativePath),
    displayTitle: input.title.trim() || "Untitled",
    markdown: input.markdown,
    savedAt: new Date().toISOString(),
  };
}

async function ensureAvailableRelativePath({
  currentRelativePath,
  desiredRelativePath,
  workspacePath,
}: {
  currentRelativePath: string;
  desiredRelativePath: string;
  workspacePath: string;
}): Promise<string> {
  if (desiredRelativePath === currentRelativePath) {
    return currentRelativePath;
  }

  const parsedDesiredPath = path.parse(desiredRelativePath);

  for (let index = 0; index < 10_000; index += 1) {
    const candidateBaseName = index === 0
      ? parsedDesiredPath.name
      : `${parsedDesiredPath.name} ${index}`;
    const candidateRelativePath = path.join(
      parsedDesiredPath.dir,
      `${candidateBaseName}${parsedDesiredPath.ext}`,
    );

    if (candidateRelativePath === currentRelativePath) {
      return currentRelativePath;
    }

    try {
      await fs.access(resolveWorkspacePath(workspacePath, candidateRelativePath));
    } catch {
      return candidateRelativePath;
    }
  }

  throw new Error("Mohio could not allocate a unique document name.");
}

export function resolveWorkspacePath(workspacePath: string, relativePath: string): string {
  const absoluteWorkspacePath = path.resolve(workspacePath);
  const absoluteDocumentPath = path.resolve(absoluteWorkspacePath, relativePath);

  if (
    absoluteDocumentPath !== absoluteWorkspacePath &&
    !absoluteDocumentPath.startsWith(`${absoluteWorkspacePath}${path.sep}`)
  ) {
    throw new Error("Mohio blocked access outside the active workspace.");
  }

  return absoluteDocumentPath;
}
