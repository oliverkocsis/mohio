export type BlockType = "heading" | "paragraph" | "checklist" | "callout" | "diff";

export interface HeadingBlock {
  id: string;
  type: "heading";
  text: string;
  level: 2 | 3;
}

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistBlock {
  id: string;
  type: "checklist";
  title: string;
  items: ChecklistItem[];
}

export interface CalloutBlock {
  id: string;
  type: "callout";
  tone: "info" | "ai" | "warning";
  label: string;
  text: string;
}

export interface DiffBlock {
  id: string;
  type: "diff";
  label: string;
  lines: string[];
}

export type PageBlock =
  | HeadingBlock
  | ParagraphBlock
  | ChecklistBlock
  | CalloutBlock
  | DiffBlock;

export interface WorkspacePage {
  id: string;
  title: string;
  icon: string;
  parentLabel: string;
  sectionLabel: string;
  summary: string;
  blocks: PageBlock[];
  lastUpdated: string;
  collaborators: string[];
  isDraft: boolean;
  changeSummary: string;
  history: string[];
}

export interface PageTreeNode {
  id: string;
  label: string;
  icon: string;
  children?: PageTreeNode[];
}

export interface AgentMessage {
  id: string;
  role: "assistant" | "user";
  pageId: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface AgentSuggestion {
  id: string;
  pageId: string;
  title: string;
  summary: string;
  actionLabel: string;
  status: "pending" | "applied" | "dismissed";
  preview: string[];
  applyChange: {
    type: "replace-block-text" | "append-checklist-item";
    blockId: string;
    text: string;
  };
}

export interface ActivityEvent {
  id: string;
  pageId: string;
  type: "applied" | "dismissed" | "prompt";
  message: string;
  timestamp: string;
}
