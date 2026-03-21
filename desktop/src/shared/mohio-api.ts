import type { AppInfo, MohioApi, WorkspaceSummary } from "./mohio-types";

export const MOHIO_CHANNELS = {
  getCurrentWorkspace: "mohio:workspace:get-current",
  openWorkspace: "mohio:workspace:open",
  workspaceChanged: "mohio:workspace:changed",
} as const;

interface CreateMohioApiOptions {
  appInfo: AppInfo;
  getCurrentWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspace: () => Promise<WorkspaceSummary | null>;
  onWorkspaceChanged: (
    listener: (workspace: WorkspaceSummary | null) => void,
  ) => () => void;
}

export function createMohioApi({
  appInfo,
  getCurrentWorkspace,
  openWorkspace,
  onWorkspaceChanged,
}: CreateMohioApiOptions): MohioApi {
  return {
    getAppInfo: () => appInfo,
    getCurrentWorkspace,
    openWorkspace,
    onWorkspaceChanged,
  };
}
