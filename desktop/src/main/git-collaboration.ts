import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { resolveWorkspacePath } from "./document-store";
import type {
  AutoSyncStatus,
  CommitHistoryEntry,
  DocumentPublishState,
  DocumentPublishStatus,
  PublishSummary,
  RecordRiskyCommitInput,
  ResolveConflictInput,
  SyncWorkspaceResult,
  SyncConflict,
  SyncState,
  UnpublishedDiffResult,
  WorkspaceTreeNode,
} from "@shared/mohio-types";

const execFileAsync = promisify(execFile);
const MARKDOWN_PATHS = ["*.md", "*.markdown", "*.mdx"];
const legacyCheckpointCleanupDone = new Set<string>();

const defaultSyncState: SyncState = {
  status: "idle",
  lastCheckedAt: null,
  lastAppliedAt: null,
  message: null,
  conflicts: [],
};

export function createGitCollaborationService() {
  const lastCommittedFingerprintByWorkspace = new Map<string, string>();
  const syncStateByWorkspace = new Map<string, SyncState>();

  const getSyncState = async (workspacePath: string): Promise<SyncState> => {
    await ensureGitWorkspace(workspacePath);
    return syncStateByWorkspace.get(workspacePath) ?? defaultSyncState;
  };

  const recordRiskyCommit = async (
    workspacePath: string,
    input: RecordRiskyCommitInput,
  ): Promise<boolean> => {
    await ensureGitWorkspace(workspacePath);
    return writeCommit(workspacePath, {
      force: input.force,
      minLineDelta: 0,
    });
  };

  const recordAutoSaveCommit = async (workspacePath: string): Promise<boolean> => {
    await ensureGitWorkspace(workspacePath);
    return writeCommit(workspacePath, {
      force: false,
      minLineDelta: 0,
    });
  };

  const listCommitHistory = async (
    workspacePath: string,
    relativePath: string | null,
  ): Promise<CommitHistoryEntry[]> => {
    await ensureGitWorkspace(workspacePath);
    const logArgs = [
      "log",
      "--date=iso-strict",
      "--pretty=format:%H%x1f%h%x1f%aI%x1f%an%x1f%s",
      "--shortstat",
      "-n",
      "100",
    ];

    if (relativePath) {
      logArgs.push("--", relativePath);
    }

    const logResult = await runGit(workspacePath, logArgs, { allowFailure: true });
    if (logResult.code !== 0 || !logResult.stdout.trim()) {
      return [];
    }

    const commits: CommitHistoryEntry[] = [];
    let currentEntry: CommitHistoryEntry | null = null;

    for (const line of logResult.stdout.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed) {
        if (currentEntry) {
          commits.push(currentEntry);
          currentEntry = null;
        }
        continue;
      }

      if (line.includes("\u001f")) {
        if (currentEntry) {
          commits.push(currentEntry);
        }

        const [sha, shortSha, authoredAt, authorName, subject] = line.split("\u001f");
        currentEntry = {
          sha,
          shortSha,
          authoredAt,
          authorName: authorName?.trim() ? authorName : "Unknown",
          subject,
          shortStat: null,
        };
        continue;
      }

      if (currentEntry && isShortStatLine(trimmed)) {
        currentEntry.shortStat = trimmed;
      }
    }

    if (currentEntry) {
      commits.push(currentEntry);
    }

    return commits;
  };

  const getUnpublishedDiff = async (
    workspacePath: string,
    relativePath: string,
  ): Promise<UnpublishedDiffResult> => {
    await ensureGitWorkspace(workspacePath);
    const upstream = await getUpstreamBranch(workspacePath);

    if (!upstream) {
      return {
        relativePath,
        hasRemoteVersion: false,
        patch: "",
        message: "No remote version is connected for this workspace branch yet.",
      };
    }

    const upstreamExists = await runGit(workspacePath, ["cat-file", "-e", `${upstream}:${relativePath}`], {
      allowFailure: true,
    });

    if (upstreamExists.code !== 0) {
      return {
        relativePath,
        hasRemoteVersion: false,
        patch: "",
        message: "This document does not exist in the remote branch yet.",
      };
    }

    const diffResult = await runGit(workspacePath, ["diff", upstream, "--", relativePath], {
      allowFailure: true,
    });

    return {
      relativePath,
      hasRemoteVersion: true,
      patch: diffResult.stdout,
      message: diffResult.stdout.trim().length === 0
        ? "No differences were found between remote and local versions."
        : null,
    };
  };

  const writeCommit = async (
    workspacePath: string,
    options: {
      force?: boolean;
      minLineDelta: number;
      syncBeforeCommit?: boolean;
      autoPush?: boolean;
    },
  ): Promise<boolean> => {
    if (options.syncBeforeCommit !== false) {
      const syncState = await syncIncomingChanges(workspacePath, "before-commit");
      if (syncState.status === "conflict" || syncState.status === "error") {
        return false;
      }
    }

    const material = await getMaterialChanges(workspacePath);
    if (!material.hasChanges) {
      return false;
    }

    const previousFingerprint = lastCommittedFingerprintByWorkspace.get(workspacePath);
    if (previousFingerprint && previousFingerprint === material.fingerprint) {
      return false;
    }

    if (!options.force && material.lineDelta < options.minLineDelta) {
      return false;
    }

    if (material.changedPaths.length === 0) {
      return false;
    }

    await runGit(workspacePath, ["add", "-A", "--", ...material.changedPaths]);
    const stagedResult = await runGit(
      workspacePath,
      ["diff", "--cached", "--name-only", "--", ...material.changedPaths],
      { allowFailure: true },
    );

    if (stagedResult.code !== 0 || !stagedResult.stdout.trim()) {
      return false;
    }

    await runGit(workspacePath, [
      "commit",
      "-m",
      createSnapshotCommitMessage(),
      "--only",
      "--",
      ...material.changedPaths,
    ]);
    lastCommittedFingerprintByWorkspace.set(workspacePath, material.fingerprint);

    if (options.autoPush !== false) {
      try {
        await pushWorkspace(workspacePath);
      } catch {
        // Keep commits durable even when sharing is temporarily unavailable.
      }
    }

    return true;
  };

  const getPublishSummary = async (
    workspacePath: string,
    workspaceDocuments: WorkspaceTreeNode[],
  ): Promise<PublishSummary> => {
    await ensureGitWorkspace(workspacePath);
    const markdownPaths = flattenDocumentRelativePaths(workspaceDocuments);
    const upstream = await getUpstreamBranch(workspacePath);
    const statuses = await Promise.all(
      markdownPaths.map(async (relativePath) => {
        return getDocumentPublishStatus(workspacePath, upstream, relativePath);
      }),
    );

    const statusByPath = new Map(statuses.map((status) => [status.relativePath, status]));
    const unpublishedCount = statuses.filter((status) => status.state !== "published").length;

    return {
      documents: statuses,
      unpublishedCount,
      unpublishedTree: filterUnpublishedWorkspaceTree(workspaceDocuments, statusByPath),
    };
  };

  const syncWorkspaceChanges = async (workspacePath: string): Promise<SyncWorkspaceResult> => {
    await ensureGitWorkspace(workspacePath);
    const committed = await writeCommit(workspacePath, {
      force: true,
      minLineDelta: 0,
      autoPush: false,
    });

    const pushed = await pushWorkspace(workspacePath);
    if (!pushed) {
      return {
        committed,
        commitSha: null,
        syncedAt: null,
        message: "No local commits were ready to sync.",
      };
    }

    const shaResult = await runGit(workspacePath, ["rev-parse", "HEAD"]);
    const syncedAt = new Date().toISOString();

    return {
      committed,
      commitSha: shaResult.stdout.trim(),
      syncedAt,
      message: "Synced your latest workspace snapshot.",
    };
  };

  const getAutoSyncStatus = async (workspacePath: string): Promise<AutoSyncStatus> => {
    await ensureGitWorkspace(workspacePath);
    const status = await runGit(workspacePath, ["status", "--porcelain", "--", ...MARKDOWN_PATHS], {
      allowFailure: true,
    });
    const hasUncommittedChanges = status.code === 0 && status.stdout.trim().length > 0;
    const upstream = await getUpstreamBranch(workspacePath);
    let lastSyncedAt: string | null = null;

    if (upstream) {
      const lastSyncedResult = await runGit(workspacePath, ["log", "-1", "--format=%cI", upstream], {
        allowFailure: true,
      });
      if (lastSyncedResult.code === 0) {
        lastSyncedAt = lastSyncedResult.stdout.trim() || null;
      }
    }

    return {
      enabled: true,
      hasUncommittedChanges,
      lastSyncedAt,
    };
  };

  const syncIncomingChanges = async (workspacePath: string, reason: string): Promise<SyncState> => {
    await ensureGitWorkspace(workspacePath);
    const checkedAt = new Date().toISOString();
    syncStateByWorkspace.set(workspacePath, {
      ...defaultSyncState,
      status: "checking",
      lastCheckedAt: checkedAt,
      message: `Checking for incoming updates (${reason})...`,
    });

    const upstream = await getUpstreamBranch(workspacePath);

    if (!upstream) {
      const state: SyncState = {
        ...defaultSyncState,
        status: "idle",
        lastCheckedAt: checkedAt,
        message: "No shared upstream is configured for this workspace branch yet.",
      };
      syncStateByWorkspace.set(workspacePath, state);
      return state;
    }

    await runGit(workspacePath, ["fetch"]);
    const aheadBehind = await runGit(workspacePath, ["rev-list", "--left-right", "--count", `HEAD...${upstream}`]);
    const [, behindRaw] = aheadBehind.stdout.trim().split(/\s+/);
    const behindCount = Number.parseInt(behindRaw ?? "0", 10);

    if (!Number.isFinite(behindCount) || behindCount === 0) {
      const state: SyncState = {
        ...defaultSyncState,
        status: "idle",
        lastCheckedAt: checkedAt,
        message: "Workspace is already up to date.",
      };
      syncStateByWorkspace.set(workspacePath, state);
      return state;
    }

    syncStateByWorkspace.set(workspacePath, {
      ...defaultSyncState,
      status: "syncing",
      lastCheckedAt: checkedAt,
      message: `Applying ${behindCount} incoming update${behindCount === 1 ? "" : "s"}.`,
    });

    await writeCommit(workspacePath, {
      force: true,
      minLineDelta: 0,
      syncBeforeCommit: false,
    });

    const mergeResult = await runGit(workspacePath, ["merge", "--no-ff", "--no-commit", upstream], {
      allowFailure: true,
    });

    if (mergeResult.code === 0) {
      await runGit(workspacePath, ["commit", "-m", createSnapshotCommitMessage()]);
      try {
        await pushWorkspace(workspacePath);
      } catch {
        // Keep merge application successful even if sharing fails right now.
      }
      const appliedAt = new Date().toISOString();
      const state: SyncState = {
        ...defaultSyncState,
        status: "idle",
        lastCheckedAt: checkedAt,
        lastAppliedAt: appliedAt,
        message: "Incoming updates were applied successfully.",
      };
      syncStateByWorkspace.set(workspacePath, state);
      return state;
    }

    const conflicts = await readMergeConflicts(workspacePath);
    if (conflicts.length > 0) {
      const state: SyncState = {
        ...defaultSyncState,
        status: "conflict",
        lastCheckedAt: checkedAt,
        message: "Mohio found overlapping incoming and local edits. Choose how to resolve each file.",
        conflicts,
      };
      syncStateByWorkspace.set(workspacePath, state);
      return state;
    }

    const state: SyncState = {
      ...defaultSyncState,
      status: "error",
      lastCheckedAt: checkedAt,
      message: mergeResult.stderr.trim() || "Mohio could not apply incoming updates.",
    };
    syncStateByWorkspace.set(workspacePath, state);
    return state;
  };

  const resolveSyncConflict = async (
    workspacePath: string,
    input: ResolveConflictInput,
  ): Promise<SyncState> => {
    await ensureGitWorkspace(workspacePath);

    if (input.resolution === "keep-local") {
      await runGit(workspacePath, ["checkout", "--ours", "--", input.relativePath]);
      await runGit(workspacePath, ["add", "--", input.relativePath]);
    } else if (input.resolution === "keep-incoming") {
      await runGit(workspacePath, ["checkout", "--theirs", "--", input.relativePath]);
      await runGit(workspacePath, ["add", "--", input.relativePath]);
    } else {
      if (typeof input.manualContent !== "string") {
        throw new Error("Manual conflict resolution requires edited content.");
      }

      const absolutePath = resolveWorkspacePath(workspacePath, input.relativePath);
      await fs.writeFile(absolutePath, input.manualContent, "utf8");
      await runGit(workspacePath, ["add", "--", input.relativePath]);
    }

    const remainingConflicts = await readMergeConflicts(workspacePath);
    if (remainingConflicts.length > 0) {
      const state: SyncState = {
        ...defaultSyncState,
        status: "conflict",
        lastCheckedAt: new Date().toISOString(),
        message: "Some conflicts still need your input.",
        conflicts: remainingConflicts,
      };
      syncStateByWorkspace.set(workspacePath, state);
      return state;
    }

    await runGit(workspacePath, ["commit", "-m", createSnapshotCommitMessage()]);
    try {
      await pushWorkspace(workspacePath);
    } catch {
      // Conflict resolution should complete even if sharing fails right now.
    }

    const resolvedState: SyncState = {
      ...defaultSyncState,
      status: "idle",
      lastCheckedAt: new Date().toISOString(),
      lastAppliedAt: new Date().toISOString(),
      message: "Incoming updates are now resolved and applied.",
    };
    syncStateByWorkspace.set(workspacePath, resolvedState);
    return resolvedState;
  };

  return {
    recordRiskyCommit,
    recordAutoSaveCommit,
    listCommitHistory,
    getUnpublishedDiff,
    getPublishSummary,
    syncWorkspaceChanges,
    getAutoSyncStatus,
    syncIncomingChanges,
    getSyncState,
    resolveSyncConflict,
  };
}

