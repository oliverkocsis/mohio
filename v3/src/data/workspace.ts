import type {
  ActivityEvent,
  AgentMessage,
  AgentSuggestion,
  PageTreeNode,
  WorkspacePage,
} from "../types";

export const workspaceTree: PageTreeNode[] = [
  {
    id: "root-guides",
    label: "Guides",
    icon: "G",
    children: [
      { id: "page-proposal-workflow", label: "Proposal Workflow", icon: "P" },
      { id: "page-release-checklist", label: "Release Checklist", icon: "R" },
    ],
  },
  {
    id: "root-strategy",
    label: "Strategy",
    icon: "S",
    children: [{ id: "page-agent-patterns", label: "Agent Patterns", icon: "A" }],
  },
];

export const initialPages: WorkspacePage[] = [
  {
    id: "page-proposal-workflow",
    title: "Proposal Workflow",
    icon: "P",
    parentLabel: "Guides",
    sectionLabel: "Team playbook",
    summary: "How Mohio turns rough team notes into durable shared guidance with visible AI review.",
    lastUpdated: "Today, 17:10",
    collaborators: ["OL", "AS", "JM"],
    isDraft: false,
    changeSummary: "Published copy is current.",
    history: [
      "Today · Editorial pass clarified how review works before publishing.",
      "Yesterday · Added publish language for shared changes.",
    ],
    blocks: [
      {
        id: "workflow-heading",
        type: "heading",
        level: 2,
        text: "How the workspace should feel",
      },
      {
        id: "workflow-paragraph",
        type: "paragraph",
        text: "The flagship experience should let a teammate refine a shared page while an agent proposes edits, extracts decisions, and keeps every change visible before it becomes canonical.",
      },
      {
        id: "workflow-checklist",
        type: "checklist",
        title: "Editorial review",
        items: [
          { id: "check-1", text: "Start from a document, not from a blank AI chat.", checked: true },
          { id: "check-2", text: "Keep AI suggestions explicit and reversible.", checked: true },
          { id: "check-3", text: "Show draft state clearly in the page chrome.", checked: false },
        ],
      },
      {
        id: "workflow-callout",
        type: "callout",
        tone: "ai",
        label: "AI boundary",
        text: "Assistant changes should land in draft state first, with a compact summary that explains what changed and why.",
      },
      {
        id: "workflow-diff",
        type: "diff",
        label: "Latest suggestion preview",
        lines: [
          "- Proposal review lives in a separate workflow.",
          "+ Proposal review happens next to the page, so trust stays local and visible.",
        ],
      },
    ],
  },
  {
    id: "page-release-checklist",
    title: "Release Checklist",
    icon: "R",
    parentLabel: "Guides",
    sectionLabel: "Operational notes",
    summary: "A lightweight checklist for turning a draft into a shared page without losing review context.",
    lastUpdated: "Yesterday, 14:32",
    collaborators: ["OL", "AS"],
    isDraft: false,
    changeSummary: "Published copy is current.",
    history: [
      "Yesterday · Added change-summary note for AI-assisted edits.",
      "2 days ago · Simplified the pre-publish checklist.",
    ],
    blocks: [
      {
        id: "release-heading",
        type: "heading",
        level: 2,
        text: "Before shared rollout",
      },
      {
        id: "release-paragraph",
        type: "paragraph",
        text: "The release checklist exists to make publishing feel deliberate without pulling people into Git concepts or heavyweight approval rituals.",
      },
      {
        id: "release-checklist",
        type: "checklist",
        title: "Checklist",
        items: [
          { id: "release-1", text: "Confirm the page summary reflects the final draft.", checked: true },
          { id: "release-2", text: "Check recent history for overlapping edits.", checked: false },
          { id: "release-3", text: "Call out what the assistant changed in plain language.", checked: false },
        ],
      },
      {
        id: "release-callout",
        type: "callout",
        tone: "warning",
        label: "Trust note",
        text: "The publish button should never be the first moment a reader understands what the AI changed.",
      },
    ],
  },
  {
    id: "page-agent-patterns",
    title: "Agent Patterns",
    icon: "A",
    parentLabel: "Strategy",
    sectionLabel: "Product direction",
    summary: "Reference patterns for making Mohio feel assistive, fast, and document-centric instead of chat-centric.",
    lastUpdated: "Monday, 11:08",
    collaborators: ["OL", "JM", "PL"],
    isDraft: true,
    changeSummary: "Draft compares Codex desktop sidecars with page-first editing.",
    history: [
      "Monday · Added concepts for quick actions and agent logs.",
      "Friday · Reframed the workspace from notes app to knowledge cockpit.",
    ],
    blocks: [
      {
        id: "agent-heading",
        type: "heading",
        level: 2,
        text: "Desired product blend",
      },
      {
        id: "agent-paragraph",
        type: "paragraph",
        text: "Mohio should look like a serious writing workspace first. The assistant belongs beside the page, offering actions and suggestions that improve the document without hijacking it.",
      },
      {
        id: "agent-callout",
        type: "callout",
        tone: "info",
        label: "Direction",
        text: "Borrow Codex's visible action model and Notion's spatial calm, but avoid a terminal-heavy interface.",
      },
    ],
  },
];

