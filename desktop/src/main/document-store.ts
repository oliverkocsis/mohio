import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildMarkdownDocument,
  getRenamedRelativePath,
  parseMarkdownDocument,
  sanitizeFileSystemTitle,
  stripMarkdownExtension,
} from "@shared/document-format";
import type {
  CreateDocumentInput,
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
    titleMode: parsedDocument.titleMode,
    frontmatterTitle: parsedDocument.frontmatterTitle,
  };
}

export async function saveDocument(
  workspacePath: string,
  input: SaveDocumentInput,
): Promise<SaveDocumentResult> {
  const currentAbsolutePath = resolveWorkspacePath(workspacePath, input.relativePath);
  const existingMarkdown = await fs.readFile(currentAbsolutePath, "utf8");
  const { bodyMarkdown, markdown } = buildMarkdownDocument({
    bodyMarkdown: input.markdown,
    existingMarkdown,
    title: input.title,
    titleMode: input.titleMode,
  });
  const extension = path.extname(input.relativePath) || ".md";
  const { sanitizedTitle } = sanitizeFileSystemTitle(input.title);
  const desiredRelativePath = getRenamedRelativePath({
    extension,
    relativePath: input.relativePath,
    sanitizedTitle,
  });
  const nextRelativePath = await allocateUniqueRelativePath({
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
    displayTitle: input.titleMode === "h1-linked"
      ? input.title.trim() || "Untitled"
      : stripMarkdownExtension(path.basename(nextRelativePath)) || "Untitled",
    markdown: bodyMarkdown,
    titleMode: input.titleMode,
    savedAt: new Date().toISOString(),
  };
}

export async function createDocument(
  workspacePath: string,
  input: CreateDocumentInput,
): Promise<WorkspaceDocument> {
  const absoluteDirectoryPath = resolveWorkspacePath(
    workspacePath,
    input.directoryRelativePath ?? ".",
  );
  const directoryStats = await fs.stat(absoluteDirectoryPath);

  if (!directoryStats.isDirectory()) {
    throw new Error("Mohio could not create a document in that location.");
  }

  const desiredRelativePath = path.join(input.directoryRelativePath ?? "", "Untitled.md");
  const nextRelativePath = await allocateUniqueRelativePath({
    currentRelativePath: null,
    desiredRelativePath,
    workspacePath,
  });
  const nextAbsolutePath = resolveWorkspacePath(workspacePath, nextRelativePath);
  const markdown = "# Untitled\n";

  await fs.writeFile(nextAbsolutePath, markdown, "utf8");

  return readDocument(workspacePath, nextRelativePath);
}

export async function deleteDocument(
  workspacePath: string,
  relativePath: string,
): Promise<void> {
  const absolutePath = resolveWorkspacePath(workspacePath, relativePath);
  const documentStats = await fs.stat(absolutePath);

  if (!documentStats.isFile()) {
    throw new Error("Mohio can only delete files.");
  }

  await fs.rm(absolutePath);
}

async function allocateUniqueRelativePath({
  currentRelativePath,
  desiredRelativePath,
  workspacePath,
}: {
  currentRelativePath: string | null;
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