async function runGit(
  cwd: string,
  args: string[],
  options: { allowFailure?: boolean } = {},
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const result = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: 0,
    };
  } catch (error) {
    const executionError = error as {
      code?: number;
      stderr?: string;
      stdout?: string;
      message: string;
    };

    if (options.allowFailure) {
      return {
        stdout: executionError.stdout ?? "",
        stderr: executionError.stderr ?? executionError.message,
        code: Number.isInteger(executionError.code) ? Number(executionError.code) : 1,
      };
    }

    throw new Error(executionError.stderr?.trim() || executionError.message);
  }
}

async function ensureGitWorkspace(workspacePath: string): Promise<void> {
  const gitCheck = await runGit(workspacePath, ["rev-parse", "--is-inside-work-tree"], {
    allowFailure: true,
  });

  if (gitCheck.code !== 0 || gitCheck.stdout.trim() !== "true") {
    throw new Error("Mohio needs a valid Git workspace to use history, publish, and sync.");
  }

  if (legacyCheckpointCleanupDone.has(workspacePath)) {
    return;
  }

  await cleanupLegacyCheckpointArtifacts(workspacePath);
  legacyCheckpointCleanupDone.add(workspacePath);
}

async function getMaterialChanges(
  workspacePath: string,
): Promise<{ hasChanges: boolean; lineDelta: number; fingerprint: string; changedPaths: string[] }> {
  const status = await runGit(workspacePath, ["status", "--porcelain", "-z", "--", ...MARKDOWN_PATHS]);
  const fingerprint = status.stdout.trim();

  if (!fingerprint) {
    return {
      hasChanges: false,
      lineDelta: 0,
      fingerprint: "",
      changedPaths: [],
    };
  }

  const statusEntries = status.stdout
    .split("\0")
    .filter(Boolean);
  const changedPaths: string[] = [];

  for (let index = 0; index < statusEntries.length; index += 1) {
    const entry = statusEntries[index];
    if (!entry || entry.length < 4) {
      continue;
    }

    const statusCode = entry.slice(0, 2);
    const filePath = entry.slice(3);
    if (filePath) {
      changedPaths.push(filePath);
    }

    // In porcelain -z output, rename/copy entries include an extra NUL-separated source path.
    if (statusCode.includes("R") || statusCode.includes("C")) {
      index += 1;
    }
  }

  const diff = await runGit(workspacePath, ["diff", "--numstat", "HEAD", "--", ...MARKDOWN_PATHS]);
  const lineDelta = diff.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(/\s+/).slice(0, 2))
    .reduce((total, [added, deleted]) => {
      const addedValue = added === "-" ? 0 : Number.parseInt(added ?? "0", 10);
      const deletedValue = deleted === "-" ? 0 : Number.parseInt(deleted ?? "0", 10);
      return total + (Number.isFinite(addedValue) ? addedValue : 0) + (Number.isFinite(deletedValue) ? deletedValue : 0);
    }, 0);

  return {
    hasChanges: true,
    lineDelta,
    fingerprint,
    changedPaths: Array.from(new Set(changedPaths)),
  };
}

