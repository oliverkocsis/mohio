export interface TextRun {
  text: string;
  bold?: boolean;
}

export type DocumentBlock =
  | {
      id: string;
      type: "heading";
      level: 1 | 2 | 3;
      text: string;
    }
  | {
      id: string;
      type: "paragraph";
      runs: TextRun[];
    }
  | {
      id: string;
      type: "bullet-list";
      items: TextRun[][];
    }
  | {
      id: string;
      type: "code";
      language: string;
      code: string;
    };

export interface WorkspaceDocument {
  id: string;
  title: string;
  path: string;
  summary: string;
  lastEdited: string;
  blocks: DocumentBlock[];
}

export interface WorkspaceTreeFolderNode {
  id: string;
  type: "folder";
  name: string;
  children: WorkspaceTreeNode[];
}

export interface WorkspaceTreeFileNode {
  id: string;
  type: "file";
  name: string;
  fileId: string;
}

export type WorkspaceTreeNode = WorkspaceTreeFolderNode | WorkspaceTreeFileNode;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  initialFileId: string;
  defaultExpandedFolderIds: string[];
  tree: WorkspaceTreeNode[];
  documents: WorkspaceDocument[];
  chatMessages: ChatMessage[];
}
