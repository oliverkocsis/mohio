# Mohio (working name)

Mohio is an open-source, desktop + mobile, team knowledge workspace that feels like Confluence/Notion to use, but stores everything as plain Markdown in a Git repository.

It’s built for teams who want a **single source of truth** that is:
- **Shareable** with teammates (like Confluence),
- **Offline-first** and fast (like Obsidian),
- **Portable and future-proof** (it’s just a repo of Markdown),
- **LLM-native** (Codex/Claude Code/Gemini-style agents can propose changes as diffs you can review and approve).

## The core idea

Your workspace is a GitHub repo (first target). Each page is a Markdown file.

Git provides the superpowers (history, diffs, branching, merging, rollback). Mohio hides the complexity and presents a non-technical UX: spaces, pages, drafts, publishing, and guided conflict resolution.

## How collaboration works (no real-time, by design)

Mohio is intentionally **async**:
- You edit locally (offline-friendly).
- Draft changes are saved to a personal drafts branch and pushed so they appear on your other devices.
- Publishing moves approved draft changes into the published branch.

### Drafts, approval, and publishing (Git-backed, UI-first)

- **Drafts**: edits live on a per-user branch (e.g. `drafts/<username>`), auto-committed and pushed for cross-device sync.
- **LLM edits**: the chat proposes edits as a *reviewable diff*. You must approve before it becomes a commit.
- **Publish**: a Confluence-like button that applies selected draft changes onto `main` and pushes to GitHub.
- **Conflicts**: rare but expected. When they happen, Mohio presents a guided, modern merge UI (and can optionally ask an LLM to propose a resolution you still approve).

## What makes it different

### Versus Notion / Confluence
- No lock-in: pages are real files you own.
- Every change is reviewable and reversible (diffs + history).
- AI isn’t a side panel; it’s the primary editing workflow (diff → approve → publish).

### Versus Obsidian
- Team-first workflows: drafts, publishing, and review.
- Sharing is built-in via GitHub, without requiring teammates to understand Git.

## LLM-first (bring your own provider)

Mohio is designed to work with best-in-class coding/document agents:
- Codex-style document editing (diff-based, multi-file when needed)
- Claude Code-style workflows
- Optional additional providers (e.g. Gemini)

Provider configuration is intended to be per-workspace and user-controlled (BYOK), so teams can choose the model that matches their policies and budget.

## Non-goals (initially)

- Real-time collaborative editing
- Notion-style databases/relations
- Heavy rich media workflows (start text-first: Markdown + Mermaid diagrams)
- Hosted service / enterprise compliance features (Git history is the baseline audit trail)