async function getAheadCommitCount(workspacePath: string, upstream: string): Promise<number> {
  const aheadBehind = await runGit(workspacePath, ["rev-list", "--left-right", "--count", `HEAD...${upstream}`]);
  const [aheadRaw] = aheadBehind.stdout.trim().split(/\s+/);
  const aheadCount = Number.parseInt(aheadRaw ?? "0", 10);
  return Number.isFinite(aheadCount) ? aheadCount : 0;
}

async function pushWorkspace(workspacePath: string): Promise<boolean> {
  const upstream = await getUpstreamBranch(workspacePath);
  if (upstream) {
    const aheadCount = await getAheadCommitCount(workspacePath, upstream);
    if (aheadCount === 0) {
      return false;
    }

    await runGit(workspacePath, ["push"]);
    return true;
  }

  const branchResult = await runGit(workspacePath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branchName = branchResult.stdout.trim();
  await runGit(workspacePath, ["push", "-u", "origin", branchName]);
  return true;
}

function createSnapshotCommitMessage(): string {
  const isoDate = new Date().toISOString().slice(0, 10);
  return `Snapshot: ${isoDate}`;
}

function isShortStatLine(line: string): boolean {
  return line.includes(" file changed")
    || line.includes(" files changed");
}

async function cleanupLegacyCheckpointArtifacts(workspacePath: string): Promise<void> {
  const refs = await runGit(
    workspacePath,
    ["for-each-ref", "--format=%(refname)", "refs/mohio/checkpoints"],
    { allowFailure: true },
  );
  const refNames = refs.stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const refName of refNames) {
    await runGit(workspacePath, ["update-ref", "-d", refName], { allowFailure: true });
  }

  await fs.rm(path.join(workspacePath, ".git", "mohio"), { recursive: true, force: true });
}

