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
        },
      ],
      documentCount: 1,
    };

    const getCurrentWorkspace = vi.fn().mockResolvedValue(workspace);
    const openWorkspace = vi.fn().mockResolvedValue(workspace);
    const onWorkspaceChanged = vi.fn().mockReturnValue(() => undefined);

    const api = createMohioApi({
      appInfo: {
        name: "Mohio",
        version: "0.1.0",
        platform: "darwin",
      },
      getCurrentWorkspace,
      openWorkspace,
      onWorkspaceChanged,
    });

    expect(api.getAppInfo()).toEqual({
      name: "Mohio",
      version: "0.1.0",
      platform: "darwin",
    });
    await expect(api.getCurrentWorkspace()).resolves.toEqual(workspace);
    await expect(api.openWorkspace()).resolves.toEqual(workspace);
    expect(api.onWorkspaceChanged(() => undefined)).toEqual(expect.any(Function));
    expect(getCurrentWorkspace).toHaveBeenCalledTimes(1);
    expect(openWorkspace).toHaveBeenCalledTimes(1);
    expect(onWorkspaceChanged).toHaveBeenCalledTimes(1);
  });
});
