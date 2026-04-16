import { Plugin } from "obsidian";

// TODO: Implement Mohio AI Assistance plugin.
// Feature spec: docs/features/ai-assistance-panel.md
//
// Planned capabilities:
// - Right-sidebar AI assistant panel using the active note as context
// - Codex-backed chat integration (codex app-server over JSON-RPC)
// - Per-vault chat session history stored in Codex's own session store
// - Document-aware prompting: passes active note title, path, and Markdown body
// - Streaming assistant responses in the sidebar transcript
// - Quick-action prompts: Summarise document, Improve document
// - Composer: auto-growing textarea, Enter to send, Shift+Enter for newline

export default class MohioAIAssistancePlugin extends Plugin {
  async onload() {
    // Plugin entry point — implementation not started yet.
  }

  async onunload() {
    // Cleanup — implementation not started yet.
  }
}
