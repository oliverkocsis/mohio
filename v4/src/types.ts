export type JotStatus = "New" | "Needs review" | "Processed";

export interface Jot {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  status: JotStatus;
}

export interface WikiPage {
  id: string;
  title: string;
  summary: string;
  content: string;
  relatedTitles: string[];
}

export interface DiffChunk {
  id: string;
  kind: "context" | "add" | "remove";
  text: string;
}

export interface Proposal {
  id: string;
  title: string;
  sourceJotId: string;
  summary: string;
  rationale: string;
  affectedPageIds: string[];
  diff: DiffChunk[];
  status: "Pending review" | "Accepted";
  createdPage?: WikiPage;
  pageUpdates?: Record<string, string>;
}
