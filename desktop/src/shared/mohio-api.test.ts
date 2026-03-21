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
    const onWorkspaceChanged = vi.fn().mockReturnValue(() => undefined);

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
      onWorkspaceChanged,
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
    expect(api.onWorkspaceChanged(() => undefined)).toEqual(expect.any(Function));
    expect(getCurrentWorkspace).toHaveBeenCalledTimes(1);
    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(readDocument).toHaveBeenCalledWith("README.md");
    expect(saveDocument).toHaveBeenCalledWith({
      relativePath: "README.md",
      title: "README",
      markdown: "Body",
    });
    expect(onWorkspaceChanged).toHaveBeenCalledTimes(1);
  });
});
