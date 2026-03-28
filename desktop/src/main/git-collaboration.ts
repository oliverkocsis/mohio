import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { resolveWorkspacePath } from "./document-store";
import type {
  CheckpointDiff,
  CheckpointDiffInput,
  CommitHistoryEntry,
  CheckpointSummary,
  CheckpointTrigger,
  CreateCheckpointInput,
  DocumentPublishState,
  DocumentPublishStatus,
  PublishResult,
  PublishSummary,
  ResolveConflictInput,
  RevertToCheckpointInput,
  SyncConflict,
  SyncState,
  UnpublishedDiffResult,
  WorkspaceTreeNode,
} from "@shared/mohio-types";

const execFileAsync = promisify(execFile);
const MARKDOWN_PATHS = ["*.md", "*.markdown", "*.mdx"];
const CHECKPOINT_MIN_LINE_DELTA = 3;

interface CheckpointRecord {
  id: string;
  createdAt: string;
  reason: string;
  trigger: CheckpointTrigger;
  commit: string;
  ref: string;
  touchedDocuments: string[];
}

const defaultSyncState: SyncState = {
  status: "idle",
  lastCheckedAt: null,
  lastAppliedAt: null,
  message: null,
  conflicts: [],
};

export function createGitCollaborationService() {
  const lastCheckpointFingerprintByWorkspace = new Map<string, string>();
  const syncStateByWorkspace = new Map<string, SyncState>();

  const getSyncState = async (workspacePath: string): Promise<SyncState> => {
    await ensureGitWorkspace(workspacePath);
    return syncStateByWorkspace.get(workspacePath) ?? defaultSyncState;
  };

  const createCheckpoint = async (
    workspacePath: string,
    input: CreateCheckpointInput,
  ): Promise<CheckpointSummary | null> => {
    await ensureGitWorkspace(workspacePath);

    const material = await getMaterialChanges(workspacePath);
    if (!input.force) {
      if (!material.hasChanges || material.lineDelta < CHECKPOINT_MIN_LINE_DELTA) {
        return null;
      }

      const previousFingerprint = lastCheckpointFingerprintByWorkspace.get(workspacePath);
      if (previousFingerprint && previousFingerprint === material.fingerprint) {
        return null;
      }
    }

    const stashResult = await runGit(
      workspacePath,
      ["stash", "create", `mohio checkpoint ${input.trigger}`],
      { allowFailure: true },
    );
    const commit = stashResult.stdout.trim();

    if (!commit) {
      return null;
    }

    const checkpointId = buildCheckpointId();
    const checkpointRef = `refs/mohio/checkpoints/${checkpointId}`;
    await runGit(workspacePath, ["update-ref", checkpointRef, commit]);

    const touchedDocuments = await listCommitDocuments(workspacePath, commit);
    const record: CheckpointRecord = {
      id: checkpointId,
      createdAt: new Date().toISOString(),
      reason: input.reason,
      trigger: input.trigger,
      commit,
      ref: checkpointRef,
      touchedDocuments,
    };

    await appendCheckpointRecord(workspacePath, record);
    lastCheckpointFingerprintByWorkspace.set(workspacePath, material.fingerprint);

    return mapCheckpointRecord(record);
  };

  const createAiChangeCheckpoint = async (
    workspacePath: string,
    relativePath: string,
    reason: string,
  ) => {
    return createCheckpoint(workspacePath, {
      reason,
      trigger: "ai-change",
      force: true,
      relativePath,
    });
  };

  const listCheckpoints = async (
    workspacePath: string,
    relativePath: string | null,
  ): Promise<CheckpointSummary[]> => {
    await ensureGitWorkspace(workspacePath);
    const checkpoints = await readCheckpointRecords(workspacePath);

    return checkpoints
      .filter((checkpoint) => {
        if (!relativePath) {
          return true;
        }

        return checkpoint.touchedDocuments.includes(relativePath);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(mapCheckpointRecord);
  };

  const listCommitHistory = async (
    workspacePath: string,
    relativePath: string | null,
  ): Promise<CommitHistoryEntry[]> => {
    await ensureGitWorkspace(workspacePath);
    const logArgs = [
      "log",
      "--date=iso-strict",
      "--pretty=format:%H%x1f%h%x1f%cI%x1f%s",
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

    return logResult.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sha, shortSha, authoredAt, subject] = line.split("\u001f");
        return {
          sha,
          shortSha,
          authoredAt,
          subject,
        } satisfies CommitHistoryEntry;
      });
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

  const getCheckpointDiff = async (
    workspacePath: string,
    input: CheckpointDiffInput,
  ): Promise<CheckpointDiff> => {
    await ensureGitWorkspace(workspacePath);
    const checkpoints = await readCheckpointRecords(workspacePath);
    const fromCheckpoint = checkpoints.find((checkpoint) => checkpoint.id === input.fromCheckpointId);
    const toCheckpoint = checkpoints.find((checkpoint) => checkpoint.id === input.toCheckpointId);

    if (!fromCheckpoint || !toCheckpoint) {
      throw new Error("Mohio could not find one of the selected checkpoints.");
    }

    const diffResult = await runGit(workspacePath, [
      "diff",
      fromCheckpoint.commit,
      toCheckpoint.commit,
      "--",
      input.relativePath,
    ]);

    return {
      fromCheckpointId: input.fromCheckpointId,
      toCheckpointId: input.toCheckpointId,
      relativePath: input.relativePath,
      patch: diffResult.stdout,
    };
  };

  const revertToCheckpoint = async (
    workspacePath: string,
    input: RevertToCheckpointInput,
  ): Promise<void> => {
    await ensureGitWorkspace(workspacePath);
    const checkpoints = await readCheckpointRecords(workspacePath);
    const checkpoint = checkpoints.find((entry) => entry.id === input.checkpointId);

    if (!checkpoint) {
      throw new Error("Mohio could not find the selected checkpoint.");
    }

    await createCheckpoint(workspacePath, {
      reason: `Before revert ${input.relativePath}`,
      trigger: "revert",
      force: true,
      relativePath: input.relativePath,
    });

    const fileContents = await runGit(workspacePath, [
      "show",
      `${checkpoint.commit}:${input.relativePath}`,
    ]);
    const absolutePath = resolveWorkspacePath(workspacePath, input.relativePath);
    await fs.writeFile(absolutePath, fileContents.stdout, "utf8");
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

  const publishWorkspaceChanges = async (workspacePath: string): Promise<PublishResult> => {
    await ensureGitWorkspace(workspacePath);

    await createCheckpoint(workspacePath, {
      reason: "Before publish",
      trigger: "publish",
      force: true,
    });

    await runGit(workspacePath, ["add", "-A", "--", ...MARKDOWN_PATHS]);
    const stagedResult = await runGit(workspacePath, [
      "diff",
      "--cached",
      "--name-only",
      "--",
      ...MARKDOWN_PATHS,
    ]);

    if (!stagedResult.stdout.trim()) {
      return {
        committed: false,
        commitSha: null,
        publishedAt: null,
        message: "No unpublished Markdown changes were ready to publish.",
      };
    }

    const publishedAt = new Date().toISOString();
    const shortDate = publishedAt.slice(0, 10);
    await runGit(workspacePath, ["commit", "-m", `Publish Mohio updates (${shortDate})`]);

    const upstream = await getUpstreamBranch(workspacePath);
    if (upstream) {
      await runGit(workspacePath, ["push"]);
    } else {
      const branchResult = await runGit(workspacePath, ["rev-parse", "--abbrev-ref", "HEAD"]);
      const branchName = branchResult.stdout.trim();
      await runGit(workspacePath, ["push", "-u", "origin", branchName]);
    }

    const shaResult = await runGit(workspacePath, ["rev-parse", "HEAD"]);

    return {
      committed: true,
      commitSha: shaResult.stdout.trim(),
      publishedAt,
      message: "Published your Markdown updates.",
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

    await createCheckpoint(workspacePath, {
      reason: "Before applying incoming updates",
      trigger: "sync-before",
      force: true,
    });

    const mergeResult = await runGit(workspacePath, ["merge", "--no-ff", "--no-edit", upstream], {
      allowFailure: true,
    });

    if (mergeResult.code === 0) {
      const appliedAt = new Date().toISOString();
      await createCheckpoint(workspacePath, {
        reason: "After applying incoming updates",
        trigger: "sync-after",
        force: true,
      });
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

    await runGit(workspacePath, ["commit", "--no-edit"]);
    await createCheckpoint(workspacePath, {
      reason: "After resolving incoming update conflicts",
      trigger: "sync-after",
      force: true,
    });

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
    createCheckpoint,
    createAiChangeCheckpoint,
    listCheckpoints,
    listCommitHistory,
    getUnpublishedDiff,
    getCheckpointDiff,
    revertToCheckpoint,
    getPublishSummary,
    publishWorkspaceChanges,
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
}

async function getMaterialChanges(
  workspacePath: string,
): Promise<{ hasChanges: boolean; lineDelta: number; fingerprint: string }> {
  const status = await runGit(workspacePath, ["status", "--porcelain", "--", ...MARKDOWN_PATHS]);
  const fingerprint = status.stdout.trim();

  if (!fingerprint) {
    return {
      hasChanges: false,
      lineDelta: 0,
      fingerprint: "",
    };
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
  };
}

function buildCheckpointId(): string {
  return `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function listCommitDocuments(workspacePath: string, commit: string): Promise<string[]> {
  const treeResult = await runGit(workspacePath, ["show", "--name-only", "--pretty=format:", commit]);

  return treeResult.stdout
    .trim()
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function appendCheckpointRecord(workspacePath: string, record: CheckpointRecord): Promise<void> {
  const metadataPath = getCheckpointMetadataPath(workspacePath);
  await fs.mkdir(path.dirname(metadataPath), { recursive: true });
  await fs.appendFile(metadataPath, `${JSON.stringify(record)}\n`, "utf8");
}

async function readCheckpointRecords(workspacePath: string): Promise<CheckpointRecord[]> {
  const metadataPath = getCheckpointMetadataPath(workspacePath);
  let content = "";

  try {
    content = await fs.readFile(metadataPath, "utf8");
  } catch {
    return [];
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as CheckpointRecord;
      } catch {
        return null;
      }
    })
    .filter((value): value is CheckpointRecord => Boolean(value));
}

function getCheckpointMetadataPath(workspacePath: string): string {
  return path.join(workspacePath, ".git", "mohio", "checkpoints.jsonl");
}

function mapCheckpointRecord(record: CheckpointRecord): CheckpointSummary {
  return {
    id: record.id,
    createdAt: record.createdAt,
    reason: record.reason,
    trigger: record.trigger,
    commit: record.commit,
    ref: record.ref,
    touchedDocuments: record.touchedDocuments,
  };
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
