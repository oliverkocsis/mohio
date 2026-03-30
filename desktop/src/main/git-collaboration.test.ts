// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { createGitCollaborationService } from "./git-collaboration";
import type { WorkspaceTreeNode } from "@shared/mohio-types";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("git-collaboration", () => {
  it("creates risky commits and lists commit history with stats", async () => {
    const workspacePath = await createWorkspace("history");
    const service = createGitCollaborationService();

    await writeFile(path.join(workspacePath, "README.md"), "# Title\n\nline1\nline2\nline3\n", "utf8");

    const committed = await service.recordRiskyCommit(workspacePath, {
      trigger: "idle-burst",
    });

    expect(committed).toBe(true);

    const commits = await service.listCommitHistory(workspacePath, "README.md");
    expect(commits.length).toBeGreaterThan(0);
    expect(commits[0]?.subject).toBe("checkpoint");
    expect(commits[0]?.shortStat).toContain("file changed");
  });

  it("creates non-risk auto-save commits only when markdown content changed", async () => {
    const workspacePath = await createWorkspace("autosave");
    const service = createGitCollaborationService();

    const firstCommit = await service.recordAutoSaveCommit(workspacePath);
    expect(firstCommit).toBe(false);

    await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n\nchanged\n", "utf8");
    const secondCommit = await service.recordAutoSaveCommit(workspacePath);
    expect(secondCommit).toBe(true);

    const commits = await service.listCommitHistory(workspacePath, "README.md");
    expect(commits[0]?.subject).toBe("auto-save");
  });

  it("reports publish states as published, unpublished changes, and never published", async () => {
    const workspacePath = await createWorkspace("publish");
    const remotePath = await mkdtemp(path.join(os.tmpdir(), "mohio-remote-"));
    tempDirectories.push(remotePath);

    runGit(workspacePath, ["init", "--bare", remotePath], workspacePath);
    runGit(workspacePath, ["remote", "add", "origin", remotePath]);
    runGit(workspacePath, ["branch", "-M", "main"]);
    runGit(workspacePath, ["push", "-u", "origin", "main"]);

    await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n\nupdated draft copy\n", "utf8");
    await writeFile(path.join(workspacePath, "Never.md"), "# Never\n", "utf8");

    const tree: WorkspaceTreeNode[] = [
      {
        id: "README.md",
        kind: "document",
        name: "README.md",
        relativePath: "README.md",
        displayTitle: "README",
      },
      {
        id: "Never.md",
        kind: "document",
        name: "Never.md",
        relativePath: "Never.md",
        displayTitle: "Never",
      },
    ];

    const service = createGitCollaborationService();
    const summary = await service.getPublishSummary(workspacePath, tree);

    const published = summary.documents.find((entry) => entry.relativePath === "README.md");
    const never = summary.documents.find((entry) => entry.relativePath === "Never.md");

    expect(published?.state).toBe("unpublished-changes");
    expect(never?.state).toBe("never-published");
    expect(summary.unpublishedCount).toBe(2);
  });

  it("detects and resolves incoming merge conflicts", async () => {
    const repoA = await createWorkspace("sync-a");
    const remotePath = await mkdtemp(path.join(os.tmpdir(), "mohio-sync-remote-"));
    tempDirectories.push(remotePath);

    runGit(repoA, ["init", "--bare", remotePath], repoA);
    runGit(repoA, ["remote", "add", "origin", remotePath]);
    runGit(repoA, ["branch", "-M", "main"]);
    runGit(repoA, ["push", "-u", "origin", "main"]);

    const repoB = await mkdtemp(path.join(os.tmpdir(), "mohio-sync-b-"));
    tempDirectories.push(repoB);
    runGit(repoA, ["clone", remotePath, repoB], repoA);
    runGit(repoB, ["config", "user.name", "Mohio Test"]);
    runGit(repoB, ["config", "user.email", "mohio@example.com"]);

    await writeFile(path.join(repoA, "README.md"), "# Mohio\n\nlocal change\n", "utf8");
    runGit(repoA, ["add", "README.md"]);
    runGit(repoA, ["commit", "-m", "local update"]);

    await writeFile(path.join(repoB, "README.md"), "# Mohio\n\nincoming change\n", "utf8");
    runGit(repoB, ["add", "README.md"]);
    runGit(repoB, ["commit", "-m", "incoming update"]);
    runGit(repoB, ["push"]);

    const service = createGitCollaborationService();
    const syncState = await service.syncIncomingChanges(repoA, "test");

    expect(syncState.status).toBe("conflict");
    expect(syncState.conflicts.length).toBeGreaterThan(0);

    const resolvedState = await service.resolveSyncConflict(repoA, {
      relativePath: "README.md",
      resolution: "keep-local",
    });

    expect(resolvedState.status).toBe("idle");
  });
});

async function createWorkspace(prefix: string): Promise<string> {
  const workspacePath = await mkdtemp(path.join(os.tmpdir(), `mohio-${prefix}-`));
  tempDirectories.push(workspacePath);

  runGit(workspacePath, ["init"]);
  runGit(workspacePath, ["config", "user.name", "Mohio Test"]);
  runGit(workspacePath, ["config", "user.email", "mohio@example.com"]);

  await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n\ninitial\n", "utf8");
  runGit(workspacePath, ["add", "README.md"]);
  runGit(workspacePath, ["commit", "-m", "initial"]);

  return workspacePath;
}

function runGit(cwd: string, args: string[], commandCwd?: string): string {
  return execFileSync("git", args, {
    cwd: commandCwd ?? cwd,
    encoding: "utf8",
  }).trim();
}
