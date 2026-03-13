import type { WorkspaceData } from "../types";

const productOverview = `# Q2 workspace overview

Mohio keeps strategy notes, research summaries, and launch checklists in one calm desktop workspace.

## What is in this workspace

- A shared view of roadmap priorities
- A lighter research backlog for new interviews
- A launch checklist that teams can skim quickly

### Writing style

This prototype uses **simple formatted text** instead of a real editor. It is enough to model how the surface should feel inside a Tauri desktop app.

\`\`\`ts
const launchWindow = {
  milestone: "Beta desktop preview",
  owner: "Core product",
  status: "Tracking",
};
\`\`\`
`;

const interviewNotes = `# Interview notes

Teams want a workspace that feels closer to a document app than a wiki.

## Signals

- People liked the 3-pane layout
- The chat panel should stay secondary to the document
- Folder depth needs to remain readable at a glance

### Next draft

Use a cleaner visual rhythm, fewer chrome-heavy controls, and more breathing room between sections.
`;

const launchChecklist = `# Launch checklist

The goal is a believable desktop prototype, not production functionality.

## Must-have states

- Workspace switcher at the bottom of the left rail
- Read-only document preview in the center
- Mock chat input with generated assistant replies

## Nice-to-have polish

- Subtle shadows and low-contrast panel borders
- Clear active states for files and workspaces
- Code blocks that feel editor-adjacent without becoming an editor
`;

const studioBrief = `# Studio handbook

This workspace models a second example vault so switching workspaces feels real.

## Focus areas

- Design critiques
- Content production
- Ops checklists

Use **mock data** everywhere so the prototype remains easy to extend later with Tauri commands.
`;

const campaignPlan = `# Campaign plan

The right rail supports quick discussion without overwhelming the document.

## Messaging themes

- Calm tooling
- Fast navigation
- Clear ownership

\`\`\`json
{
  "audience": "small teams",
  "tone": "professional",
  "surface": "desktop-first"
}
\`\`\`
`;

export const WORKSPACES: WorkspaceData[] = [
  {
    id: "product-hq",
    name: "Product HQ",
    description: "Roadmap, research, and launch prep",
    accent: "#155eef",
    initialFileId: "doc-overview",
    defaultExpandedFolderIds: ["planning", "research", "planning-roadmap"],
    documents: {
      "doc-overview": {
        id: "doc-overview",
        title: "Q2 workspace overview",
        path: "Planning/Roadmap/Q2 workspace overview.md",
        updatedAt: "Mar 12, 2026",
        markdown: productOverview,
      },
      "doc-interviews": {
        id: "doc-interviews",
        title: "Interview notes",
        path: "Research/Interview notes.md",
        updatedAt: "Mar 10, 2026",
        markdown: interviewNotes,
      },
      "doc-launch": {
        id: "doc-launch",
        title: "Launch checklist",
        path: "Planning/Launch/Launch checklist.md",
        updatedAt: "Mar 8, 2026",
        markdown: launchChecklist,
      },
    },
    tree: [
      {
        id: "planning",
        kind: "folder",
        name: "Planning",
        children: [
          {
            id: "planning-roadmap",
            kind: "folder",
            name: "Roadmap",
            children: [
              {
                id: "file-overview",
                kind: "file",
                name: "Q2 workspace overview.md",
                fileId: "doc-overview",
              },
            ],
          },
          {
            id: "planning-launch",
            kind: "folder",
            name: "Launch",
            children: [
              {
                id: "file-launch",
                kind: "file",
                name: "Launch checklist.md",
                fileId: "doc-launch",
              },
            ],
          },
        ],
      },
      {
        id: "research",
        kind: "folder",
        name: "Research",
        children: [
          {
            id: "file-interviews",
            kind: "file",
            name: "Interview notes.md",
            fileId: "doc-interviews",
          },
        ],
      },
    ],
    chatSeed: [
      {
        id: "chat-1",
        role: "assistant",
        content: "Morning sync: the current prototype is focused on layout, mock data, and a clean desktop shell.",
        timestamp: "09:12",
      },
      {
        id: "chat-2",
        role: "user",
        content: "Can you keep the chat panel lightweight and avoid overpowering the document view?",
        timestamp: "09:13",
      },
      {
        id: "chat-3",
        role: "assistant",
        content: "Yes. I will keep it narrow, use subtle surfaces, and treat it as a supporting panel.",
        timestamp: "09:13",
      },
    ],
  },
  {
    id: "studio-ops",
    name: "Studio Ops",
    description: "Campaign planning and design operations",
    accent: "#087443",
    initialFileId: "doc-studio",
    defaultExpandedFolderIds: ["ops", "campaigns"],
    documents: {
      "doc-studio": {
        id: "doc-studio",
        title: "Studio handbook",
        path: "Ops/Studio handbook.md",
        updatedAt: "Mar 9, 2026",
        markdown: studioBrief,
      },
      "doc-campaign": {
        id: "doc-campaign",
        title: "Campaign plan",
        path: "Campaigns/Spring/Campaign plan.md",
        updatedAt: "Mar 11, 2026",
        markdown: campaignPlan,
      },
    },
    tree: [
      {
        id: "ops",
        kind: "folder",
        name: "Ops",
        children: [
          {
            id: "file-studio",
            kind: "file",
            name: "Studio handbook.md",
            fileId: "doc-studio",
          },
        ],
      },
      {
        id: "campaigns",
        kind: "folder",
        name: "Campaigns",
        children: [
          {
            id: "campaigns-spring",
            kind: "folder",
            name: "Spring",
            children: [
              {
                id: "file-campaign",
                kind: "file",
                name: "Campaign plan.md",
                fileId: "doc-campaign",
              },
            ],
          },
        ],
      },
    ],
    chatSeed: [
      {
        id: "chat-4",
        role: "assistant",
        content: "This workspace is tuned for design operations and content planning.",
        timestamp: "11:05",
      },
      {
        id: "chat-5",
        role: "user",
        content: "Show a different document set when I switch workspaces.",
        timestamp: "11:06",
      },
    ],
  },
];
