import type {
  DraftChange,
  Jot,
  Proposal,
  RelatedLink,
  Snapshot,
  WikiPage,
  WorkspaceView,
} from "../types";

export const initialWorkspaceView: WorkspaceView = "Scratchpad";

export const workspacePeople = [
  { id: "ol", name: "Oliver", role: "Product" },
  { id: "ma", name: "Marta", role: "Design" },
  { id: "pk", name: "Priya", role: "Engineering" },
];

export const initialJots: Jot[] = [
  {
    id: "jot-release-feedback",
    title: "Customer rollout notes",
    preview: "Three pilot teams asked for a decision log, plus clearer handoff notes between drafts and published updates.",
    content: `# Customer rollout notes

- Three pilot teams wanted a lightweight decision log.
- People understand jots quickly, but they lose context when a wiki page changes later.
- Product and engineering both asked for a publish checklist inside the shared wiki.
`,
    updatedAt: "10 minutes ago",
    status: "Needs review",
    proposalIds: ["proposal-decision-log"],
    relatedPageIds: ["page-release-checklist", "page-workspace-model"],
  },
  {
    id: "jot-onboarding",
    title: "New teammate onboarding",
    preview: "Capture the exact first-week workflow: scratchpad first, then AI proposal review, then explicit publish.",
    content: `# New teammate onboarding

The workspace should explain the path:

1. Capture rough notes in the scratchpad.
2. Review AI proposals instead of editing shared pages blindly.
3. Publish intentionally when the change is ready for the team wiki.
`,
    updatedAt: "1 hour ago",
    status: "Processed",
    proposalIds: ["proposal-onboarding-edit"],
    relatedPageIds: ["page-team-handbook", "page-proposal-flow"],
  },
  {
    id: "jot-linking",
    title: "Context trail between pages",
    preview: "Related pages and backlinks are doing more orientation work than a deep navigation tree.",
    content: `# Context trail between pages

The navigation should feel local.

- Keep recents visible.
- Show related pages from the active page.
- Surface backlinks so people know why a page matters right now.
`,
    updatedAt: "Yesterday",
    status: "New",
    proposalIds: ["proposal-linking-pass"],
    relatedPageIds: ["page-workspace-model", "page-team-handbook"],
  },
];

