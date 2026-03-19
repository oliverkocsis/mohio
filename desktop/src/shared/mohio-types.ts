export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

export interface MohioApi {
  getAppInfo: () => AppInfo;
}
