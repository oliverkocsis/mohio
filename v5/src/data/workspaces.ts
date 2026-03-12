import type { Workspace } from "../types";

export const seededWorkspaces: Workspace[] = [
  {
    id: "workspace-launch",
    name: "Product Launch",
    description: "A sample workspace for launch planning, research, and publish-ready drafts.",
    recentFileIds: ["launch-brief", "publish-checklist", "interviews"],
    suggestedPrompts: [
      "Summarize this note for a shared update",
      "Organize this draft into clearer sections",
      "Create a launch FAQ note",
    ],
    chatMessages: [
      {
        id: "chat-launch-1",
        role: "assistant",
        content: "Ask me to summarize, rewrite, organize, expand, or create a new Markdown note from this workspace.",
        createdAt: "2026-03-11 09:00",
      },
    ],
    proposals: [],
    files: [
      {
        id: "launch-brief",
        path: "briefs/launch-brief.md",
        title: "Launch Brief.md",
        updatedAt: "2026-03-11 08:45",
        publishedAt: "2026-03-10 17:20",
        pinned: true,
        checkpoints: [
          {
            id: "checkpoint-launch-1",
            name: "Before partner review",
            note: "Keeps the shorter brief before the FAQ section was added.",
            content: `# Launch brief

## Positioning

Mohio keeps Markdown workspaces calm, explicit, and easy to own.
`,
            createdAt: "2026-03-10 16:10",
          },
        ],
        lastPublished: {
          id: "published-launch-1",
          content: `# Launch brief

## Positioning

Mohio keeps Markdown workspaces calm, explicit, and easy to own.

## Read before publishing

- Check [Plan publish checklist](../plans/publish-checklist.md)
- Review [User interview highlights](../research/user-interviews.md)
`,
          publishedAt: "2026-03-10 17:20",
        },
        content: `# Launch brief

## Positioning

Mohio keeps Markdown workspaces calm, explicit, and easy to own.

## Read before publishing

- Check [Plan publish checklist](../plans/publish-checklist.md)
- Review [User interview highlights](../research/user-interviews.md)

## Draft emphasis

The current draft needs a sharper explanation of why checkpoints and publish are separate actions.`,
      },
      {
        id: "publish-checklist",
        path: "plans/publish-checklist.md",
        title: "Publish Checklist.md",
        updatedAt: "2026-03-10 15:40",
        publishedAt: "2026-03-10 15:40",
        pinned: true,
        checkpoints: [],
        lastPublished: {
          id: "published-checklist-1",
          content: `# Publish checklist

- Confirm the current draft is ready.
- Create a checkpoint before larger structural edits.
- Publish only when the shared version should change.
`,
          publishedAt: "2026-03-10 15:40",
        },
        content: `# Publish checklist

- Confirm the current draft is ready.
- Create a checkpoint before larger structural edits.
- Publish only when the shared version should change.
`,
      },
      {
        id: "interviews",
        path: "research/user-interviews.md",
        title: "User Interview Highlights.md",
        updatedAt: "2026-03-09 13:10",
        publishedAt: null,
        pinned: false,
        checkpoints: [],
        lastPublished: null,
        content: `# User interview highlights

Three themes kept repeating:

- Teams want local Markdown, not another closed document store.
- Publish should feel deliberate, not automatic.
- The editor should stay readable without hiding raw Markdown.`,
      },
    ],
  },
  {
    id: "workspace-editorial",
    name: "Editorial Studio",
    description: "Sample planning notes for campaign copy, content structure, and linked drafts.",
    recentFileIds: ["campaign-plan", "homepage-story", "style-guide"],
    suggestedPrompts: [
      "Rewrite this note for a calmer tone",
      "Expand this draft with a sharper conclusion",
      "Create a summary note for leadership",
    ],
    chatMessages: [
      {
        id: "chat-editorial-1",
        role: "assistant",
        content: "I can turn draft notes into clearer Markdown while keeping every action reviewable.",
        createdAt: "2026-03-11 09:00",
      },
    ],
    proposals: [],
    files: [
      {
        id: "campaign-plan",
        path: "calendar/april-campaign.md",
        title: "April Campaign.md",
        updatedAt: "2026-03-11 07:55",
        publishedAt: null,
        pinned: true,
        checkpoints: [],
        lastPublished: null,
        content: `# April campaign

Anchor story: the workspace feels like a serious writing tool, not a developer IDE.

- Link the narrative back to [Homepage story](./drafts/homepage-story.md)
- Keep the publishing story explicit
- Mention checkpoints without over-explaining them`,
      },
      {
        id: "homepage-story",
        path: "drafts/homepage-story.md",
        title: "Homepage Story.md",
        updatedAt: "2026-03-10 18:05",
        publishedAt: "2026-03-10 18:05",
        pinned: false,
        checkpoints: [],
        lastPublished: {
          id: "published-homepage-story",
          content: `# Homepage story

Mohio gives small teams a calm Markdown workspace with AI help that stays reviewable.
`,
          publishedAt: "2026-03-10 18:05",
        },
        content: `# Homepage story

Mohio gives small teams a calm Markdown workspace with AI help that stays reviewable.

## Supporting draft

The homepage copy should sound editorial and trustworthy, not glossy.`,
      },
      {
        id: "style-guide",
        path: "guides/style-guide.md",
        title: "Style Guide.md",
        updatedAt: "2026-03-09 10:20",
        publishedAt: null,
        pinned: false,
        checkpoints: [],
        lastPublished: null,
        content: `# Style guide

- Prefer calm, explicit language.
- Avoid chatty interface labels.
- Keep the writing surface central.`,
      },
    ],
  },
  {
    id: "workspace-ops",
    name: "Ops Handbook",
    description: "Bundled runbooks and linked process notes for onboarding and incident prep.",
    recentFileIds: ["onboarding", "incident-response", "comms-policy"],
    suggestedPrompts: [
      "Organize this process note",
      "Summarize this page for new teammates",
      "Create a quick-reference note",
    ],
    chatMessages: [
      {
        id: "chat-ops-1",
        role: "assistant",
        content: "Use the right panel to draft a quick-reference note or tighten an existing process page.",
        createdAt: "2026-03-11 09:00",
      },
    ],
    proposals: [],
    files: [
      {
        id: "onboarding",
        path: "runbooks/onboarding.md",
        title: "Onboarding.md",
        updatedAt: "2026-03-08 12:00",
        publishedAt: "2026-03-08 12:00",
        pinned: true,
        checkpoints: [],
        lastPublished: {
          id: "published-onboarding",
          content: `# Onboarding

- Start in [Communication policy](./policies/communication.md)
- Review [Incident response](./runbooks/incident-response.md)
- Capture questions in a new note
`,
          publishedAt: "2026-03-08 12:00",
        },
        content: `# Onboarding

- Start in [Communication policy](./policies/communication.md)
- Review [Incident response](./runbooks/incident-response.md)
- Capture questions in a new note
`,
      },
      {
        id: "incident-response",
        path: "runbooks/incident-response.md",
        title: "Incident Response.md",
        updatedAt: "2026-03-07 18:30",
        publishedAt: null,
        pinned: false,
        checkpoints: [],
        lastPublished: null,
        content: `# Incident response

When a draft becomes operational guidance, publish it intentionally and keep the checkpoint that preceded the change.`,
      },
      {
        id: "comms-policy",
        path: "policies/communication.md",
        title: "Communication Policy.md",
        updatedAt: "2026-03-06 14:15",
        publishedAt: null,
        pinned: false,
        checkpoints: [],
        lastPublished: null,
        content: `# Communication policy

- Write updates in plain language.
- Keep shared notes easy to scan.
- Prefer explicit links between related runbooks.`,
      },
    ],
  },
];