export const initialPages: WikiPage[] = [
  {
    id: "page-team-handbook",
    title: "Team Handbook.md",
    space: "Shared Wiki",
    summary: "Shared norms for writing, publishing, and maintaining knowledge in Mohio.",
    content: `# Team Handbook

Mohio gives teams one document workspace for personal capture and shared knowledge.

## Working agreement

- Start in the scratchpad when notes are rough.
- Use proposals to turn personal notes into shared pages.
- Publish shared updates explicitly after review.

## Writing guidance

- Use short sections with clear headings.
- Link related pages where readers may need context.
- Keep page histories understandable by summarising why the change matters.
`,
    publishedContent: `# Team Handbook

Mohio gives teams one document workspace for personal capture and shared knowledge.

## Working agreement

- Start in the scratchpad when notes are rough.
- Use proposals to turn personal notes into shared pages.
- Publish shared updates explicitly after review.

## Writing guidance

- Use short sections with clear headings.
- Link related pages where readers may need context.
`,
    status: "Draft updates",
    lastEditedAt: "22 minutes ago",
    lastEditedBy: "Oliver",
    relatedPageIds: ["page-proposal-flow", "page-workspace-model"],
    backlinkIds: ["page-release-checklist"],
    snapshotIds: ["snapshot-handbook-1", "snapshot-handbook-2"],
  },
  {
    id: "page-proposal-flow",
    title: "Proposal Workflow.md",
    space: "Shared Wiki",
    summary: "How Mohio turns rough notes into reviewable shared knowledge changes.",
    content: `# Proposal Workflow

Mohio keeps AI visible and reviewable.

## Proposal review

1. Select a jot or page that needs structure.
2. Review the proposed change and the affected pages.
3. Stage the change only if the diff makes sense.
4. Publish when the workspace draft is ready to share.

## Trust boundaries

- AI can suggest edits, links, and new pages.
- AI cannot publish for the team.
- Every shared change should have a readable diff.
`,
    publishedContent: `# Proposal Workflow

Mohio keeps AI visible and reviewable.

## Proposal review

1. Select a jot or page that needs structure.
2. Review the proposed change and the affected pages.
3. Stage the change only if the diff makes sense.

## Trust boundaries

- AI can suggest edits, links, and new pages.
- AI cannot publish for the team.
`,
    status: "Draft updates",
    lastEditedAt: "45 minutes ago",
    lastEditedBy: "Priya",
    relatedPageIds: ["page-team-handbook", "page-release-checklist", "page-workspace-model"],
    backlinkIds: ["page-team-handbook"],
    snapshotIds: ["snapshot-proposal-1"],
  },
  {
    id: "page-release-checklist",
    title: "Release Checklist.md",
    space: "Shared Wiki",
    summary: "Checklist for moving structured knowledge from draft to published team guidance.",
    content: `# Release Checklist

## Before publish

- Confirm affected pages are linked.
- Review page history for recent changes.
- Make sure the proposal summary explains why the update matters.

## Publish notes

- Publishing updates the shared wiki.
- Snapshots remain visible at page level.
`,
    publishedContent: `# Release Checklist

## Before publish

- Confirm affected pages are linked.
- Review page history for recent changes.

## Publish notes

- Publishing updates the shared wiki.
`,
    status: "Draft updates",
    lastEditedAt: "2 hours ago",
    lastEditedBy: "Marta",
    relatedPageIds: ["page-proposal-flow", "page-team-handbook"],
    backlinkIds: ["page-workspace-model"],
    snapshotIds: ["snapshot-release-1"],
  },
  {
    id: "page-workspace-model",
    title: "Workspace Model.md",
    space: "Shared Wiki",
    summary: "Core objects and layout decisions behind Mohio’s scratchpad, wiki, proposal, and history views.",
    content: `# Workspace Model

Mohio is built around a few primary objects:

- Jots for personal capture
- Wiki pages for canonical shared knowledge
- Proposals for AI-assisted changes
- Snapshots for visible page history

## Layout

- The left side keeps orientation simple.
- The center is always the main writing surface.
- The right side provides surrounding context, not distraction.
`,
    publishedContent: `# Workspace Model

Mohio is built around a few primary objects:

- Jots for personal capture
- Wiki pages for canonical shared knowledge
- Proposals for AI-assisted changes
- Snapshots for visible page history

## Layout

- The left side keeps orientation simple.
- The center is always the main writing surface.
`,
    status: "Draft updates",
    lastEditedAt: "Yesterday",
    lastEditedBy: "Oliver",
    relatedPageIds: ["page-team-handbook", "page-proposal-flow", "page-release-checklist"],
    backlinkIds: ["page-proposal-flow"],
    snapshotIds: ["snapshot-model-1"],
  },
];

