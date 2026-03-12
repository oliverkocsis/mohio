import type { SearchResult, Workspace } from "../types";

export function normalizeMarkdownPath(path: string): string {
  const segments: string[] = [];

  for (const segment of path.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return segments.join("/");
}

export function resolveRelativeMarkdownPath(fromPath: string, relativePath: string): string | null {
  const trimmed = relativePath.trim();
  if (!trimmed.endsWith(".md")) {
    return null;
  }

  if (!trimmed.startsWith("./") && !trimmed.startsWith("../")) {
    return normalizeMarkdownPath(trimmed);
  }

  const fromSegments = normalizeMarkdownPath(fromPath).split("/");
  fromSegments.pop();
  return normalizeMarkdownPath([...fromSegments, trimmed].join("/"));
}

export function ensureMarkdownTitle(title: string): string {
  const cleaned = title.trim() || "Untitled note";
  return cleaned.toLowerCase().endsWith(".md") ? cleaned : `${cleaned}.md`;
}

export function buildPathFromTitle(currentPath: string | null, title: string): string {
  const nextTitle = ensureMarkdownTitle(title);
  const directory = currentPath?.includes("/") ? currentPath.split("/").slice(0, -1).join("/") : "notes";
  return `${directory}/${slugify(nextTitle.replace(/\.md$/i, ""))}.md`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "untitled-note";
}

export function searchWorkspace(workspace: Workspace, query: string): {
  filenameMatches: SearchResult[];
  contentMatches: SearchResult[];
} {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return { filenameMatches: [], contentMatches: [] };
  }

  const filenameMatches: SearchResult[] = [];
  const contentMatches: SearchResult[] = [];

  for (const file of workspace.files) {
    const titleHit = file.title.toLowerCase().includes(needle) || file.path.toLowerCase().includes(needle);
    const contentIndex = file.content.toLowerCase().indexOf(needle);

    if (titleHit) {
      filenameMatches.push({
        id: `${file.id}-filename`,
        fileId: file.id,
        kind: "filename",
        title: file.title,
        path: file.path,
        excerpt: file.path,
      });
    }

    if (contentIndex >= 0) {
      contentMatches.push({
        id: `${file.id}-content-${contentIndex}`,
        fileId: file.id,
        kind: "content",
        title: file.title,
        path: file.path,
        excerpt: excerptAround(file.content, contentIndex, needle.length),
      });
    }
  }

  return { filenameMatches, contentMatches };
}

function excerptAround(content: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + length + 60);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return `${prefix}${content.slice(start, end).replace(/\n+/g, " ")}${suffix}`;
}
