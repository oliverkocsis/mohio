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
    };

    const getCurrentWorkspace = vi.fn().mockResolvedValue(workspace);
    const openWorkspace = vi.fn().mockResolvedValue(workspace);
    const readDocument = vi.fn().mockResolvedValue(document);
    const saveDocument = vi.fn().mockResolvedValue({
      ...document,
      savedAt: "2026-03-21T00:00:00.000Z",
    });
    const watchDocument = vi.fn().mockResolvedValue(undefined);
    const getAssistantThread = vi.fn().mockResolvedValue({
      noteRelativePath: "README.md",
      messages: [],
      status: "idle" as const,
      errorMessage: null,
    });
    const sendAssistantMessage = vi.fn().mockResolvedValue({
      noteRelativePath: "README.md",
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
      saveDocument,
      watchDocument,
      getAssistantThread,
      sendAssistantMessage,
      cancelAssistantRun,
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
    await expect(api.saveDocument({
      relativePath: "README.md",
      title: "README",
      markdown: "Body",
    })).resolves.toEqual({
      ...document,
      savedAt: "2026-03-21T00:00:00.000Z",
    });
    await expect(api.watchDocument("README.md")).resolves.toBeUndefined();
    await expect(api.getAssistantThread("README.md")).resolves.toEqual({
      noteRelativePath: "README.md",
      messages: [],
      status: "idle",
      errorMessage: null,
    });
    await expect(api.sendAssistantMessage({
      noteRelativePath: "README.md",
      content: "Summarize this note",
      documentTitle: "README",
      documentMarkdown: "Body",
    })).resolves.toEqual({
      noteRelativePath: "README.md",
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
    await expect(api.cancelAssistantRun("README.md")).resolves.toBeUndefined();
    expect(api.onWorkspaceChanged(() => undefined)).toEqual(expect.any(Function));
    expect(api.onDocumentChanged(() => undefined)).toEqual(expect.any(Function));
    expect(api.onAssistantEvent(() => undefined)).toEqual(expect.any(Function));
    expect(getCurrentWorkspace).toHaveBeenCalledTimes(1);
    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(readDocument).toHaveBeenCalledWith("README.md");
    expect(saveDocument).toHaveBeenCalledWith({
      relativePath: "README.md",
      title: "README",
      markdown: "Body",
    });
    expect(watchDocument).toHaveBeenCalledWith("README.md");
    expect(getAssistantThread).toHaveBeenCalledWith("README.md");
    expect(sendAssistantMessage).toHaveBeenCalledWith({
      noteRelativePath: "README.md",
      content: "Summarize this note",
      documentTitle: "README",
      documentMarkdown: "Body",
    });
    expect(cancelAssistantRun).toHaveBeenCalledWith("README.md");
    expect(onDocumentChanged).toHaveBeenCalledTimes(1);
    expect(onWorkspaceChanged).toHaveBeenCalledTimes(1);
    expect(onAssistantEvent).toHaveBeenCalledTimes(1);
  });
});
