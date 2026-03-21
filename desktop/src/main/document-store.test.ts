// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readDocument, saveDocument } from "./document-store";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("document-store", () => {
  it("reads an existing markdown document into editor fields", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await writeFile(
      path.join(workspacePath, "Roadmap.md"),
      "---\ntitle: Roadmap; FY26\n---\n# Roadmap; FY26\n\nBody copy.\n",
    );

    await expect(readDocument(workspacePath, "Roadmap.md")).resolves.toEqual({
      relativePath: "Roadmap.md",
      fileName: "Roadmap.md",
      displayTitle: "Roadmap; FY26",
      markdown: "Body copy.\n",
      frontmatterTitle: "Roadmap; FY26",
    });
  });

  it("saves content updates without renaming when the title is filesystem-safe", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await writeFile(path.join(workspacePath, "Work Life Balance.md"), "# Work Life Balance\n\nOld body.\n");

    const result = await saveDocument(workspacePath, {
      relativePath: "Work Life Balance.md",
      title: "Work Life Balance",
      markdown: "New body.",
    });

    expect(result.relativePath).toBe("Work Life Balance.md");

    await expect(readFile(path.join(workspacePath, "Work Life Balance.md"), "utf8")).resolves.toBe(
      "# Work Life Balance\n\nNew body.\n",
    );
  });

  it("renames files, preserves the original title in frontmatter when needed, and adds postfixes only on collision", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await mkdir(path.join(workspacePath, "docs"), { recursive: true });
    await writeFile(path.join(workspacePath, "docs", "Project Review Q2.md"), "# Existing\n");
    await writeFile(path.join(workspacePath, "docs", "Draft.md"), "# Draft\n\nBody.\n");

    const result = await saveDocument(workspacePath, {
      relativePath: path.join("docs", "Draft.md"),
      title: "Project Review; Q2",
      markdown: "Updated body.",
    });

    expect(result.relativePath).toBe(path.join("docs", "Project Review Q2 1.md"));
    await expect(readFile(path.join(workspacePath, result.relativePath), "utf8")).resolves.toBe(
      "---\ntitle: Project Review; Q2\n---\n# Project Review; Q2\n\nUpdated body.\n",
    );
  });

  it("rejects document access outside the active workspace", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await expect(readDocument(workspacePath, "../outside.md")).rejects.toThrow(
      "Mohio blocked access outside the active workspace.",
    );
  });
});
