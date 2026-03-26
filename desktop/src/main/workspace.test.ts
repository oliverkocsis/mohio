// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getWorkspaceSummary } from "./workspace";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("getWorkspaceSummary", () => {
  it("lists markdown documents in a folder tree and ignores dependency directories", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-workspace-"));
    tempDirectories.push(workspacePath);

    await writeFile(path.join(workspacePath, "README.md"), "# Workspace");
    await writeFile(path.join(workspacePath, "notes.MD"), "---\ntitle: Notes; Archive\n---\n# Notes\n");
    await writeFile(path.join(workspacePath, "draft.txt"), "ignore me");

    await mkdir(path.join(workspacePath, "docs", "nested"), { recursive: true });
    await writeFile(path.join(workspacePath, "docs", "Guide.markdown"), "# Guide");
    await writeFile(path.join(workspacePath, "docs", "nested", "Plan.mdx"), "# Plan");

    await mkdir(path.join(workspacePath, "node_modules", "pkg"), { recursive: true });
    await writeFile(path.join(workspacePath, "node_modules", "pkg", "README.md"), "# Ignore");

    const summary = await getWorkspaceSummary(workspacePath);

    expect(summary.name).toBe(path.basename(workspacePath));
    expect(summary.documentCount).toBe(4);
    expect(summary.documents).toEqual([
      {
        id: "docs",
        kind: "directory",
        name: "docs",
        relativePath: "docs",
        children: [
          {
            id: path.join("docs", "nested"),
            kind: "directory",
            name: "nested",
            relativePath: path.join("docs", "nested"),
            children: [
              {
                id: path.join("docs", "nested", "Plan.mdx"),
                kind: "document",
                name: "Plan.mdx",
                relativePath: path.join("docs", "nested", "Plan.mdx"),
                displayTitle: "Plan",
              },
            ],
          },
          {
            id: path.join("docs", "Guide.markdown"),
            kind: "document",
            name: "Guide.markdown",
            relativePath: path.join("docs", "Guide.markdown"),
            displayTitle: "Guide",
          },
        ],
      },
      {
        id: "notes.MD",
        kind: "document",
        name: "notes.MD",
        relativePath: "notes.MD",
        displayTitle: "Notes",
      },
      {
        id: "README.md",
        kind: "document",
        name: "README.md",
        relativePath: "README.md",
        displayTitle: "README",
      },
    ]);
  });
});
