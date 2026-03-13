import type { Workspace } from "../types";

export const MOCK_ASSISTANT_REPLIES = [
  "I would turn that into a short summary, then separate next steps into a compact checklist.",
  "A calmer version would keep the structure, tighten the opening, and make the action items more explicit.",
  "The strongest next draft is a cleaner headline, one framing paragraph, and a smaller set of bullets.",
  "That reads well as a workspace note. I would simplify the middle section and pull the code example into its own block.",
] as const;

export const seededWorkspaces: Workspace[] = [
  {
    id: "workspace-product",
    name: "Product docs",
    description: "Planning notes, release docs, and research snippets for the core workspace product.",
    initialFileId: "doc-launch-brief",
    defaultExpandedFolderIds: ["folder-root-product", "folder-product-specs", "folder-product-research"],
    tree: [
      {
        id: "folder-root-product",
        type: "folder",
        name: "Workspace",
        children: [
          {
            id: "folder-product-specs",
            type: "folder",
            name: "Specs",
            children: [
              {
                id: "file-launch-brief",
                type: "file",
                name: "Launch brief.md",
                fileId: "doc-launch-brief",
              },
              {
                id: "file-editor-flow",
                type: "file",
                name: "Editor flow.md",
                fileId: "doc-editor-flow",
              },
            ],
          },
          {
            id: "folder-product-research",
            type: "folder",
            name: "Research",
            children: [
              {
                id: "file-competitive-notes",
                type: "file",
                name: "Competitive notes.md",
                fileId: "doc-competitive-notes",
              },
            ],
          },
          {
            id: "file-changelog-ritual",
            type: "file",
            name: "Changelog ritual.md",
            fileId: "doc-changelog-ritual",
          },
        ],
      },
    ],
    documents: [
      {
        id: "doc-launch-brief",
        title: "Launch brief.md",
        path: "specs/launch-brief.md",
        summary: "A short framing note for the desktop workspace prototype.",
        lastEdited: "Edited 12 Mar, 09:42",
        blocks: [
          {
            id: "block-launch-1",
            type: "heading",
            level: 1,
            text: "Launch brief",
          },
          {
            id: "block-launch-2",
            type: "paragraph",
            runs: [
              { text: "Mohio should feel like a calm desktop workspace for notes, chat, and structure." },
            ],
          },
          {
            id: "block-launch-3",
            type: "paragraph",
            runs: [
              { text: "Keep the first release focused on a " },
              { text: "clear writing surface", bold: true },
              { text: ", a lightweight workspace browser, and a useful side conversation panel." },
            ],
          },
          {
            id: "block-launch-4",
            type: "heading",
            level: 2,
            text: "Interaction notes",
          },
          {
            id: "block-launch-5",
            type: "bullet-list",
            items: [
              [{ text: "Let the tree feel familiar to Obsidian users without copying its density." }],
              [{ text: "Make the main pane read like a real document, even when it is only mock content." }],
              [{ text: "Use the right panel for fast prompts and visible assistant replies." }],
            ],
          },
          {
            id: "block-launch-6",
            type: "code",
            language: "tsx",
            code: "function WorkspaceShell() {\n  return <AppLayout left={<Tree />} main={<Document />} right={<Chat />} />;\n}",
          },
        ],
      },
      {
        id: "doc-editor-flow",
        title: "Editor flow.md",
        path: "specs/editor-flow.md",
        summary: "Notes on how the document panel should feel during early onboarding.",
        lastEdited: "Edited 12 Mar, 08:15",
        blocks: [
          {
            id: "block-flow-1",
            type: "heading",
            level: 1,
            text: "Editor flow",
          },
          {
            id: "block-flow-2",
            type: "paragraph",
            runs: [
              { text: "The center panel does not need a real editor yet. It only needs the posture of one." },
            ],
          },
          {
            id: "block-flow-3",
            type: "bullet-list",
            items: [
              [{ text: "Readable title and metadata at the top." }],
              [{ text: "Wide but controlled document measure." }],
              [{ text: "Styled headings, strong paragraphs, and a clear code block treatment." }],
            ],
          },
        ],
      },
      {
        id: "doc-competitive-notes",
        title: "Competitive notes.md",
        path: "research/competitive-notes.md",
        summary: "A quick read on what to borrow and what to avoid from adjacent tools.",
        lastEdited: "Edited 11 Mar, 18:26",
        blocks: [
          {
            id: "block-research-1",
            type: "heading",
            level: 1,
            text: "Competitive notes",
          },
          {
            id: "block-research-2",
            type: "paragraph",
            runs: [
              { text: "Users like an Obsidian-style shell because the file tree feels legible and local." },
            ],
          },
          {
            id: "block-research-3",
            type: "paragraph",
            runs: [
              { text: "Where many tools become noisy is the lack of spacing and too many simultaneous accents." },
            ],
          },
          {
            id: "block-research-4",
            type: "bullet-list",
            items: [
              [{ text: "Borrow the desktop layout." }],
              [{ text: "Avoid visual clutter in utility chrome." }],
              [{ text: "Keep the main surface document-first." }],
            ],
          },
        ],
      },
      {
        id: "doc-changelog-ritual",
        title: "Changelog ritual.md",
        path: "changelog-ritual.md",
        summary: "A mock note describing how release updates should be assembled.",
        lastEdited: "Edited 10 Mar, 17:04",
        blocks: [
          {
            id: "block-change-1",
            type: "heading",
            level: 1,
            text: "Changelog ritual",
          },
          {
            id: "block-change-2",
            type: "paragraph",
            runs: [
              { text: "Release notes should read as a narrative of what changed and why it matters." },
            ],
          },
          {
            id: "block-change-3",
            type: "paragraph",
            runs: [
              { text: "Start with the user-facing change, then follow with one short implementation note in " },
              { text: "bold", bold: true },
              { text: " if it helps with credibility." },
            ],
          },
        ],
      },
    ],
    chatMessages: [
      {
        id: "chat-product-1",
        role: "assistant",
        content: "I can help reshape a note, suggest structure, or draft a calmer summary from the current workspace context.",
        createdAt: "09:12",
      },
      {
        id: "chat-product-2",
        role: "user",
        content: "Keep the desktop prototype simple and avoid pretending the mock editor is fully interactive.",
        createdAt: "09:14",
      },
    ],
  },
  {
    id: "workspace-editorial",
    name: "Editorial studio",
    description: "Campaign drafts, narrative framing, and publishing notes.",
    initialFileId: "doc-homepage-narrative",
    defaultExpandedFolderIds: ["folder-root-editorial", "folder-editorial-drafts"],
    tree: [
      {
        id: "folder-root-editorial",
        type: "folder",
        name: "Workspace",
        children: [
          {
            id: "folder-editorial-drafts",
            type: "folder",
            name: "Drafts",
            children: [
              {
                id: "file-homepage-narrative",
                type: "file",
                name: "Homepage narrative.md",
                fileId: "doc-homepage-narrative",
              },
              {
                id: "file-primer",
                type: "file",
                name: "Messaging primer.md",
                fileId: "doc-messaging-primer",
              },
            ],
          },
          {
            id: "file-publishing-style",
            type: "file",
            name: "Publishing style.md",
            fileId: "doc-publishing-style",
          },
        ],
      },
    ],
    documents: [
      {
        id: "doc-homepage-narrative",
        title: "Homepage narrative.md",
        path: "drafts/homepage-narrative.md",
        summary: "Mock homepage framing for the team knowledge product.",
        lastEdited: "Edited 12 Mar, 10:08",
        blocks: [
          {
            id: "block-home-1",
            type: "heading",
            level: 1,
            text: "Homepage narrative",
          },
          {
            id: "block-home-2",
            type: "paragraph",
            runs: [
              { text: "Mohio gives small teams a document workspace that feels direct, calm, and portable." },
            ],
          },
          {
            id: "block-home-3",
            type: "paragraph",
            runs: [
              { text: "The message should sound " },
              { text: "editorial rather than glossy", bold: true },
              { text: ", with enough product clarity to feel trustworthy." },
            ],
          },
        ],
      },
      {
        id: "doc-messaging-primer",
        title: "Messaging primer.md",
        path: "drafts/messaging-primer.md",
        summary: "A compact tone and framing reference.",
        lastEdited: "Edited 11 Mar, 14:32",
        blocks: [
          {
            id: "block-primer-1",
            type: "heading",
            level: 1,
            text: "Messaging primer",
          },
          {
            id: "block-primer-2",
            type: "bullet-list",
            items: [
              [{ text: "Write for small teams, not enterprise buyers." }],
              [{ text: "Prefer explicit product language over broad promises." }],
              [{ text: "Keep the AI story visible but secondary to the document workflow." }],
            ],
          },
        ],
      },
      {
        id: "doc-publishing-style",
        title: "Publishing style.md",
        path: "publishing-style.md",
        summary: "Rules for what a shareable draft should look like.",
        lastEdited: "Edited 10 Mar, 16:41",
        blocks: [
          {
            id: "block-style-1",
            type: "heading",
            level: 1,
            text: "Publishing style",
          },
          {
            id: "block-style-2",
            type: "paragraph",
            runs: [
              { text: "A published draft should read like a stable team note, not an internal scratchpad." },
            ],
          },
          {
            id: "block-style-3",
            type: "code",
            language: "md",
            code: "## Rule of thumb\n\nShip the smallest clear draft, then refine it later.",
          },
        ],
      },
    ],
    chatMessages: [
      {
        id: "chat-editorial-1",
        role: "assistant",
        content: "Use this panel to tighten story structure, reduce repetition, or draft alternative messaging.",
        createdAt: "10:01",
      },
    ],
  },
];
