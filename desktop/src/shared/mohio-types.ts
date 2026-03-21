export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

export interface WorkspaceNodeBase {
  id: string;
  name: string;
  relativePath: string;
}

export interface WorkspaceDirectoryNode extends WorkspaceNodeBase {
  kind: "directory";
  children: WorkspaceTreeNode[];
}

export interface WorkspaceDocumentNode extends WorkspaceNodeBase {
  kind: "document";
}

export type WorkspaceTreeNode = WorkspaceDirectoryNode | WorkspaceDocumentNode;

export interface WorkspaceSummary {
  name: string;
  path: string;
  documents: WorkspaceTreeNode[];
  documentCount: number;
}

export interface MohioApi {
  getAppInfo: () => AppInfo;
  getCurrentWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspace: () => Promise<WorkspaceSummary | null>;
  onWorkspaceChanged: (
    listener: (workspace: WorkspaceSummary | null) => void,
  ) => () => void;
}
