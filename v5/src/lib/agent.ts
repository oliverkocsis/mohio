import { buildPathFromTitle, ensureMarkdownTitle } from "./markdown";
import type { AgentProposal, ProposalChange, Workspace, WorkspaceFile } from "../types";

interface AgentInput {
  prompt: string;
  workspace: Workspace;
  currentFile: WorkspaceFile;
  timestamp: string;
  createId: (prefix: string) => string;
}

interface AgentOutput {
  proposal: AgentProposal;
  reply: string;
}

export function generateAgentProposal({
  prompt,
  workspace,
  currentFile,
  timestamp,
  createId,
}: AgentInput): AgentOutput {
  const normalized = prompt.toLowerCase();
  const intent = detectIntent(normalized);

  let changes: ProposalChange[];
  let summary: string;
  let rationale: string;
  let reply: string;

  if (intent === "create") {
    const nextTitle = ensureMarkdownTitle(extractRequestedTitle(prompt) ?? `Summary of ${currentFile.title.replace(/\.md$/i, "")}`);
    const nextPath = buildPathFromTitle(null, nextTitle);
    const nextContent = buildCreatedNoteContent(currentFile, workspace, prompt);
    changes = [
      {
        id: createId("change"),
        type: "create",
        fileId: createId("file"),
        path: nextPath,
        title: nextTitle,
        summary: "Create a new note that packages the requested material into a shareable draft.",
        afterContent: nextContent,
      },
    ];
    summary = `Create ${nextTitle} from the current workspace context.`;
    rationale = "The prompt asks for a new artifact, so the safest action is to draft a separate Markdown note instead of overwriting the current one.";
    reply = `I drafted a new note proposal for ${nextTitle}. Review the content before applying it to the workspace.`;
  } else {
    const afterContent = buildUpdatedContent(currentFile, intent, prompt);
    changes = [
      {
        id: createId("change"),
        type: "update",
        fileId: currentFile.id,
        path: currentFile.path,
        title: currentFile.title,
        summary: changeSummaryForIntent(intent),
        beforeContent: currentFile.content,
        afterContent,
      },
    ];
    summary = proposalSummaryForIntent(intent, currentFile.title);
    rationale = rationaleForIntent(intent);
    reply = `I prepared a reviewable edit for ${currentFile.title}. It stays explicit: nothing changes until you apply the proposal.`;
  }

  return {
    proposal: {
      id: createId("proposal"),
      prompt,
      summary,
      rationale,
      status: "pending",
      createdAt: timestamp,
      changes,
    },
    reply,
  };
}

function detectIntent(normalizedPrompt: string): "summarize" | "rewrite" | "organize" | "expand" | "create" {
  if (normalizedPrompt.includes("create") || normalizedPrompt.includes("new note") || normalizedPrompt.includes("new file")) {
    return "create";
  }
  if (normalizedPrompt.includes("rewrite")) {
    return "rewrite";
  }
  if (normalizedPrompt.includes("organize")) {
    return "organize";
  }
  if (normalizedPrompt.includes("expand")) {
    return "expand";
  }
  return "summarize";
}

function extractRequestedTitle(prompt: string): string | null {
  const match = prompt.match(/(?:create|draft)(?: a| an| new)?(?: note| file)?(?: called| named)?\s+["']?([^"'.\n]+)["']?/i);
  return match?.[1]?.trim() ?? null;
}

function buildCreatedNoteContent(currentFile: WorkspaceFile, workspace: Workspace, prompt: string): string {
  const related = workspace.files
    .filter((file) => file.id !== currentFile.id)
    .slice(0, 2)
    .map((file) => `- [${file.title.replace(/\.md$/i, "")}](./${file.path})`)
    .join("\n");

  return `# ${extractRequestedTitle(prompt) ?? `Summary of ${currentFile.title.replace(/\.md$/i, "")}`}

## Why this note exists

- Captures the request: ${prompt.trim()}
- Starts from the current draft: ${currentFile.title}
- Keeps the shared update separate from the private working note

## Working summary

${summarizeParagraph(currentFile.content)}

## Related workspace links

${related || "- Add related notes after review."}
`;
}

function buildUpdatedContent(file: WorkspaceFile, intent: "summarize" | "rewrite" | "organize" | "expand", prompt: string): string {
  const trimmed = file.content.trim();

  if (intent === "rewrite") {
    return `${trimmed}

## Clearer draft

This rewrite keeps the same intent but tightens the language, reduces repetition, and makes the next action easier to scan.

- Preserve the core point from the original note.
- Remove vague filler.
- End with a more direct handoff.`;
  }

  if (intent === "organize") {
    return `# ${file.title.replace(/\.md$/i, "")}

## Current focus

${summarizeParagraph(trimmed)}

## Key points

${extractBullets(trimmed)}

## Next steps

- Review the structure.
- Tighten any unclear sections.
- Publish when the shared version is ready.`;
  }

  if (intent === "expand") {
    return `${trimmed}

## Expanded detail

The agent added one more layer of explanation so the note can stand on its own for a teammate who has not seen the surrounding conversation.

- Explain the decision context.
- Clarify the intended audience.
- Capture the follow-up required after publishing.`;
  }

  return `# ${file.title.replace(/\.md$/i, "")}

## Summary

${summarizeParagraph(trimmed)}

## Source note

${trimmed}`;
}

function summarizeParagraph(content: string): string {
  const firstParagraph = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find(Boolean);

  return firstParagraph ?? "Add a short summary after reviewing the draft.";
}

function extractBullets(content: string): string {
  const bullets = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ") || /^\d+\./.test(line))
    .slice(0, 4);

  if (bullets.length > 0) {
    return bullets.join("\n");
  }

  return "- Pull the key ideas from the current draft.\n- Keep the reading flow explicit.\n- Leave the raw Markdown editable.";
}

function changeSummaryForIntent(intent: "summarize" | "rewrite" | "organize" | "expand"): string {
  if (intent === "rewrite") {
    return "Tighten the note into clearer language.";
  }
  if (intent === "organize") {
    return "Restructure the note into a clearer document shape.";
  }
  if (intent === "expand") {
    return "Add more explanatory detail without publishing it automatically.";
  }
  return "Turn the draft into a concise summary while keeping the source visible.";
}

function proposalSummaryForIntent(intent: "summarize" | "rewrite" | "organize" | "expand", title: string): string {
  if (intent === "rewrite") {
    return `Rewrite ${title} for clearer shared reading.`;
  }
  if (intent === "organize") {
    return `Organize ${title} into a cleaner structure.`;
  }
  if (intent === "expand") {
    return `Expand ${title} with more supporting detail.`;
  }
  return `Summarize ${title} into a shareable draft.`;
}

function rationaleForIntent(intent: "summarize" | "rewrite" | "organize" | "expand"): string {
  if (intent === "rewrite") {
    return "Rewrite is safest as a reviewable draft so the user can keep the original language until they approve the change.";
  }
  if (intent === "organize") {
    return "Organization changes affect readability more than meaning, so they fit well into an explicit proposal step.";
  }
  if (intent === "expand") {
    return "Expansion can drift from the original intent, so the added detail should remain reviewable before it becomes the new draft.";
  }
  return "Summary requests usually aim to make the note easier to share without losing the original raw Markdown context.";
}
