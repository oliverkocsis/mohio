import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

interface RecentWorkspaceStoreData {
  version: 1;
  workspaces: string[];
}

interface CreateRecentWorkspaceStoreInput {
  maxEntries: number;
  storageFilePath: string;
}

interface RecentWorkspaceStore {
  listRecentWorkspacePaths: () => Promise<string[]>;
  rememberWorkspacePath: (workspacePath: string) => Promise<void>;
}

const DEFAULT_STORE_DATA: RecentWorkspaceStoreData = {
  version: 1,
  workspaces: [],
};

export function createRecentWorkspaceStore({
  maxEntries,
  storageFilePath,
}: CreateRecentWorkspaceStoreInput): RecentWorkspaceStore {
  let writeQueue: Promise<void> = Promise.resolve();

  const readStoreData = async (): Promise<RecentWorkspaceStoreData> => {
    try {
      const raw = await readFile(storageFilePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<RecentWorkspaceStoreData> | null;
      const workspaces = Array.isArray(parsed?.workspaces)
        ? parsed.workspaces.filter((entry): entry is string => typeof entry === "string")
        : [];
      return {
        version: 1,
        workspaces,
      };
    } catch {
      return DEFAULT_STORE_DATA;
    }
  };

  const writeStoreData = async (data: RecentWorkspaceStoreData): Promise<void> => {
    await mkdir(path.dirname(storageFilePath), { recursive: true });
    await writeFile(storageFilePath, JSON.stringify(data, null, 2), "utf8");
  };

  return {
    listRecentWorkspacePaths: async () => {
      const data = await readStoreData();
      return data.workspaces.slice(0, maxEntries);
    },
    rememberWorkspacePath: async (workspacePath: string) => {
      const normalizedPath = workspacePath.trim();
      if (!normalizedPath) {
        return;
      }

      writeQueue = writeQueue
        .catch(() => undefined)
        .then(async () => {
          const data = await readStoreData();
          const deduped = data.workspaces.filter((entry) => entry !== normalizedPath);
          const nextWorkspaces = [normalizedPath, ...deduped].slice(0, maxEntries);
          await writeStoreData({
            version: 1,
            workspaces: nextWorkspaces,
          });
        });

      await writeQueue;
    },
  };
}
