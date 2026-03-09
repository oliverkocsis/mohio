import type { Jot, Proposal, WikiPage } from "../types";

export const initialJots: Jot[] = [
  {
    id: "jot-rollout",
    title: "Pilot rollout notes",
    content: `Pilot teams keep asking where recent decisions live.

- They understand jots.
- They want a shared page for decisions.
- Release guidance should link back to decision context.`,
    updatedAt: "12 min ago",
    status: "Needs review",
  },
  {
    id: "jot-onboarding",
    title: "Onboarding flow",
    content: `New teammates should learn one loop:

1. Capture in scratchpad.
2. Review proposal.
3. Update shared wiki with confidence.`,
    updatedAt: "43 min ago",
    status: "Needs review",
  },
  {
    id: "jot-layout",
    title: "Layout thought",
    content: `The workspace should stay simple.

The right panel should show only the change that matters right now.`,
    updatedAt: "Yesterday",
    status: "Processed",
  },
];

export const initialPages: WikiPage[] = [
  {
    id: "page-handbook",
    title: "Team Handbook.md",
    summary: "Shared norms for how the team captures, reviews, and publishes knowledge.",
    content: `# Team Handbook

- Start with a jot when the idea is rough.
- Review changes before they become shared knowledge.
- Keep pages short and linked.`,
    relatedTitles: ["Proposal Workflow.md"],
  },
  {
    id: "page-proposals",
    title: "Proposal Workflow.md",
    summary: "How Mohio turns a personal jot into a reviewable shared update.",
    content: `# Proposal Workflow

1. Capture a jot.
2. Review the proposal.
3. Accept the proposed wiki updates.

AI suggests. People decide.`,
    relatedTitles: ["Team Handbook.md"],
  },
  {
    id: "page-release",
    title: "Release Checklist.md",
    summary: "Checklist for making shared updates feel explicit and trustworthy.",
    content: `# Release Checklist

- Check which pages are affected.
- Read the diff before sharing.
- Link readers to the right context.`,
    relatedTitles: ["Proposal Workflow.md"],
  },
];

export const initialProposals: Proposal[] = [
  {
    id: "proposal-rollout",
    title: "Create a decision log and link release guidance",
    sourceJotId: "jot-rollout",
    summary: "Turn rollout notes into a new shared Decision Log page and update release guidance to link to it.",
    rationale: "Multiple pilot notes point to decisions being made in private jots without a durable shared destination.",
    affectedPageIds: ["page-release"],
    status: "Pending review",
    createdPage: {
      id: "page-decisions",
      title: "Decision Log.md",
      summary: "A small shared page for recording the decisions that emerge from notes and reviews.",
      content: `# Decision Log

- Record important product and workflow decisions.
- Link release guidance back to this page when context matters.
- Keep entries lightweight and readable.`,
      relatedTitles: ["Release Checklist.md"],
    },
    pageUpdates: {
      "page-release": `# Release Checklist

- Check which pages are affected.
- Read the diff before sharing.
- Link readers to the right context.
- Link to Decision Log.md when the update depends on a recent decision.`,
    },
    diff: [
      { id: "r1", kind: "add", text: "+ Create Decision Log.md as a shared destination for rollout decisions" },
      { id: "r2", kind: "context", text: "  Release Checklist.md" },
      { id: "r3", kind: "add", text: "+ Link to Decision Log.md when the update depends on a recent decision." },
    ],
  },
  {
    id: "proposal-onboarding",
    title: "Tighten the shared onboarding loop",
    sourceJotId: "jot-onboarding",
    summary: "Update the handbook and proposal workflow so the jot → proposal → wiki path is obvious to new teammates.",
    rationale: "The workspace becomes more trustworthy when the first-time experience explains the trust boundary clearly.",
    affectedPageIds: ["page-handbook", "page-proposals"],
    status: "Pending review",
    pageUpdates: {
      "page-handbook": `# Team Handbook

- Start with a jot when the idea is rough.
- Review changes before they become shared knowledge.
- Keep pages short and linked.
- Teach new teammates the jot → proposal → wiki flow early.`,
      "page-proposals": `# Proposal Workflow

1. Capture a jot.
2. Review the proposal.
3. Accept the proposed wiki updates.
4. Polish the resulting wiki page if needed.

AI suggests. People decide.`,
    },
    diff: [
      { id: "o1", kind: "context", text: "  Team Handbook.md" },
      { id: "o2", kind: "add", text: "+ Teach new teammates the jot → proposal → wiki flow early." },
      { id: "o3", kind: "context", text: "  Proposal Workflow.md" },
      { id: "o4", kind: "add", text: "+ 4. Polish the resulting wiki page if needed." },
    ],
  },
];