export const initialMessages: AgentMessage[] = [
  {
    id: "message-1",
    role: "assistant",
    pageId: "page-proposal-workflow",
    author: "Mohio Agent",
    text: "I found one gap in this page: the draft state is mentioned, but the workflow does not explicitly say the assistant writes into draft before publish.",
    timestamp: "17:04",
  },
  {
    id: "message-2",
    role: "user",
    pageId: "page-proposal-workflow",
    author: "Oliver",
    text: "Tighten that section and keep the explanation close to the editor, not in a separate review screen.",
    timestamp: "17:05",
  },
  {
    id: "message-3",
    role: "assistant",
    pageId: "page-release-checklist",
    author: "Mohio Agent",
    text: "This checklist could say more clearly that change summaries are part of the trust boundary, not just release hygiene.",
    timestamp: "14:28",
  },
  {
    id: "message-4",
    role: "assistant",
    pageId: "page-agent-patterns",
    author: "Mohio Agent",
    text: "The current strategy page is strong, but the examples could show how action chips map back to the page surface.",
    timestamp: "11:01",
  },
];

export const initialSuggestions: AgentSuggestion[] = [
  {
    id: "suggestion-draft-boundary",
    pageId: "page-proposal-workflow",
    title: "Clarify draft-first trust boundary",
    summary: "Tighten the page intro so the assistant's role is explicit before anything is published.",
    actionLabel: "Apply wording",
    status: "pending",
    preview: [
      "Add one sentence about AI suggestions landing in draft state.",
      "Keep the explanation close to the page surface instead of a separate workflow.",
    ],
    applyChange: {
      type: "replace-block-text",
      blockId: "workflow-paragraph",
      text: "The flagship experience should let a teammate refine a shared page while an agent proposes edits, extracts decisions, and writes every accepted suggestion into draft state before anything is published to the shared wiki.",
    },
  },
  {
    id: "suggestion-history-step",
    pageId: "page-release-checklist",
    title: "Add review-history reminder",
    summary: "Turn the checklist into a stronger trust surface by adding a final history review step.",
    actionLabel: "Add checklist item",
    status: "pending",
    preview: [
      "Append a reminder to compare the latest draft summary with recent history.",
    ],
    applyChange: {
      type: "append-checklist-item",
      blockId: "release-checklist",
      text: "Compare the final draft summary with the latest visible history entry.",
    },
  },
  {
    id: "suggestion-action-model",
    pageId: "page-agent-patterns",
    title: "Name the action-chip pattern",
    summary: "Make the Codex influence more concrete with a short sentence about action chips.",
    actionLabel: "Apply wording",
    status: "pending",
    preview: [
      "Add a sentence describing compact action chips that operate on the page in context.",
    ],
    applyChange: {
      type: "replace-block-text",
      blockId: "agent-paragraph",
      text: "Mohio should look like a serious writing workspace first. The assistant belongs beside the page, offering action chips and specific suggestions that improve the document without hijacking it.",
    },
  },
];

export const initialActivity: ActivityEvent[] = [
  {
    id: "activity-1",
    pageId: "page-proposal-workflow",
    type: "prompt",
    message: "Agent inspected the current page and suggested a draft-first clarification.",
    timestamp: "17:04",
  },
  {
    id: "activity-2",
    pageId: "page-release-checklist",
    type: "prompt",
    message: "Agent spotted a missing release-history reminder.",
    timestamp: "14:28",
  },
];

export const quickActions = ["Summarize", "Propose edit", "Extract tasks", "Create linked page"];