async function getUpstreamBranch(workspacePath: string): Promise<string | null> {
  const upstream = await runGit(
    workspacePath,
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    { allowFailure: true },
  );

  if (upstream.code !== 0) {
    return null;
  }

  return upstream.stdout.trim() || null;
}

async function getDocumentPublishStatus(
  workspacePath: string,
  upstream: string | null,
  relativePath: string,
): Promise<DocumentPublishStatus> {
  if (!upstream) {
    return {
      relativePath,
      state: "never-published",
      lastPublishedAt: null,
    };
  }

  const upstreamExists = await runGit(workspacePath, ["cat-file", "-e", `${upstream}:${relativePath}`], {
    allowFailure: true,
  });

  if (upstreamExists.code !== 0) {
    return {
      relativePath,
      state: "never-published",
      lastPublishedAt: null,
    };
  }

  const diffResult = await runGit(workspacePath, ["diff", "--quiet", upstream, "--", relativePath], {
    allowFailure: true,
  });
  const state: DocumentPublishState = diffResult.code === 1
    ? "unpublished-changes"
    : "published";

  const logResult = await runGit(
    workspacePath,
    ["log", "-1", "--format=%cI", upstream, "--", relativePath],
    { allowFailure: true },
  );

  return {
    relativePath,
    state,
    lastPublishedAt: logResult.code === 0 ? (logResult.stdout.trim() || null) : null,
  };
}