export const initialProposals: Proposal[] = [
  {
    id: "proposal-decision-log",
    title: "Create Decision Log.md",
    kind: "new-page",
    status: "Pending review",
    sourceJotId: "jot-release-feedback",
    summary: "Propose a new shared page for recording product decisions from pilot rollouts.",
    rationale: "The latest rollout notes repeatedly mention decisions getting lost between scratchpad capture and published guidance.",
    affectedPageIds: ["page-release-checklist"],
    suggestedLinks: ["Release Checklist.md"],
    updatedAt: "12 minutes ago",
    createdPage: {
      id: "page-decision-log",
      title: "Decision Log.md",
      space: "Shared Wiki",
      summary: "A lightweight record of important product and workflow decisions made in jots and reviews.",
      content: `# Decision Log

A lightweight record of product and workflow decisions that start in jots and then become shared guidance.

## Why it exists

- Rollout notes often create decisions before the wiki catches up.
- Publishing should point readers to the latest decision context.

## Current decisions

- Every shared change should have a readable proposal summary.
- Release guidance should link to the page that explains why a decision was made.
`,
      publishedContent: "",
      status: "Draft updates",
      lastEditedAt: "Just now",
      lastEditedBy: "AI proposal",
      relatedPageIds: ["page-release-checklist", "page-proposal-flow"],
      backlinkIds: [],
      snapshotIds: [],
    },
    diff: [
      { id: "d1", kind: "add", text: "+ # Decision Log" },
      { id: "d2", kind: "add", text: "+ " },
      { id: "d3", kind: "add", text: "+ A lightweight record of product and workflow decisions." },
      { id: "d4", kind: "add", text: "+ " },
      { id: "d5", kind: "add", text: "+ ## Why it exists" },
      { id: "d6", kind: "add", text: "+ - Rollout notes create decisions before the wiki catches up." },
      { id: "d7", kind: "add", text: "+ - Publishing should point readers to the latest decision context." },
    ],
  },
  {
    id: "proposal-onboarding-edit",
    title: "Tighten proposal review guidance",
    kind: "page-edit",
    status: "Pending review",
    sourceJotId: "jot-onboarding",
    summary: "Update the Proposal Workflow page so onboarding emphasizes staging and explicit publish.",
    rationale: "New teammates need a clearer explanation of the trust boundary between AI suggestions and the shared wiki.",
    affectedPageIds: ["page-proposal-flow"],
    suggestedLinks: ["Team Handbook.md", "Release Checklist.md"],
    updatedAt: "38 minutes ago",
    appliedContent: {
      "page-proposal-flow": `# Proposal Workflow

Mohio keeps AI visible and reviewable.

## Proposal review

1. Select a jot or page that needs structure.
2. Review the proposed change and the affected pages.
3. Stage the change only if the diff makes sense and the affected pages are right.
4. Publish when the workspace draft is ready to share.

## Trust boundaries

- AI can suggest edits, links, and new pages.
- AI cannot publish for the team.
- Every shared change should have a readable diff.
- Published pages should always show who made the latest change.
`,
    },
    diff: [
      { id: "o1", kind: "context", text: "  ## Proposal review" },
      { id: "o2", kind: "context", text: "  1. Select a jot or page that needs structure." },
      { id: "o3", kind: "remove", text: "- 3. Stage the change only if the diff makes sense." },
      { id: "o4", kind: "add", text: "+ 3. Stage the change only if the diff makes sense and the affected pages are right." },
      { id: "o5", kind: "add", text: "+ 4. Publish when the workspace draft is ready to share." },
      { id: "o6", kind: "context", text: "  " },
      { id: "o7", kind: "context", text: "  ## Trust boundaries" },
      { id: "o8", kind: "add", text: "+ - Published pages should always show who made the latest change." },
    ],
  },
  {
    id: "proposal-linking-pass",
    title: "Add context links between handbook and workspace model",
    kind: "link-suggestion",
    status: "Pending review",
    sourceJotId: "jot-linking",
    summary: "Suggest cross-links so navigation remains local without losing page context.",
    rationale: "The current pages mention layout and working agreements separately, but readers benefit from explicit links between them.",
    affectedPageIds: ["page-team-handbook", "page-workspace-model"],
    suggestedLinks: ["Workspace Model.md", "Team Handbook.md"],
    updatedAt: "Yesterday",
    appliedContent: {
      "page-team-handbook": `# Team Handbook

Mohio gives teams one document workspace for personal capture and shared knowledge.

## Working agreement

- Start in the scratchpad when notes are rough.
- Use proposals to turn personal notes into shared pages.
- Publish shared updates explicitly after review.

## Writing guidance

- Use short sections with clear headings.
- Link related pages where readers may need context.
- Keep page histories understandable by summarising why the change matters.
- See Workspace Model.md for how the three-panel layout supports related context.
`,
      "page-workspace-model": `# Workspace Model

Mohio is built around a few primary objects:

- Jots for personal capture
- Wiki pages for canonical shared knowledge
- Proposals for AI-assisted changes
- Snapshots for visible page history

## Layout

- The left side keeps orientation simple.
- The center is always the main writing surface.
- The right side provides surrounding context, not distraction.
- Team Handbook.md explains the publishing norms behind this layout.
`,
    },
    diff: [
      { id: "l1", kind: "context", text: "  ## Writing guidance" },
      { id: "l2", kind: "add", text: "+ - See Workspace Model.md for how the three-panel layout supports related context." },
      { id: "l3", kind: "context", text: "  " },
      { id: "l4", kind: "context", text: "  ## Layout" },
      { id: "l5", kind: "add", text: "+ - Team Handbook.md explains the publishing norms behind this layout." },
    ],
  },
];

