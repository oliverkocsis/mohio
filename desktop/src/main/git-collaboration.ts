import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveWorkspacePath } from "./document-store";
import {
  bootstrapWorkspaceGitRepository,
  getGitCapabilityState,
  runGit,
  setWorkspaceGitIdentity,
} from "./git-runtime";
import type {
  AutoSyncStatus,
  CommitHistoryEntry,
  DocumentPublishState,
  DocumentPublishStatus,
  GitCapabilityState,
  PublishSummary,
  RecordRiskyCommitInput,
  ResolveConflictInput,
  SyncWorkspaceResult,
  SyncConflict,
  SyncState,
  UnpublishedDiffResult,
  WorkspaceGitStatus,
  WorkspaceTreeNode,
} from "@shared/mohio-types";
const MARKDOWN_PATHS = ["*.md", "*.markdown", "*.mdx"];
const SYNC_DEBUG_ENABLED = process.env.MOHIO_SYNC_DEBUG === "1";
const legacyCheckpointCleanupDone = new Set<string>();

const defaultSyncState: SyncState = {
  status: "idle",
  lastCheckedAt: null,
  lastAppliedAt: null,
  message: null,
  conflicts: [],
};

export function createGitCollaborationService() {
  const syncStateByWorkspace = new Map<string, SyncState>();

  const bootstrapWorkspace = async (workspacePath: string): Promise<WorkspaceGitStatus> => {
    const status = await bootstrapWorkspaceGitRepository(workspacePath);

    if (status.gitAvailable && status.isRepository && !legacyCheckpointCleanupDone.has(workspacePath)) {
      await cleanupLegacyCheckpointArtifacts(workspacePath);
      legacyCheckpointCleanupDone.add(workspacePath);
    }

    return status;
  };

  const getGitCapability = async (): Promise<GitCapabilityState> => {
    return getGitCapabilityState();
  };

  const getWorkspaceStatus = async (workspacePath: string): Promise<WorkspaceGitStatus> => {
    return bootstrapWorkspace(workspacePath);
  };

  const setWorkspaceIdentity = async (
    workspacePath: string,
    input: {
      email: string;
      name: string;
    },
  ): Promise<WorkspaceGitStatus> => {
    const status = await setWorkspaceGitIdentity({
      workspacePath,
      name: input.name,
      email: input.email,
    });

    if (!legacyCheckpointCleanupDone.has(workspacePath)) {
      await cleanupLegacyCheckpointArtifacts(workspacePath);
      legacyCheckpointCleanupDone.add(workspacePath);
    }

    return status;
  };

  const getSyncState = async (workspacePath: string): Promise<SyncState> => {
    await bootstrapWorkspace(workspacePath);
    return syncStateByWorkspace.get(workspacePath) ?? defaultSyncState;
  };

  const recordRiskyCommit = async (
    workspacePath: string,
    input: RecordRiskyCommitInput,
  ): Promise<boolean> => {
    const status = await bootstrapWorkspace(workspacePath);
    if (!status.gitAvailable || !status.isRepository || status.requiresIdentitySetup) {
      return false;
    }

    return writeCommit(workspacePath, {
      force: input.force,
      minLineDelta: 0,
    });
  };

  const recordAutoSaveCommit = async (workspacePath: string): Promise<boolean> => {
    const status = await bootstrapWorkspace(workspacePath);
    if (!status.gitAvailable || !status.isRepository || status.requiresIdentitySetup) {
      return false;
    }

    return writeCommit(workspacePath, {
      force: false,
      minLineDelta: 0,
    });
  };

  const listCommitHistory = async (
    workspacePath: string,
    relativePath: string | null,
  ): Promise<CommitHistoryEntry[]> => {
    const status = await bootstrapWorkspace(workspacePath);
    if (!status.gitAvailable || !status.isRepository) {
      return [];
    }

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
    const status = await bootstrapWorkspace(workspacePath);

    if (!status.gitAvailable || !status.isRepository) {
      return {
        relativePath,
        hasRemoteVersion: false,
        patch: "",
        message: "Install Git to compare local and remote versions.",
      };
    }

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
      debugContext?: string;
    },
  ): Promise<boolean> => {
    const context = options.debugContext ?? "write-commit";
    debugSyncLog("writeCommit:start", {
      autoPush: options.autoPush !== false,
      context,
      force: Boolean(options.force),
      minLineDelta: options.minLineDelta,
      syncBeforeCommit: options.syncBeforeCommit !== false,
      workspacePath,
    });

    if (options.syncBeforeCommit !== false) {
      const syncState = await syncIncomingChanges(workspacePath, "before-commit");
      if (syncState.status === "conflict" || syncState.status === "error") {
        debugSyncLog("writeCommit:blocked-by-sync-state", {
          context,
          status: syncState.status,
          syncMessage: syncState.message,
          workspacePath,
        });
        return false;
      }
    }

    const material = await getMaterialChanges(workspacePath);
    if (!material.hasChanges) {
      debugSyncLog("writeCommit:skip-no-material", { context, workspacePath });
      return false;
    }

    if (!options.force && material.lineDelta < options.minLineDelta) {
      debugSyncLog("writeCommit:skip-below-threshold", {
        context,
        lineDelta: material.lineDelta,
        minLineDelta: options.minLineDelta,
        workspacePath,
      });
      return false;
    }

    if (material.changedPaths.length === 0) {
      debugSyncLog("writeCommit:skip-empty-changed-paths", { context, workspacePath });
      return false;
    }

    debugSyncLog("writeCommit:material-ready", {
      changedPaths: material.changedPaths,
      context,
      lineDelta: material.lineDelta,
      workspacePath,
    });

    await runGit(workspacePath, ["add", "-A", "--", ...material.changedPaths]);
    const stagedResult = await runGit(
      workspacePath,
      ["diff", "--cached", "--name-only", "--", ...material.changedPaths],
      { allowFailure: true },
    );

    if (stagedResult.code !== 0 || !stagedResult.stdout.trim()) {
      debugSyncLog("writeCommit:skip-no-staged-diff", {
        context,
        stagedCode: stagedResult.code,
        stagedStdout: stagedResult.stdout.trim(),
        workspacePath,
      });
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
    debugSyncLog("writeCommit:committed", {
      changedPaths: material.changedPaths,
      context,
      workspacePath,
    });

    if (options.autoPush !== false) {
      try {
        const pushed = await pushWorkspace(workspacePath);
        debugSyncLog("writeCommit:auto-push-result", {
          context,
          pushed,
          workspacePath,
        });
      } catch {
        debugSyncLog("writeCommit:auto-push-error", { context, workspacePath });
        // Keep commits durable even when sharing is temporarily unavailable.
      }
    }

    return true;
  };

  const getPublishSummary = async (
    workspacePath: string,
    workspaceDocuments: WorkspaceTreeNode[],
  ): Promise<PublishSummary> => {
    const status = await bootstrapWorkspace(workspacePath);
    const markdownPaths = flattenDocumentRelativePaths(workspaceDocuments);

    if (!status.gitAvailable || !status.isRepository) {
      const documents = markdownPaths.map((relativePath) => ({
        relativePath,
        state: "never-published" as const,
        lastPublishedAt: null,
      }));

      return {
        documents,
        unpublishedCount: documents.length,
        unpublishedTree: workspaceDocuments,
      };
    }

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
    const workspaceStatus = await bootstrapWorkspace(workspacePath);
    debugSyncLog("manualSync:start", { workspacePath });

    if (!workspaceStatus.gitAvailable) {
      return {
        committed: false,
        commitSha: null,
        syncedAt: null,
        message: "Install Git to enable snapshot history and sync.",
        remoteConnected: false,
        requiresRemoteConnect: false,
        requiresIdentitySetup: false,
        requiresGitInstall: true,
      };
    }

    if (!workspaceStatus.isRepository) {
      return {
        committed: false,
        commitSha: null,
        syncedAt: null,
        message: "Mohio could not initialize a Git repository for this workspace.",
        remoteConnected: false,
        requiresRemoteConnect: false,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      };
    }

    if (workspaceStatus.requiresIdentitySetup) {
      return {
        committed: false,
        commitSha: null,
        syncedAt: null,
        message: "Set a workspace Git identity before syncing.",
        remoteConnected: workspaceStatus.remoteConnected,
        requiresRemoteConnect: false,
        requiresIdentitySetup: true,
        requiresGitInstall: false,
      };
    }

    const committed = await writeCommit(workspacePath, {
      force: true,
      minLineDelta: 0,
      autoPush: false,
      debugContext: "manual-sync",
    });
    debugSyncLog("manualSync:after-write-commit", { committed, workspacePath });

    if (!workspaceStatus.remoteConnected) {
      return {
        committed,
        commitSha: null,
        syncedAt: null,
        message: "Connect a remote repository to sync this workspace.",
        remoteConnected: false,
        requiresRemoteConnect: true,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      };
    }

    const pushed = await pushWorkspace(workspacePath);
    debugSyncLog("manualSync:after-push", { pushed, workspacePath });
    if (!pushed) {
      return {
        committed,
        commitSha: null,
        syncedAt: null,
        message: "No local commits were ready to sync.",
        remoteConnected: true,
        requiresRemoteConnect: false,
        requiresIdentitySetup: false,
        requiresGitInstall: false,
      };
    }

    const shaResult = await runGit(workspacePath, ["rev-parse", "HEAD"]);
    const syncedAt = new Date().toISOString();

    return {
      committed,
      commitSha: shaResult.stdout.trim(),
      syncedAt,
      message: "Synced your latest workspace snapshot.",
      remoteConnected: true,
      requiresRemoteConnect: false,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    };
  };

  const getAutoSyncStatus = async (workspacePath: string): Promise<AutoSyncStatus> => {
    const workspaceStatus = await bootstrapWorkspace(workspacePath);

    if (!workspaceStatus.gitAvailable || !workspaceStatus.isRepository) {
      return {
        enabled: false,
        hasUncommittedChanges: false,
        lastSyncedAt: null,
        remoteConnected: false,
        requiresIdentitySetup: false,
        requiresGitInstall: !workspaceStatus.gitAvailable,
      };
    }

    if (workspaceStatus.requiresIdentitySetup) {
      return {
        enabled: false,
        hasUncommittedChanges: false,
        lastSyncedAt: null,
        remoteConnected: workspaceStatus.remoteConnected,
        requiresIdentitySetup: true,
        requiresGitInstall: false,
      };
    }

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
      remoteConnected: workspaceStatus.remoteConnected,
      requiresIdentitySetup: false,
      requiresGitInstall: false,
    };
  };

  const syncIncomingChanges = async (workspacePath: string, reason: string): Promise<SyncState> => {
    const workspaceStatus = await bootstrapWorkspace(workspacePath);

    if (!workspaceStatus.gitAvailable) {
      return {
        ...defaultSyncState,
        status: "idle",
        message: "Install Git to check incoming updates.",
      };
    }

    if (!workspaceStatus.isRepository) {
      return {
        ...defaultSyncState,
        status: "idle",
        message: "Mohio could not initialize Git for this workspace.",
      };
    }

    if (workspaceStatus.requiresIdentitySetup) {
      return {
        ...defaultSyncState,
        status: "idle",
        message: "Set a workspace Git identity before applying incoming updates.",
      };
    }

    debugSyncLog("syncIncoming:start", { reason, workspacePath });
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
      debugSyncLog("syncIncoming:no-upstream", { reason, workspacePath });
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
      debugSyncLog("syncIncoming:up-to-date", {
        behindCount: Number.isFinite(behindCount) ? behindCount : null,
        reason,
        workspacePath,
      });
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
      debugSyncLog("syncIncoming:merged", {
        behindCount,
        reason,
        workspacePath,
      });
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
      debugSyncLog("syncIncoming:conflict", {
        conflictCount: conflicts.length,
        reason,
        workspacePath,
      });
      return state;
    }

    const state: SyncState = {
      ...defaultSyncState,
      status: "error",
      lastCheckedAt: checkedAt,
      message: mergeResult.stderr.trim() || "Mohio could not apply incoming updates.",
    };
    syncStateByWorkspace.set(workspacePath, state);
    debugSyncLog("syncIncoming:error", {
      reason,
      stderr: mergeResult.stderr.trim(),
      workspacePath,
    });
    return state;
  };

  const resolveSyncConflict = async (
    workspacePath: string,
    input: ResolveConflictInput,
  ): Promise<SyncState> => {
    const workspaceStatus = await bootstrapWorkspace(workspacePath);
    if (!workspaceStatus.gitAvailable || !workspaceStatus.isRepository || workspaceStatus.requiresIdentitySetup) {
      return {
        ...defaultSyncState,
        status: "idle",
        message: "Set up Git and workspace identity before resolving conflicts.",
      };
    }

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
    bootstrapWorkspace,
    getGitCapability,
    getWorkspaceStatus,
    setWorkspaceIdentity,
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

async function getMaterialChanges(
  workspacePath: string,
): Promise<{ hasChanges: boolean; lineDelta: number; changedPaths: string[] }> {
  const status = await runGit(workspacePath, ["status", "--porcelain", "-z", "--", ...MARKDOWN_PATHS]);
  const statusOutput = status.stdout.trim();

  if (!statusOutput) {
    return {
      hasChanges: false,
      lineDelta: 0,
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
  debugSyncLog("pushWorkspace:start", { upstream, workspacePath });

  if (upstream) {
    const aheadCount = await getAheadCommitCount(workspacePath, upstream);
    debugSyncLog("pushWorkspace:upstream-status", {
      aheadCount,
      upstream,
      workspacePath,
    });

    if (aheadCount === 0) {
      debugSyncLog("pushWorkspace:skip-not-ahead", { upstream, workspacePath });
      return false;
    }

    await runGit(workspacePath, ["push"]);
    debugSyncLog("pushWorkspace:pushed", { upstream, workspacePath });
    return true;
  }

  const remoteResult = await runGit(workspacePath, ["remote", "get-url", "origin"], {
    allowFailure: true,
  });
  if (remoteResult.code !== 0 || !remoteResult.stdout.trim()) {
    debugSyncLog("pushWorkspace:skip-no-origin", { workspacePath });
    return false;
  }

  const branchResult = await runGit(workspacePath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branchName = branchResult.stdout.trim();
  await runGit(workspacePath, ["push", "-u", "origin", branchName]);
  debugSyncLog("pushWorkspace:pushed-with-upstream", { branchName, workspacePath });
  return true;
}

function debugSyncLog(event: string, details: Record<string, unknown>): void {
  if (!SYNC_DEBUG_ENABLED) {
    return;
  }
  const timestamp = new Date().toISOString();
  console.info(`[mohio-sync-debug] ${timestamp} ${event}`, details);
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