function flattenDocumentRelativePaths(nodes: WorkspaceTreeNode[]): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    if (node.kind === "document") {
      paths.push(node.relativePath);
      continue;
    }

    paths.push(...flattenDocumentRelativePaths(node.children));
  }

  return paths;
}

function filterUnpublishedWorkspaceTree(
  nodes: WorkspaceTreeNode[],
  statusByPath: Map<string, DocumentPublishStatus>,
): WorkspaceTreeNode[] {
  const filtered: WorkspaceTreeNode[] = [];

  for (const node of nodes) {
    if (node.kind === "document") {
      const status = statusByPath.get(node.relativePath);
      if (status && status.state !== "published") {
        filtered.push(node);
      }
      continue;
    }

    const children = filterUnpublishedWorkspaceTree(node.children, statusByPath);
    if (children.length > 0) {
      filtered.push({
        ...node,
        children,
      });
    }
  }

  return filtered;
}

async function readMergeConflicts(workspacePath: string): Promise<SyncConflict[]> {
  const conflictPaths = await runGit(workspacePath, ["diff", "--name-only", "--diff-filter=U"]);
  const relativePaths = conflictPaths.stdout
    .trim()
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (relativePaths.length === 0) {
    return [];
  }

  const conflicts = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const localContent = await runGit(workspacePath, ["show", `:2:${relativePath}`], {
        allowFailure: true,
      });
      const incomingContent = await runGit(workspacePath, ["show", `:3:${relativePath}`], {
        allowFailure: true,
      });
      const baseContent = await runGit(workspacePath, ["show", `:1:${relativePath}`], {
        allowFailure: true,
      });

      return {
        relativePath,
        localContent: localContent.code === 0 ? localContent.stdout : "",
        incomingContent: incomingContent.code === 0 ? incomingContent.stdout : "",
        baseContent: baseContent.code === 0 ? baseContent.stdout : null,
      } satisfies SyncConflict;
    }),
  );

  return conflicts;
}
