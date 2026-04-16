import { Plugin } from "obsidian";

// TODO: Implement Mohio Git Sync plugin.
// Feature spec: docs/features/review-history-publish-and-sync.md
//
// Planned capabilities:
// - Git-backed snapshot commits on manual Sync action
//   - Commit message format: "Snapshot: <ISO date-time>"
//   - Material-change guard: only commits when Markdown diff is non-empty
// - Top-ribbon / status-bar Sync button with state indicator
//   - States: idle, pulling, syncing, offline, error
// - Right-panel version history: list of snapshot commits per document
// - Incoming-change fetch and merge with conflict detection
//   - Periodic background fetch (read-only, no commits)
//   - Conflict guidance and per-file resolution flow
// - Sync preconditions: Git available, vault is a Git repo, identity configured
// - Remote connect flow when no origin is set
// - Desktop-only: depends on Node.js child_process for Git execution

export default class MohioGitSyncPlugin extends Plugin {
  async onload() {
    // Plugin entry point — implementation not started yet.
  }

  async onunload() {
    // Cleanup — implementation not started yet.
  }
}
