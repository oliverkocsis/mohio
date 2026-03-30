import { describe, expect, it, vi } from "vitest";
import { createMohioApi } from "./mohio-api";

describe("createMohioApi", () => {
  it("returns a stable app info and workspace contract", async () => {
    const workspace = {
      name: "mohio",
      path: "/workspace/mohio",
      documents: [
        {
          id: "README.md",
          kind: "document" as const,
          name: "README.md",
          relativePath: "README.md",
          displayTitle: "README",
        },
      ],
      documentCount: 1,
    };
    const document = {
      relativePath: "README.md",
      fileName: "README.md",
      displayTitle: "README",
      markdown: "Body",
      titleMode: "h1-linked" as const,
    };

    const getCurrentWorkspace = vi.fn().mockResolvedValue(workspace);
    const openWorkspace = vi.fn().mockResolvedValue(workspace);
    const readDocument = vi.fn().mockResolvedValue(document);
    const createDocument = vi.fn().mockResolvedValue({
      relativePath: "Untitled.md",
      fileName: "Untitled.md",
      displayTitle: "Untitled",
      markdown: "",
      titleMode: "h1-linked" as const,
    });
    const deleteDocument = vi.fn().mockResolvedValue(undefined);
    const saveDocument = vi.fn().mockResolvedValue({
      ...document,
      savedAt: "2026-03-21T00:00:00.000Z",
    });
    const recordRiskyCommit = vi.fn().mockResolvedValue(false);
    const recordAutoSaveCommit = vi.fn().mockResolvedValue(false);
    const listCommitHistory = vi.fn().mockResolvedValue([]);
    const getUnpublishedDiff = vi.fn().mockResolvedValue({
      relativePath: "README.md",
      hasRemoteVersion: true,
      patch: "",
      message: null,
    });
    const getPublishSummary = vi.fn().mockResolvedValue({
      documents: [],
      unpublishedCount: 0,
      unpublishedTree: [],
    });
    const publishWorkspaceChanges = vi.fn().mockResolvedValue({
      committed: false,
      commitSha: null,
      publishedAt: null,
      message: "No unpublished Markdown changes were ready to publish.",
    });
    const syncIncomingChanges = vi.fn().mockResolvedValue({
      status: "idle" as const,
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    });
    const getSyncState = vi.fn().mockResolvedValue({
      status: "idle" as const,
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    });
    const resolveSyncConflict = vi.fn().mockResolvedValue({
      status: "idle" as const,
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    });
    const watchDocument = vi.fn().mockResolvedValue(undefined);
    const listAssistantThreads = vi.fn().mockResolvedValue([
      {
        id: "thread-1",
        title: "README summary",
        preview: "README summary",
        createdAt: "2026-03-21T00:00:00.000Z",
        updatedAt: "2026-03-21T00:00:00.000Z",
        status: "idle" as const,
      },
    ]);
    const createAssistantThread = vi.fn().mockResolvedValue({
      id: "thread-1",
      workspacePath: "/workspace/mohio",
      title: "README summary",
      preview: "README summary",
      messages: [],
      status: "idle" as const,
      errorMessage: null,
    });
    const getAssistantThread = vi.fn().mockResolvedValue({
      id: "thread-1",
      workspacePath: "/workspace/mohio",
      title: "README summary",
      preview: "README summary",
      messages: [],
      status: "idle" as const,
      errorMessage: null,
    });
    const sendAssistantMessage = vi.fn().mockResolvedValue({
      id: "thread-1",
      workspacePath: "/workspace/mohio",
      title: "README summary",
      preview: "README summary",
      messages: [
        {
          id: "message-1",
          role: "user" as const,
          content: "Summarize this note",
          createdAt: "2026-03-21T00:00:00.000Z",
        },
      ],
      status: "running" as const,
      errorMessage: null,
    });
    const cancelAssistantRun = vi.fn().mockResolvedValue(undefined);
    const renameAssistantThread = vi.fn().mockResolvedValue(undefined);
    const deleteAssistantThread = vi.fn().mockResolvedValue(undefined);
    const onDocumentChanged = vi.fn().mockReturnValue(() => undefined);
    const onWorkspaceChanged = vi.fn().mockReturnValue(() => undefined);
    const onAssistantEvent = vi.fn().mockReturnValue(() => undefined);

    const api = createMohioApi({
      appInfo: {
        name: "Mohio",
        version: "0.1.0",
        platform: "darwin",
      },
      getCurrentWorkspace,
      openWorkspace,
      readDocument,
      createDocument,
      deleteDocument,
      saveDocument,
      recordRiskyCommit,
      recordAutoSaveCommit,
      listCommitHistory,
      getUnpublishedDiff,
      getPublishSummary,
      publishWorkspaceChanges,
      syncIncomingChanges,
      getSyncState,
      resolveSyncConflict,
      watchDocument,
      listAssistantThreads,
      createAssistantThread,
      getAssistantThread,
      sendAssistantMessage,
      cancelAssistantRun,
      renameAssistantThread,
      deleteAssistantThread,
      onDocumentChanged,
      onWorkspaceChanged,
      onAssistantEvent,
    });

    expect(api.getAppInfo()).toEqual({
      name: "Mohio",
      version: "0.1.0",
      platform: "darwin",
    });
    await expect(api.getCurrentWorkspace()).resolves.toEqual(workspace);
    await expect(api.openWorkspace()).resolves.toEqual(workspace);
    await expect(api.readDocument("README.md")).resolves.toEqual(document);
    await expect(api.createDocument({ directoryRelativePath: null })).resolves.toEqual({
      relativePath: "Untitled.md",
      fileName: "Untitled.md",
      displayTitle: "Untitled",
      markdown: "",
      titleMode: "h1-linked",
    });
    await expect(api.deleteDocument("README.md")).resolves.toBeUndefined();
    await expect(api.recordRiskyCommit({
      trigger: "manual",
    })).resolves.toBe(false);
    await expect(api.recordAutoSaveCommit()).resolves.toBe(false);
    await expect(api.listCommitHistory("README.md")).resolves.toEqual([]);
    await expect(api.getUnpublishedDiff("README.md")).resolves.toEqual({
      relativePath: "README.md",
      hasRemoteVersion: true,
      patch: "",
      message: null,
    });
    await expect(api.getPublishSummary()).resolves.toEqual({
      documents: [],
      unpublishedCount: 0,
      unpublishedTree: [],
    });
    await expect(api.publishWorkspaceChanges()).resolves.toEqual({
      committed: false,
      commitSha: null,
      publishedAt: null,
      message: "No unpublished Markdown changes were ready to publish.",
    });
    await expect(api.syncIncomingChanges("manual")).resolves.toEqual({
      status: "idle",
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    });
    await expect(api.getSyncState()).resolves.toEqual({
      status: "idle",
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    });
    await expect(api.resolveSyncConflict({
      relativePath: "README.md",
      resolution: "keep-local",
    })).resolves.toEqual({
      status: "idle",
      lastCheckedAt: null,
      lastAppliedAt: null,
      message: null,
      conflicts: [],
    });
    await expect(api.saveDocument({
      relativePath: "README.md",
      title: "README",
      markdown: "Body",
      titleMode: "h1-linked",
    })).resolves.toEqual({
      ...document,
      savedAt: "2026-03-21T00:00:00.000Z",
    });
    await expect(api.watchDocument("README.md")).resolves.toBeUndefined();
    await expect(api.listAssistantThreads()).resolves.toEqual([
      {
        id: "thread-1",
        title: "README summary",
        preview: "README summary",
        createdAt: "2026-03-21T00:00:00.000Z",
        updatedAt: "2026-03-21T00:00:00.000Z",
        status: "idle",
      },
    ]);
    await expect(api.createAssistantThread()).resolves.toEqual({
      id: "thread-1",
      workspacePath: "/workspace/mohio",
      title: "README summary",
      preview: "README summary",
      messages: [],
      status: "idle",
      errorMessage: null,
    });
    await expect(api.getAssistantThread("thread-1")).resolves.toEqual({
      id: "thread-1",
      workspacePath: "/workspace/mohio",
      title: "README summary",
      preview: "README summary",
      messages: [],
      status: "idle",
      errorMessage: null,
    });
    await expect(api.sendAssistantMessage({
      threadId: "thread-1",
      noteRelativePath: "README.md",
      content: "Summarize this note",
      documentTitle: "README",
      documentMarkdown: "Body",
    })).resolves.toEqual({
      id: "thread-1",
      workspacePath: "/workspace/mohio",
      title: "README summary",
      preview: "README summary",
      messages: [
        {
          id: "message-1",
          role: "user",
          content: "Summarize this note",
          createdAt: "2026-03-21T00:00:00.000Z",
        },
      ],
      status: "running",
      errorMessage: null,
    });
    await expect(api.cancelAssistantRun("thread-1")).resolves.toBeUndefined();
    await expect(api.renameAssistantThread({
      threadId: "thread-1",
      title: "Renamed chat",
    })).resolves.toBeUndefined();
    await expect(api.deleteAssistantThread("thread-1")).resolves.toBeUndefined();
    expect(api.onWorkspaceChanged(() => undefined)).toEqual(expect.any(Function));
    expect(api.onDocumentChanged(() => undefined)).toEqual(expect.any(Function));
    expect(api.onAssistantEvent(() => undefined)).toEqual(expect.any(Function));
    expect(getCurrentWorkspace).toHaveBeenCalledTimes(1);
    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(readDocument).toHaveBeenCalledWith("README.md");
    expect(createDocument).toHaveBeenCalledWith({ directoryRelativePath: null });
    expect(deleteDocument).toHaveBeenCalledWith("README.md");
    expect(recordRiskyCommit).toHaveBeenCalledWith({
      trigger: "manual",
    });
    expect(recordAutoSaveCommit).toHaveBeenCalledTimes(1);
    expect(listCommitHistory).toHaveBeenCalledWith("README.md");
    expect(getUnpublishedDiff).toHaveBeenCalledWith("README.md");
    expect(getPublishSummary).toHaveBeenCalledTimes(1);
    expect(publishWorkspaceChanges).toHaveBeenCalledTimes(1);
    expect(syncIncomingChanges).toHaveBeenCalledWith("manual");
    expect(getSyncState).toHaveBeenCalledTimes(1);
    expect(resolveSyncConflict).toHaveBeenCalledWith({
      relativePath: "README.md",
      resolution: "keep-local",
    });
    expect(saveDocument).toHaveBeenCalledWith({
      relativePath: "README.md",
      title: "README",
      markdown: "Body",
      titleMode: "h1-linked",
    });
    expect(watchDocument).toHaveBeenCalledWith("README.md");
    expect(listAssistantThreads).toHaveBeenCalledTimes(1);
    expect(createAssistantThread).toHaveBeenCalledTimes(1);
    expect(getAssistantThread).toHaveBeenCalledWith("thread-1");
    expect(sendAssistantMessage).toHaveBeenCalledWith({
      threadId: "thread-1",
      noteRelativePath: "README.md",
      content: "Summarize this note",
      documentTitle: "README",
      documentMarkdown: "Body",
    });
    expect(cancelAssistantRun).toHaveBeenCalledWith("thread-1");
    expect(renameAssistantThread).toHaveBeenCalledWith({
      threadId: "thread-1",
      title: "Renamed chat",
    });
    expect(deleteAssistantThread).toHaveBeenCalledWith("thread-1");
    expect(onDocumentChanged).toHaveBeenCalledTimes(1);
    expect(onWorkspaceChanged).toHaveBeenCalledTimes(1);
    expect(onAssistantEvent).toHaveBeenCalledTimes(1);
  });
});
