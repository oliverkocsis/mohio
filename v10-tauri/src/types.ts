export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string;
  accent: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  path: string;
  updatedAt: string;
  markdown: string;
}

export interface FolderNode {
  id: string;
  kind: "folder";
  name: string;
  children: TreeNode[];
}

export interface FileNode {
  id: string;
  kind: "file";
  name: string;
  fileId: string;
}

export type TreeNode = FolderNode | FileNode;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface WorkspaceData extends WorkspaceSummary {
  tree: TreeNode[];
  documents: Record<string, DocumentRecord>;
  defaultExpandedFolderIds: string[];
  initialFileId: string;
  chatSeed: ChatMessage[];
}
