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
  it("bootstraps a plain folder into a git workspace", async () => {
    const workspacePath = await mkdtemp(path.join(os.tmpdir(), "mohio-bootstrap-"));
    tempDirectories.push(workspacePath);
    await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n", "utf8");

    const service = createGitCollaborationService();
    const status = await service.bootstrapWorkspace(workspacePath);

    expect(status.gitAvailable).toBe(true);
    expect(status.isRepository).toBe(true);
  });

  it("does not create risky commits automatically", async () => {
    const workspacePath = await createWorkspace("history");
    const service = createGitCollaborationService();

    await writeFile(path.join(workspacePath, "README.md"), "# Title\n\nline1\nline2\nline3\n", "utf8");

    const committed = await service.recordRiskyCommit(workspacePath, {
      trigger: "idle-burst",
    });

    expect(committed).toBe(false);

    const commits = await service.listCommitHistory(workspacePath, "README.md");
    expect(commits.length).toBe(1);
    expect(commits[0]?.subject).toBe("initial");
  });

  it("does not create non-risk auto-save commits", async () => {
    const workspacePath = await createWorkspace("autosave");
    const service = createGitCollaborationService();

    const firstCommit = await service.recordAutoSaveCommit(workspacePath);
    expect(firstCommit).toBe(false);

    await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n\nchanged\n", "utf8");
    const secondCommit = await service.recordAutoSaveCommit(workspacePath);
    expect(secondCommit).toBe(false);

    const commits = await service.listCommitHistory(workspacePath, "README.md");
    expect(commits[0]?.subject).toBe("initial");
  });

  it("uses ISO date-time in snapshot messages for manual sync commits", async () => {
    const workspacePath = await createWorkspace("repeat-edits");
    const service = createGitCollaborationService();

    await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n\nfirst change\n", "utf8");
    await service.syncWorkspaceChanges(workspacePath);

    const commits = await service.listCommitHistory(workspacePath, "README.md");
    const snapshotSubjects = commits
      .map((entry) => entry.subject)
      .filter((subject) => /^Snapshot:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(subject));

    expect(snapshotSubjects.length).toBeGreaterThanOrEqual(1);
  }, 15000);

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

    runGit(remotePath, ["init", "--bare"]);
    runGit(repoA, ["remote", "add", "origin", remotePath]);
    runGit(repoA, ["push", "-u", "origin", "master"]);

    const repoB = await mkdtemp(path.join(os.tmpdir(), "mohio-sync-b-"));
    tempDirectories.push(repoB);
    execFileSync("git", ["clone", remotePath, "."], { cwd: repoB, encoding: "utf8" });
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

    expect(syncState.status).toBe("local-changes");
    expect(syncState.message).toContain("Merge conflict");

    const resolvedState = await service.resolveSyncConflict(repoA, {
      relativePath: "README.md",
      resolution: "keep-local",
    });

    expect(resolvedState.status).toBe("synced");
  }, 15000);

  it("returns connect-required sync result when no remote is configured", async () => {
    const workspacePath = await createWorkspace("sync-connect-required");
    const service = createGitCollaborationService();

    await writeFile(path.join(workspacePath, "README.md"), "# Mohio\n\nchange\n", "utf8");
    const result = await service.syncWorkspaceChanges(workspacePath);

    expect(result.requiresRemoteConnect).toBe(true);
    expect(result.remoteConnected).toBe(false);
    expect(result.requiresIdentitySetup).toBe(false);
    expect(result.requiresGitInstall).toBe(false);
  });

  it("returns identity-required sync result when local identity is missing", async () => {
    const workspacePath = await createWorkspace("sync-identity-required");
    runGit(workspacePath, ["config", "--local", "--unset", "user.name"]);
    runGit(workspacePath, ["config", "--local", "--unset", "user.email"]);
    const previousGlobalConfig = process.env.GIT_CONFIG_GLOBAL;
    const emptyGlobalConfigPath = path.join(workspacePath, "empty-global.gitconfig");
    await writeFile(emptyGlobalConfigPath, "", "utf8");
    process.env.GIT_CONFIG_GLOBAL = emptyGlobalConfigPath;

    try {
      const service = createGitCollaborationService();
      const status = await service.getWorkspaceStatus(workspacePath);

      expect(status.requiresIdentitySetup).toBe(true);

      const result = await service.syncWorkspaceChanges(workspacePath);
      expect(result.requiresIdentitySetup).toBe(true);
      expect(result.requiresRemoteConnect).toBe(false);
    } finally {
      if (typeof previousGlobalConfig === "string") {
        process.env.GIT_CONFIG_GLOBAL = previousGlobalConfig;
      } else {
        delete process.env.GIT_CONFIG_GLOBAL;
      }
    }
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
