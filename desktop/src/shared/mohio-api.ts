import type { AppInfo, MohioApi } from "./mohio-types";

export function createMohioApi(appInfo: AppInfo): MohioApi {
  return {
    getAppInfo: () => appInfo,
  };
}
