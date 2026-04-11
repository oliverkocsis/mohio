import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createRecentWorkspaceStore } from "./recent-workspaces";

describe("recent-workspaces", () => {
  it("stores workspace paths by most recent order with dedupe and max size", async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "mohio-recent-workspaces-"));
    const storageFilePath = path.join(tempDirectory, "recent-workspaces.json");
    const store = createRecentWorkspaceStore({
      maxEntries: 5,
      storageFilePath,
    });

    await store.rememberWorkspacePath("/workspace/one");
    await store.rememberWorkspacePath("/workspace/two");
    await store.rememberWorkspacePath("/workspace/three");
    await store.rememberWorkspacePath("/workspace/four");
    await store.rememberWorkspacePath("/workspace/five");
    await store.rememberWorkspacePath("/workspace/six");
    await store.rememberWorkspacePath("/workspace/three");

    await expect(store.listRecentWorkspacePaths()).resolves.toEqual([
      "/workspace/three",
      "/workspace/six",
      "/workspace/five",
      "/workspace/four",
      "/workspace/two",
    ]);
  });
});
