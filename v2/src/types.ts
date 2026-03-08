export type JotStatus = "New" | "Processed" | "Needs review" | "Archived";

export interface Jot {
  id: string;
  title: string;
  preview: string;
  content: string;
  updatedAt: string;
  status: JotStatus;
  proposalIds: string[];
  relatedPageIds: string[];
}

export interface WikiPage {
  id: string;
  title: string;
  space: string;
  summary: string;
  content: string;
  publishedContent: string;
  status: "Published" | "Draft updates";
  lastEditedAt: string;
  lastEditedBy: string;
  relatedPageIds: string[];
  backlinkIds: string[];
  snapshotIds: string[];
}

export interface DiffChunk {
  id: string;
  kind: "context" | "add" | "remove";
  text: string;
}

export interface Proposal {
  id: string;
  title: string;
  kind: "new-page" | "page-edit" | "link-suggestion";
  status: "Pending review" | "Staged" | "Rejected" | "Published";
  sourceJotId?: string;
  summary: string;
  rationale: string;
  affectedPageIds: string[];
  suggestedLinks: string[];
  diff: DiffChunk[];
  appliedContent?: Record<string, string>;
  createdPage?: WikiPage;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  pageId: string;
  summary: string;
  changedBy: string;
  changedAt: string;
  source: "Direct edit" | "AI proposal" | "Publish";
  diffPreview: string[];
}

export interface RelatedLink {
  id: string;
  fromPageId: string;
  toPageId: string;
  label: string;
  reason: string;
}

export interface DraftChange {
  id: string;
  targetType: "page" | "proposal";
  targetId: string;
  title: string;
  summary: string;
  source: "AI proposal" | "Direct edit";
  updatedAt: string;
}

export type WorkspaceView = "Scratchpad" | "Wiki" | "Proposals" | "Publish";

export type ContextPanelView = "Related" | "Backlinks" | "Proposal" | "History";
