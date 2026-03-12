export interface Checkpoint {
  id: string;
  name: string;
  note?: string;
  content: string;
  createdAt: string;
}

export interface PublishedSnapshot {
  id: string;
  content: string;
  publishedAt: string;
}

export interface WorkspaceFile {
  id: string;
  path: string;
  title: string;
  content: string;
  updatedAt: string;
  publishedAt: string | null;
  pinned: boolean;
  checkpoints: Checkpoint[];
  lastPublished: PublishedSnapshot | null;
}

export interface ProposalChange {
  id: string;
  type: "update" | "create";
  fileId: string;
  path: string;
  title: string;
  summary: string;
  beforeContent?: string;
  afterContent: string;
}

export interface AgentProposal {
  id: string;
  prompt: string;
  summary: string;
  rationale: string;
  status: "pending" | "applied" | "discarded";
  createdAt: string;
  changes: ProposalChange[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  proposalId?: string;
}

export interface SearchResult {
  id: string;
  fileId: string;
  kind: "filename" | "content";
  title: string;
  path: string;
  excerpt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  files: WorkspaceFile[];
  chatMessages: ChatMessage[];
  proposals: AgentProposal[];
  suggestedPrompts: string[];
  recentFileIds: string[];
}

export interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  selectedFile: WorkspaceFile;
  searchQuery: string;
  activeProposal: AgentProposal | null;
  desktopMeta: {
    appVersion: string;
    electronVersion: string;
    platform: string;
  };
  openWorkspace: (workspaceId: string) => void;
  selectFile: (fileId: string) => void;
  setSearchQuery: (query: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (title?: string) => string;
  renameFile: (fileId: string, nextTitle: string) => void;
  deleteFile: (fileId: string) => void;
  createCheckpoint: (fileId: string, name: string, note?: string) => void;
  restoreCheckpoint: (fileId: string, checkpointId: string) => void;
  publishFile: (fileId: string) => void;
  submitAgentPrompt: (prompt: string) => void;
  applyProposal: (proposalId: string) => void;
  discardProposal: (proposalId: string) => void;
}