export const initialSnapshots: Snapshot[] = [
  {
    id: "snapshot-handbook-1",
    pageId: "page-team-handbook",
    summary: "Initial shared writing guidance",
    changedBy: "Oliver",
    changedAt: "3 days ago",
    source: "Publish",
    diffPreview: ["Created the handbook structure and shared working agreement."],
  },
  {
    id: "snapshot-handbook-2",
    pageId: "page-team-handbook",
    summary: "Added page history guidance",
    changedBy: "Marta",
    changedAt: "Yesterday",
    source: "AI proposal",
    diffPreview: ["Added language about summarising why a change matters in history."],
  },
  {
    id: "snapshot-proposal-1",
    pageId: "page-proposal-flow",
    summary: "Defined staged proposal review",
    changedBy: "Priya",
    changedAt: "2 days ago",
    source: "Direct edit",
    diffPreview: ["Added the staged review sequence for proposal acceptance."],
  },
  {
    id: "snapshot-release-1",
    pageId: "page-release-checklist",
    summary: "Added publish checklist",
    changedBy: "Oliver",
    changedAt: "Yesterday",
    source: "Publish",
    diffPreview: ["Introduced the publish notes section for shared changes."],
  },
  {
    id: "snapshot-model-1",
    pageId: "page-workspace-model",
    summary: "Captured the core workspace objects",
    changedBy: "Oliver",
    changedAt: "4 days ago",
    source: "Publish",
    diffPreview: ["Established jots, wiki pages, proposals, and snapshots as the key objects."],
  },
];

export const initialRelatedLinks: RelatedLink[] = [
  {
    id: "link-handbook-proposals",
    fromPageId: "page-team-handbook",
    toPageId: "page-proposal-flow",
    label: "Proposal Workflow.md",
    reason: "The handbook sets team norms; this page explains the AI review process behind them.",
  },
  {
    id: "link-handbook-model",
    fromPageId: "page-team-handbook",
    toPageId: "page-workspace-model",
    label: "Workspace Model.md",
    reason: "Readers often need the product model behind the writing and publishing norms.",
  },
  {
    id: "link-model-release",
    fromPageId: "page-workspace-model",
    toPageId: "page-release-checklist",
    label: "Release Checklist.md",
    reason: "The layout model leads directly into the shared publish review flow.",
  },
  {
    id: "link-proposal-release",
    fromPageId: "page-proposal-flow",
    toPageId: "page-release-checklist",
    label: "Release Checklist.md",
    reason: "Proposal staging becomes publish review once the workspace draft is ready.",
  },
];

export const initialDraftChanges: DraftChange[] = [
  {
    id: "draft-handbook",
    targetType: "page",
    targetId: "page-team-handbook",
    title: "Team Handbook.md",
    summary: "Unsaved shared guidance about readable page histories.",
    source: "Direct edit",
    updatedAt: "22 minutes ago",
  },
  {
    id: "draft-proposal-flow",
    targetType: "page",
    targetId: "page-proposal-flow",
    title: "Proposal Workflow.md",
    summary: "Workspace draft includes explicit publish language.",
    source: "Direct edit",
    updatedAt: "45 minutes ago",
  },
];
