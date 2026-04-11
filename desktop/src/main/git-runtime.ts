import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { GitCapabilityState, WorkspaceGitStatus } from "@shared/mohio-types";

const execFileAsync = promisify(execFile);

interface RunGitOptions {
  allowFailure?: boolean;
}

interface RunGitResult {
  code: number;
  stderr: string;
  stdout: string;
}

export async function runGit(
  cwd: string,
  args: string[],
  options: RunGitOptions = {},
): Promise<RunGitResult> {
  try {
    const result = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });

    return {
      code: 0,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  } catch (error) {
    const executionError = error as {
      code?: number;
      message: string;
      stderr?: string;
      stdout?: string;
    };

    if (options.allowFailure) {
      return {
        code: Number.isInteger(executionError.code) ? Number(executionError.code) : 1,
        stderr: executionError.stderr ?? executionError.message,
        stdout: executionError.stdout ?? "",
      };
    }

    throw new Error(executionError.stderr?.trim() || executionError.message);
  }
}

export async function getGitCapabilityState(): Promise<GitCapabilityState> {
  const versionResult = await runGit(process.cwd(), ["--version"], {
    allowFailure: true,
  });

  if (versionResult.code !== 0) {
    return {
      gitAvailable: false,
      gitVersion: null,
      installHint: "Install Git to enable workspace history and remote sync.",
    };
  }

  return {
    gitAvailable: true,
    gitVersion: versionResult.stdout.trim() || null,
    installHint: null,
  };
}

export async function getWorkspaceGitStatus(workspacePath: string): Promise<WorkspaceGitStatus> {
  const capability = await getGitCapabilityState();

  if (!capability.gitAvailable) {
    return {
      gitAvailable: false,
      isRepository: false,
      remoteConnected: false,
      remoteName: null,
      remoteUrl: null,
      identityConfigured: false,
      userName: null,
      userEmail: null,
      requiresIdentitySetup: false,
    };
  }

  const repoCheck = await runGit(workspacePath, ["rev-parse", "--is-inside-work-tree"], {
    allowFailure: true,
  });
  const isRepository = repoCheck.code === 0 && repoCheck.stdout.trim() === "true";

  if (!isRepository) {
    return {
      gitAvailable: true,
      isRepository: false,
      remoteConnected: false,
      remoteName: null,
      remoteUrl: null,
      identityConfigured: false,
      userName: null,
      userEmail: null,
      requiresIdentitySetup: false,
    };
  }

  const remoteUrlResult = await runGit(workspacePath, ["remote", "get-url", "origin"], {
    allowFailure: true,
  });
  const remoteUrl = remoteUrlResult.code === 0 ? (remoteUrlResult.stdout.trim() || null) : null;
  const remoteConnected = Boolean(remoteUrl);

  const userName = await readGitConfigValue(workspacePath, "user.name");
  const userEmail = await readGitConfigValue(workspacePath, "user.email");
  const identityConfigured = Boolean(userName && userEmail);

  return {
    gitAvailable: true,
    isRepository,
    remoteConnected,
    remoteName: remoteConnected ? "origin" : null,
    remoteUrl,
    identityConfigured,
    userName,
    userEmail,
    requiresIdentitySetup: !identityConfigured,
  };
}

export async function bootstrapWorkspaceGitRepository(workspacePath: string): Promise<WorkspaceGitStatus> {
  const capability = await getGitCapabilityState();

  if (!capability.gitAvailable) {
    return getWorkspaceGitStatus(workspacePath);
  }

  const status = await getWorkspaceGitStatus(workspacePath);

  if (status.isRepository) {
    return status;
  }

  const initWithMain = await runGit(workspacePath, ["init", "-b", "main"], {
    allowFailure: true,
  });

  if (initWithMain.code !== 0) {
    await runGit(workspacePath, ["init"]);
    await runGit(workspacePath, ["branch", "-M", "main"], {
      allowFailure: true,
    });
  }

  return getWorkspaceGitStatus(workspacePath);
}

export async function setWorkspaceGitIdentity({
  workspacePath,
  name,
  email,
}: {
  workspacePath: string;
  name: string;
  email: string;
}): Promise<WorkspaceGitStatus> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName || !trimmedEmail) {
    throw new Error("Enter both a name and email to continue.");
  }

  await bootstrapWorkspaceGitRepository(workspacePath);
  await runGit(workspacePath, ["config", "--local", "user.name", trimmedName]);
  await runGit(workspacePath, ["config", "--local", "user.email", trimmedEmail]);

  return getWorkspaceGitStatus(workspacePath);
}

export async function isRemoteRepositoryEmpty(remoteUrl: string): Promise<boolean> {
  const result = await runGit(process.cwd(), ["ls-remote", "--heads", remoteUrl], {
    allowFailure: true,
  });

  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || "Mohio could not inspect the selected remote repository.");
  }

  return result.stdout.trim().length === 0;
}

export async function addOrReplaceOriginRemote({
  workspacePath,
  remoteUrl,
}: {
  workspacePath: string;
  remoteUrl: string;
}): Promise<void> {
  const existingRemote = await runGit(workspacePath, ["remote", "get-url", "origin"], {
    allowFailure: true,
  });

  if (existingRemote.code === 0) {
    await runGit(workspacePath, ["remote", "set-url", "origin", remoteUrl]);
    return;
  }

  await runGit(workspacePath, ["remote", "add", "origin", remoteUrl]);
}

export async function cloneRemoteRepository({
  cloneUrl,
  parentDirectory,
  repositoryName,
}: {
  cloneUrl: string;
  parentDirectory: string;
  repositoryName: string;
}): Promise<string> {
  await mkdir(parentDirectory, { recursive: true });

  const safeFolderName = repositoryName.trim().replace(/[^a-zA-Z0-9._-]/gu, "-") || "workspace";
  const targetPath = path.join(parentDirectory, safeFolderName);

  await runGit(parentDirectory, ["clone", cloneUrl, targetPath]);

  return targetPath;
}

export async function getCurrentBranchName(workspacePath: string): Promise<string | null> {
  const result = await runGit(workspacePath, ["rev-parse", "--abbrev-ref", "HEAD"], {
    allowFailure: true,
  });

  if (result.code !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

async function readGitConfigValue(workspacePath: string, key: string): Promise<string | null> {
  const localResult = await runGit(workspacePath, ["config", "--local", "--get", key], {
    allowFailure: true,
  });
  const localValue = localResult.code === 0 ? localResult.stdout.trim() : "";
  if (localValue) {
    return localValue;
  }

  const globalResult = await runGit(workspacePath, ["config", "--global", "--get", key], {
    allowFailure: true,
  });
  const globalValue = globalResult.code === 0 ? globalResult.stdout.trim() : "";
  if (globalValue) {
    return globalValue;
  }

  return null;
}
