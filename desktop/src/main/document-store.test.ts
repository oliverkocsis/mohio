// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createDocument,
  deleteDocument,
  readDocument,
  saveDocument,
} from "./document-store";

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
      displayTitle: "Roadmap",
      markdown: "# Roadmap; FY26\n\nBody copy.\n",
      titleMode: "filename-linked",
      frontmatterTitle: "Roadmap; FY26",
    });
  });

  it("creates Untitled markdown documents in the workspace root", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    const createdDocument = await createDocument(workspacePath, {
      directoryRelativePath: null,
    });

    expect(createdDocument).toEqual({
      relativePath: "Untitled.md",
      fileName: "Untitled.md",
      displayTitle: "Untitled",
      markdown: "",
      titleMode: "h1-linked",
      frontmatterTitle: undefined,
    });
    await expect(readFile(path.join(workspacePath, "Untitled.md"), "utf8")).resolves.toBe("# Untitled\n");
  });

  it("creates documents in the selected directory and appends numeric suffixes on collisions", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);
    await mkdir(path.join(workspacePath, "docs"), { recursive: true });
    await writeFile(path.join(workspacePath, "docs", "Untitled.md"), "# Existing\n");

    const createdDocument = await createDocument(workspacePath, {
      directoryRelativePath: "docs",
    });

    expect(createdDocument.relativePath).toBe(path.join("docs", "Untitled 1.md"));
    await expect(readFile(path.join(workspacePath, createdDocument.relativePath), "utf8")).resolves.toBe("# Untitled\n");
  });

  it("saves content updates without renaming when the title is filesystem-safe", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await writeFile(path.join(workspacePath, "Work Life Balance.md"), "# Work Life Balance\n\nOld body.\n");

    const result = await saveDocument(workspacePath, {
      relativePath: "Work Life Balance.md",
      title: "Work Life Balance",
      markdown: "New body.",
      titleMode: "h1-linked",
    });

    expect(result.relativePath).toBe("Work Life Balance.md");
    expect(result.titleMode).toBe("h1-linked");

    await expect(readFile(path.join(workspacePath, "Work Life Balance.md"), "utf8")).resolves.toBe(
      "# Work Life Balance\n\nNew body.\n",
    );
  });

  it("saves filename-linked titles by renaming files without rewriting leading H1 text", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);
    await writeFile(path.join(workspacePath, "Roadmap.md"), "# Product Vision\n\nBody.\n");

    const result = await saveDocument(workspacePath, {
      relativePath: "Roadmap.md",
      title: "Quarterly Plan",
      markdown: "# Product Vision\n\nBody.\n",
      titleMode: "filename-linked",
    });

    expect(result.relativePath).toBe("Quarterly Plan.md");
    expect(result.displayTitle).toBe("Quarterly Plan");
    expect(result.titleMode).toBe("filename-linked");
    await expect(readFile(path.join(workspacePath, "Quarterly Plan.md"), "utf8")).resolves.toBe(
      "# Product Vision\n\nBody.\n",
    );
  });

  it("renames files and adds postfixes only on collision in h1-linked mode", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await mkdir(path.join(workspacePath, "docs"), { recursive: true });
    await writeFile(path.join(workspacePath, "docs", "Project Review Q2.md"), "# Existing\n");
    await writeFile(path.join(workspacePath, "docs", "Draft.md"), "# Draft\n\nBody.\n");

    const result = await saveDocument(workspacePath, {
      relativePath: path.join("docs", "Draft.md"),
      title: "Project Review; Q2",
      markdown: "Updated body.",
      titleMode: "h1-linked",
    });

    expect(result.relativePath).toBe(path.join("docs", "Project Review Q2 1.md"));
    expect(result.displayTitle).toBe("Project Review; Q2");
    expect(result.titleMode).toBe("h1-linked");
    await expect(readFile(path.join(workspacePath, result.relativePath), "utf8")).resolves.toBe(
      "# Project Review; Q2\n\nUpdated body.\n",
    );
  });

  it("rejects document access outside the active workspace", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await expect(readDocument(workspacePath, "../outside.md")).rejects.toThrow(
      "Mohio blocked access outside the active workspace.",
    );
  });

  it("rejects document creation outside the active workspace", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await expect(createDocument(workspacePath, {
      directoryRelativePath: "../outside",
    })).rejects.toThrow("Mohio blocked access outside the active workspace.");
  });

  it("deletes an existing markdown file", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);
    const relativePath = "Delete Me.md";
    const absolutePath = path.join(workspacePath, relativePath);
    await writeFile(absolutePath, "# Delete Me\n");

    await deleteDocument(workspacePath, relativePath);

    await expect(readFile(absolutePath, "utf8")).rejects.toThrow();
  });

  it("rejects deletion outside the active workspace", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-document-"));
    tempDirectories.push(workspacePath);

    await expect(deleteDocument(workspacePath, "../outside.md")).rejects.toThrow(
      "Mohio blocked access outside the active workspace.",
    );
  });
});
