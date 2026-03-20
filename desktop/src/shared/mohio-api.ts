import type { AppInfo, MohioApi, WorkspaceSummary } from "./mohio-types";

export const MOHIO_CHANNELS = {
  getCurrentWorkspace: "mohio:workspace:get-current",
  openWorkspace: "mohio:workspace:open",
} as const;

interface CreateMohioApiOptions {
  appInfo: AppInfo;
  getCurrentWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspace: () => Promise<WorkspaceSummary | null>;
}

export function createMohioApi({
  appInfo,
  getCurrentWorkspace,
  openWorkspace,
}: CreateMohioApiOptions): MohioApi {
  return {
    getAppInfo: () => appInfo,
    getCurrentWorkspace,
    openWorkspace,
  };
}
