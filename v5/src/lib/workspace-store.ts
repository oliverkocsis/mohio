import { useMemo, useState } from "react";
import { seededWorkspaces } from "../data/workspaces";
import { generateAgentProposal } from "./agent";
import { buildPathFromTitle, ensureMarkdownTitle } from "./markdown";
import type { AgentProposal, ChatMessage, Workspace, WorkspaceFile, WorkspaceStore } from "../types";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function createTimestamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function touchRecent(ids: string[], fileId: string) {
  return [fileId, ...ids.filter((id) => id !== fileId)].slice(0, 6);
}

function nextStarterContent(title: string) {
  return `# ${title.replace(/\.md$/i, "")}

Start writing here.
`;
}

export function useWorkspaceStore(): WorkspaceStore {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => clone(seededWorkspaces));
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(seededWorkspaces[0].id);
  const [selectedFileIds, setSelectedFileIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(seededWorkspaces.map((workspace) => [workspace.id, workspace.recentFileIds[0] ?? workspace.files[0].id])),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProposalIds, setActiveProposalIds] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(seededWorkspaces.map((workspace) => [workspace.id, null])),
  );

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0],
    [activeWorkspaceId, workspaces],
  );
  const selectedFileId = selectedFileIds[activeWorkspace.id] ?? activeWorkspace.recentFileIds[0] ?? activeWorkspace.files[0].id;
  const selectedFile = activeWorkspace.files.find((file) => file.id === selectedFileId) ?? activeWorkspace.files[0];
  const activeProposalId = activeProposalIds[activeWorkspace.id];
  const activeProposal =
    activeWorkspace.proposals.find((proposal) => proposal.id === activeProposalId)
    ?? activeWorkspace.proposals.find((proposal) => proposal.status === "pending")
    ?? null;
  const desktopMeta = window.mohioDesktop ?? {
    appVersion: "0.1.0",
    electronVersion: "browser-preview",
    platform: "web",
  };

  function updateWorkspace(transform: (workspace: Workspace) => Workspace) {
    setWorkspaces((current) =>
      current.map((workspace) => (workspace.id === activeWorkspaceId ? transform(workspace) : workspace)),
    );
  }

  function openWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    setSearchQuery("");
  }

  function selectFile(fileId: string) {
    setSelectedFileIds((current) => ({ ...current, [activeWorkspace.id]: fileId }));
    updateWorkspace((workspace) => ({
      ...workspace,
      recentFileIds: touchRecent(workspace.recentFileIds, fileId),
    }));
  }

  function setSelectedFileForWorkspace(fileId: string) {
    setSelectedFileIds((current) => ({ ...current, [activeWorkspace.id]: fileId }));
  }

  function updateFileContent(fileId: string, content: string) {
    updateWorkspace((workspace) => ({
      ...workspace,
      files: workspace.files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              content,
              updatedAt: createTimestamp(),
            }
          : file,
      ),
    }));
  }

  function createFile(title = "Untitled note"): string {
    const nextTitle = ensureMarkdownTitle(title);
    const fileId = createId("file");
    const nextFile: WorkspaceFile = {
      id: fileId,
      title: nextTitle,
      path: buildPathFromTitle(null, nextTitle),
      content: nextStarterContent(nextTitle),
      updatedAt: createTimestamp(),
      publishedAt: null,
      pinned: false,
      checkpoints: [],
      lastPublished: null,
    };

    updateWorkspace((workspace) => ({
      ...workspace,
      files: [nextFile, ...workspace.files],
      recentFileIds: touchRecent(workspace.recentFileIds, fileId),
    }));
    setSelectedFileForWorkspace(fileId);
    return fileId;
  }

  function renameFile(fileId: string, nextTitle: string) {
    const safeTitle = ensureMarkdownTitle(nextTitle);
    updateWorkspace((workspace) => ({
      ...workspace,
      files: workspace.files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              title: safeTitle,
              path: buildPathFromTitle(file.path, safeTitle),
              updatedAt: createTimestamp(),
            }
          : file,
      ),
    }));
  }

  function deleteFile(fileId: string) {
    updateWorkspace((workspace) => {
      if (workspace.files.length === 1) {
        return workspace;
      }

      const nextFiles = workspace.files.filter((file) => file.id !== fileId);
      const fallbackFileId = nextFiles[0]?.id;
      setSelectedFileIds((current) => ({
        ...current,
        [workspace.id]: current[workspace.id] === fileId ? fallbackFileId : current[workspace.id],
      }));

      return {
        ...workspace,
        files: nextFiles,
        recentFileIds: workspace.recentFileIds.filter((id) => id !== fileId),
        proposals: workspace.proposals.filter((proposal) => proposal.changes.every((change) => change.fileId !== fileId)),
      };
    });
  }

  function createCheckpoint(fileId: string, name: string, note?: string) {
    updateWorkspace((workspace) => ({
      ...workspace,
      files: workspace.files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              checkpoints: [
                {
                  id: createId("checkpoint"),
                  name: name.trim(),
                  note: note?.trim() || undefined,
                  content: file.content,
                  createdAt: createTimestamp(),
                },
                ...file.checkpoints,
              ],
            }
          : file,
      ),
    }));
  }

  function restoreCheckpoint(fileId: string, checkpointId: string) {
    updateWorkspace((workspace) => ({
      ...workspace,
      files: workspace.files.map((file) => {
        if (file.id !== fileId) {
          return file;
        }

        const checkpoint = file.checkpoints.find((entry) => entry.id === checkpointId);
        if (!checkpoint) {
          return file;
        }

        return {
          ...file,
          content: checkpoint.content,
          updatedAt: createTimestamp(),
        };
      }),
    }));
  }

  function publishFile(fileId: string) {
    updateWorkspace((workspace) => ({
      ...workspace,
      files: workspace.files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              publishedAt: createTimestamp(),
              lastPublished: {
                id: createId("published"),
                content: file.content,
                publishedAt: createTimestamp(),
              },
            }
          : file,
      ),
    }));
  }

  function submitAgentPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    let nextProposalId: string | null = null;

    updateWorkspace((workspace) => {
      const currentFile = workspace.files.find((file) => file.id === selectedFile.id) ?? workspace.files[0];
      const generated = generateAgentProposal({
        prompt: trimmed,
        workspace,
        currentFile,
        timestamp: createTimestamp(),
        createId,
      });
      nextProposalId = generated.proposal.id;

      const nextMessages: ChatMessage[] = [
        ...workspace.chatMessages,
        {
          id: createId("chat"),
          role: "user",
          content: trimmed,
          createdAt: createTimestamp(),
        },
        {
          id: createId("chat"),
          role: "assistant",
          content: generated.reply,
          createdAt: createTimestamp(),
          proposalId: generated.proposal.id,
        },
      ];

      return {
        ...workspace,
        chatMessages: nextMessages,
        proposals: [generated.proposal, ...workspace.proposals],
      };
    });

    setActiveProposalIds((current) => ({
      ...current,
      [activeWorkspace.id]: nextProposalId,
    }));
  }

  function updateProposalStatus(workspace: Workspace, proposalId: string, status: AgentProposal["status"]) {
    return workspace.proposals.map((proposal) =>
      proposal.id === proposalId ? { ...proposal, status } : proposal,
    );
  }

  function applyProposal(proposalId: string) {
    let nextSelectedFileId: string | null = null;

    updateWorkspace((workspace) => {
      const proposal = workspace.proposals.find((entry) => entry.id === proposalId);
      if (!proposal || proposal.status !== "pending") {
        return workspace;
      }

      let nextFiles = workspace.files.slice();

      for (const change of proposal.changes) {
        if (change.type === "create") {
          const nextFile: WorkspaceFile = {
            id: change.fileId,
            title: change.title,
            path: change.path,
            content: change.afterContent,
            updatedAt: createTimestamp(),
            publishedAt: null,
            pinned: false,
            checkpoints: [],
            lastPublished: null,
          };
          nextFiles = [nextFile, ...nextFiles];
          nextSelectedFileId = change.fileId;
        } else {
          nextFiles = nextFiles.map((file) =>
            file.id === change.fileId
              ? {
                  ...file,
                  content: change.afterContent,
                  updatedAt: createTimestamp(),
                }
              : file,
          );
          nextSelectedFileId = change.fileId;
        }
      }

      const appliedMessage: ChatMessage = {
        id: createId("chat"),
        role: "assistant",
        content: "Proposal applied. The draft changed locally; publish remains a separate step.",
        createdAt: createTimestamp(),
      };

      return {
        ...workspace,
        files: nextFiles,
        recentFileIds: nextSelectedFileId ? touchRecent(workspace.recentFileIds, nextSelectedFileId) : workspace.recentFileIds,
        proposals: updateProposalStatus(workspace, proposalId, "applied"),
        chatMessages: [...workspace.chatMessages, appliedMessage],
      };
    });

    if (nextSelectedFileId) {
      setSelectedFileForWorkspace(nextSelectedFileId);
    }
    setActiveProposalIds((current) => ({ ...current, [activeWorkspace.id]: null }));
  }

  function discardProposal(proposalId: string) {
    updateWorkspace((workspace) => {
      const proposal = workspace.proposals.find((entry) => entry.id === proposalId);
      if (!proposal || proposal.status !== "pending") {
        return workspace;
      }

      return {
        ...workspace,
        proposals: updateProposalStatus(workspace, proposalId, "discarded"),
        chatMessages: [
          ...workspace.chatMessages,
          {
            id: createId("chat"),
            role: "assistant",
            content: "Proposal discarded. The workspace files are unchanged.",
            createdAt: createTimestamp(),
          },
        ],
      };
    });

    setActiveProposalIds((current) => ({ ...current, [activeWorkspace.id]: null }));
  }

  return {
    workspaces,
    activeWorkspace,
    selectedFile,
    searchQuery,
    activeProposal,
    desktopMeta,
    openWorkspace,
    selectFile,
    setSearchQuery,
    updateFileContent,
    createFile,
    renameFile,
    deleteFile,
    createCheckpoint,
    restoreCheckpoint,
    publishFile,
    submitAgentPrompt,
    applyProposal,
    discardProposal,
  };
}
