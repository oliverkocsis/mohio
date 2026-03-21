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
  displayTitle: string;
}

export type WorkspaceTreeNode = WorkspaceDirectoryNode | WorkspaceDocumentNode;

export interface WorkspaceSummary {
  name: string;
  path: string;
  documents: WorkspaceTreeNode[];
  documentCount: number;
}

export interface WorkspaceDocument {
  relativePath: string;
  fileName: string;
  displayTitle: string;
  markdown: string;
  frontmatterTitle?: string;
}

export interface SaveDocumentInput {
  relativePath: string;
  title: string;
  markdown: string;
}

export interface SaveDocumentResult {
  relativePath: string;
  fileName: string;
  displayTitle: string;
  markdown: string;
  savedAt: string;
}

export interface MohioApi {
  getAppInfo: () => AppInfo;
  getCurrentWorkspace: () => Promise<WorkspaceSummary | null>;
  openWorkspace: () => Promise<WorkspaceSummary | null>;
  readDocument: (relativePath: string) => Promise<WorkspaceDocument>;
  saveDocument: (input: SaveDocumentInput) => Promise<SaveDocumentResult>;
  onWorkspaceChanged: (
    listener: (workspace: WorkspaceSummary | null) => void,
  ) => () => void;
}
