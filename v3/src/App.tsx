import { useState } from "react";
import {
  initialActivity,
  initialMessages,
  initialPages,
  initialSuggestions,
  quickActions,
  workspaceTree,
} from "./data/workspace";
import type {
  ActivityEvent,
  AgentSuggestion,
  ChecklistBlock,
  PageBlock,
  PageTreeNode,
  WorkspacePage,
} from "./types";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

type CanvasMode = "Edit" | "Preview";

export default function App() {
  const [pages, setPages] = useState<WorkspacePage[]>(() => clone(initialPages));
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>(() => clone(initialSuggestions));
  const [activity, setActivity] = useState<ActivityEvent[]>(() => clone(initialActivity));
  const [selectedPageId, setSelectedPageId] = useState(initialPages[0]?.id ?? "");
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("Edit");
  const [composerText, setComposerText] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Flagship workspace ready for review.");

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null;
  const selectedMessages = initialMessages.filter((message) => message.pageId === selectedPage?.id);
  const selectedSuggestions = suggestions.filter(
    (suggestion) => suggestion.pageId === selectedPage?.id && suggestion.status === "pending",
  );
  const selectedActivity = activity.filter((entry) => entry.pageId === selectedPage?.id).slice(0, 4);

  function selectPage(pageId: string) {
    setSelectedPageId(pageId);
    setShowSlashMenu(false);
    setStatusMessage("Page context updated for editing and agent review.");
  }

  function updatePage(mutator: (page: WorkspacePage) => WorkspacePage) {
    if (!selectedPage) {
      return;
    }

    setPages((current) =>
      current.map((page) => (page.id === selectedPage.id ? mutator(page) : page)),
    );
  }

  function updatePageTitle(nextTitle: string) {
    updatePage((page) => ({
      ...page,
      title: nextTitle,
      isDraft: true,
      lastUpdated: "Just now",
      changeSummary: "Draft title edited in the flagship workspace.",
    }));
    setStatusMessage("Page title updated in draft state.");
  }

  function updateBlockText(blockId: string, nextText: string) {
    updatePage((page) => ({
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }
        if (block.type === "paragraph" || block.type === "callout" || block.type === "heading") {
          return { ...block, text: nextText };
        }
        if (block.type === "diff") {
          return { ...block, lines: nextText.split("\n") };
        }
        return block;
      }),
      isDraft: true,
      lastUpdated: "Just now",
      changeSummary: "Draft content edited directly on the page.",
    }));
    setStatusMessage("Draft content updated on the page canvas.");
  }

  function updateChecklistItem(blockId: string, itemId: string, nextText: string) {
    updatePage((page) => ({
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.id !== blockId || block.type !== "checklist") {
          return block;
        }
        return {
          ...block,
          items: block.items.map((item) => (item.id === itemId ? { ...item, text: nextText } : item)),
        };
      }),
      isDraft: true,
      lastUpdated: "Just now",
      changeSummary: "Draft checklist item edited from the page canvas.",
    }));
    setStatusMessage("Checklist updated in draft state.");
  }

  function toggleChecklistItem(blockId: string, itemId: string) {
    updatePage((page) => ({
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.id !== blockId || block.type !== "checklist") {
          return block;
        }
        return {
          ...block,
          items: block.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        };
      }),
      isDraft: true,
      lastUpdated: "Just now",
      changeSummary: "Draft checklist state updated from the page canvas.",
    }));
    setStatusMessage("Checklist state updated.");
  }

  function openSlashMenu() {
    setShowSlashMenu((current) => !current);
    setStatusMessage("Block menu opened for the page canvas.");
  }

  function useQuickAction(action: string) {
    if (!selectedPage) {
      return;
    }

    const prompt = `${action}: refine ${selectedPage.title} for the shared workspace.`;
    setComposerText(prompt);
    setActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        pageId: selectedPage.id,
        type: "prompt",
        message: `Quick action prepared: ${action}.`,
        timestamp: "Just now",
      },
      ...current,
    ]);
    setStatusMessage(`${action} prepared in the agent composer.`);
  }

  function submitPrompt() {
    if (!selectedPage || !composerText.trim()) {
      return;
    }

    setActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        pageId: selectedPage.id,
        type: "prompt",
        message: `Prompt queued for the agent: ${composerText.trim()}`,
        timestamp: "Just now",
      },
      ...current,
    ]);
    setStatusMessage("Prompt added to the activity log for this prototype.");
    setComposerText("");
  }

  function applySuggestion(suggestionId: string) {
    const suggestion = suggestions.find((item) => item.id === suggestionId);
    if (!suggestion || !selectedPage || suggestion.pageId !== selectedPage.id) {
      return;
    }

    updatePage((page) => {
      const nextBlocks = page.blocks.map((block) => {
        if (block.id !== suggestion.applyChange.blockId) {
          return block;
        }

        if (
          suggestion.applyChange.type === "replace-block-text" &&
          (block.type === "paragraph" || block.type === "heading" || block.type === "callout")
        ) {
          return { ...block, text: suggestion.applyChange.text };
        }

        if (suggestion.applyChange.type === "append-checklist-item" && block.type === "checklist") {
          const checklistBlock: ChecklistBlock = {
            ...block,
            items: [
              ...block.items,
              {
                id: `${block.id}-${block.items.length + 1}`,
                text: suggestion.applyChange.text,
                checked: false,
              },
            ],
          };
          return checklistBlock;
        }

        return block;
      });

      return {
        ...page,
        blocks: nextBlocks,
        isDraft: true,
        lastUpdated: "Just now",
        changeSummary: `AI suggestion applied to draft: ${suggestion.title}.`,
        history: [`Just now · Draft updated from AI suggestion "${suggestion.title}".`, ...page.history],
      };
    });

    setSuggestions((current) =>
      current.map((item) => (item.id === suggestion.id ? { ...item, status: "applied" } : item)),
    );
    setActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        pageId: selectedPage.id,
        type: "applied",
        message: `Applied suggestion: ${suggestion.title}.`,
        timestamp: "Just now",
      },
      ...current,
    ]);
    setStatusMessage(`AI suggestion applied to draft: ${suggestion.title}.`);
  }

  function dismissSuggestion(suggestionId: string) {
    const suggestion = suggestions.find((item) => item.id === suggestionId);
    if (!suggestion || !selectedPage || suggestion.pageId !== selectedPage.id) {
      return;
    }

    setSuggestions((current) =>
      current.map((item) => (item.id === suggestion.id ? { ...item, status: "dismissed" } : item)),
    );
    setActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        pageId: selectedPage.id,
        type: "dismissed",
        message: `Dismissed suggestion: ${suggestion.title}.`,
        timestamp: "Just now",
      },
      ...current,
    ]);
    setStatusMessage(`Suggestion dismissed: ${suggestion.title}.`);
  }

  return (
    <div className="app-page">
      <div className="app-shell">
        <nav className="global-rail" aria-label="Global rail">
          <div className="rail-brand">M</div>
          <button className="rail-button active" aria-label="Workspace">
            W
          </button>
          <button className="rail-button" aria-label="Search">
            S
          </button>
          <button className="rail-button" aria-label="Inbox">
            I
          </button>
          <button className="rail-button" aria-label="Agent">
            A
          </button>
          <div className="rail-spacer" />
          <button className="rail-button" aria-label="Settings">
            C
          </button>
        </nav>

        <aside className="workspace-sidebar" aria-label="Navigation tree">
          <div className="sidebar-header">
            <p className="eyebrow">Mohio v3</p>
            <h1>Flagship workspace</h1>
            <p className="sidebar-copy">
              A page-first knowledge cockpit with an assistive agent beside the document.
            </p>
          </div>

          <button className="command-button" type="button">
            Search or jump to a page
          </button>

          <section className="sidebar-section">
            <div className="section-head">
              <h2>Favorites</h2>
              <span>2</span>
            </div>
            <button className="favorite-card" type="button" onClick={() => selectPage("page-proposal-workflow")}>
              <strong>Proposal Workflow</strong>
              <span>Draft-first editing guide</span>
            </button>
            <button className="favorite-card" type="button" onClick={() => selectPage("page-agent-patterns")}>
              <strong>Agent Patterns</strong>
              <span>Product strategy</span>
            </button>
          </section>

          <section className="sidebar-section">
            <div className="section-head">
              <h2>Page tree</h2>
              <span>{initialPages.length}</span>
            </div>
            <div className="tree-list">{workspaceTree.map((node) => renderTreeNode(node, selectedPageId, selectPage))}</div>
          </section>

          <section className="sidebar-section">
            <div className="section-head">
              <h2>Recent activity</h2>
              <span>{selectedActivity.length}</span>
            </div>
            <div className="sidebar-events">
              {selectedActivity.map((entry) => (
                <article key={entry.id} className="sidebar-event">
                  <strong>{entry.message}</strong>
                  <span>{entry.timestamp}</span>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <main className="workspace-canvas">
          {selectedPage ? (
            <>
              <header className="canvas-header">
                <div>
                  <p className="eyebrow">
                    {selectedPage.parentLabel} / {selectedPage.sectionLabel}
                  </p>
                  <div className="title-row">
                    <span className="page-icon">{selectedPage.icon}</span>
                    {canvasMode === "Edit" ? (
                      <input
                        aria-label="Page title"
                        className="title-input"
                        value={selectedPage.title}
                        onChange={(event) => updatePageTitle(event.target.value)}
                      />
                    ) : (
                      <h2>{selectedPage.title}</h2>
                    )}
                  </div>
                  <p className="canvas-summary">{selectedPage.summary}</p>
                </div>

                <div className="canvas-actions">
                  <span className={`status-pill ${selectedPage.isDraft ? "draft" : "published"}`}>
                    {selectedPage.isDraft ? "Draft changes" : "Published"}
                  </span>
                  <div className="segmented-control" role="tablist" aria-label="Canvas mode">
                    {(["Edit", "Preview"] as CanvasMode[]).map((mode) => (
                      <button
                        key={mode}
                        className={canvasMode === mode ? "active" : ""}
                        aria-pressed={canvasMode === mode}
                        onClick={() => setCanvasMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button className="secondary-button" type="button" onClick={openSlashMenu}>
                    Add block
                  </button>
                </div>
              </header>

              {showSlashMenu ? (
                <section className="slash-menu" aria-label="Block menu">
                  <p className="eyebrow">Slash menu</p>
                  <div className="slash-options">
                    {["Text", "Checklist", "Callout", "Code diff"].map((item) => (
                      <button key={item} type="button" className="slash-option">
                        / {item}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="document-surface" aria-label="Page canvas">
                {selectedPage.blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    editable={canvasMode === "Edit"}
                    onTextChange={updateBlockText}
                    onChecklistItemChange={updateChecklistItem}
                    onChecklistToggle={toggleChecklistItem}
                  />
                ))}
              </section>

              <section className="page-meta-grid">
                <article className="meta-card">
                  <p className="eyebrow">Draft boundary</p>
                  <h3>{selectedPage.changeSummary}</h3>
                  <p>Assistant changes stay in draft until a human decides they belong in shared knowledge.</p>
                </article>
                <article className="meta-card">
                  <p className="eyebrow">Recent history</p>
                  <div className="history-list">
                    {selectedPage.history.slice(0, 3).map((entry) => (
                      <div key={entry} className="history-item">
                        {entry}
                      </div>
                    ))}
                  </div>
                </article>
                <article className="meta-card">
                  <p className="eyebrow">Last updated</p>
                  <h3>{selectedPage.lastUpdated}</h3>
                  <p>{selectedPage.collaborators.join(" · ")} reviewing this page.</p>
                </article>
              </section>
            </>
          ) : null}
        </main>

        <aside className="agent-panel" aria-label="AI sidecar">
          <header className="agent-header">
            <div>
              <p className="eyebrow">Mohio Agent</p>
              <h2>{selectedPage ? `Working with ${selectedPage.title}` : "Agent context"}</h2>
            </div>
            <span className="status-pill agent">Visible actions</span>
          </header>

          <section className="composer-panel">
            <div className="action-row">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="action-chip"
                  onClick={() => useQuickAction(action)}
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="composer-box">
              <textarea
                aria-label="Agent composer"
                value={composerText}
                placeholder="Ask the agent to tighten wording, extract tasks, or create a linked page..."
                onChange={(event) => setComposerText(event.target.value)}
              />
              <button className="primary-button" type="button" onClick={submitPrompt}>
                Send prompt
              </button>
            </div>
          </section>

          <section className="message-panel">
            <div className="section-head">
              <h3>Thread</h3>
              <span>{selectedMessages.length}</span>
            </div>
            <div className="message-list">
              {selectedMessages.map((message) => (
                <article key={message.id} className={`message-card ${message.role}`}>
                  <div className="message-meta">
                    <strong>{message.author}</strong>
                    <span>{message.timestamp}</span>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="suggestion-panel">
            <div className="section-head">
              <h3>Suggestions</h3>
              <span>{selectedSuggestions.length}</span>
            </div>
            <div className="suggestion-list">
              {selectedSuggestions.length ? (
                selectedSuggestions.map((suggestion) => (
                  <article key={suggestion.id} className="suggestion-card">
                    <p className="eyebrow">{suggestion.actionLabel}</p>
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.summary}</p>
                    <ul>
                      {suggestion.preview.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    <div className="suggestion-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => dismissSuggestion(suggestion.id)}
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => applySuggestion(suggestion.id)}
                      >
                        Apply
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <article className="empty-panel">
                  <h4>No pending suggestions</h4>
                  <p>The current page is caught up with the seeded agent suggestions.</p>
                </article>
              )}
            </div>
          </section>

          <section className="activity-panel">
            <div className="section-head">
              <h3>Activity log</h3>
              <span>{selectedActivity.length}</span>
            </div>
            <div className="activity-list">
              {selectedActivity.map((entry) => (
                <article key={entry.id} className="activity-card">
                  <strong>{entry.message}</strong>
                  <span>{entry.timestamp}</span>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <footer className="workspace-footer">
        <span>{statusMessage}</span>
        <span>Local prototype only</span>
      </footer>
    </div>
  );
}

function renderTreeNode(
  node: PageTreeNode,
  selectedPageId: string,
  onSelectPage: (pageId: string) => void,
) {
  if (node.children?.length) {
    return (
      <section key={node.id} className="tree-group">
        <div className="tree-group-label">
          <span className="tree-icon">{node.icon}</span>
          <strong>{node.label}</strong>
        </div>
        <div className="tree-children">
          {node.children.map((child) => renderTreeNode(child, selectedPageId, onSelectPage))}
        </div>
      </section>
    );
  }

  return (
    <button
      key={node.id}
      type="button"
      className={`tree-leaf ${selectedPageId === node.id ? "active" : ""}`}
      onClick={() => onSelectPage(node.id)}
    >
      <span className="tree-icon">{node.icon}</span>
      <span>{node.label}</span>
    </button>
  );
}

function BlockRenderer({
  block,
  editable,
  onTextChange,
  onChecklistItemChange,
  onChecklistToggle,
}: {
  block: PageBlock;
  editable: boolean;
  onTextChange: (blockId: string, nextText: string) => void;
  onChecklistItemChange: (blockId: string, itemId: string, nextText: string) => void;
  onChecklistToggle: (blockId: string, itemId: string) => void;
}) {
  if (block.type === "heading") {
    const Tag = block.level === 2 ? "h3" : "h4";
    return (
      <article className="doc-block heading-block">
        {editable ? (
          <input
            aria-label={`Edit ${block.text}`}
            className="inline-input heading-input"
            value={block.text}
            onChange={(event) => onTextChange(block.id, event.target.value)}
          />
        ) : (
          <Tag>{block.text}</Tag>
        )}
      </article>
    );
  }

  if (block.type === "paragraph") {
    return (
      <article className="doc-block paragraph-block">
        {editable ? (
          <textarea
            aria-label={`Edit ${block.id}`}
            className="inline-textarea"
            value={block.text}
            onChange={(event) => onTextChange(block.id, event.target.value)}
          />
        ) : (
          <p>{block.text}</p>
        )}
      </article>
    );
  }

  if (block.type === "callout") {
    return (
      <article className={`doc-block callout-block ${block.tone}`}>
        <span className="callout-label">{block.label}</span>
        {editable ? (
          <textarea
            aria-label={`Edit ${block.label}`}
            className="inline-textarea"
            value={block.text}
            onChange={(event) => onTextChange(block.id, event.target.value)}
          />
        ) : (
          <p>{block.text}</p>
        )}
      </article>
    );
  }

  if (block.type === "diff") {
    return (
      <article className="doc-block diff-block">
        <span className="callout-label">{block.label}</span>
        {editable ? (
          <textarea
            aria-label={`Edit ${block.label}`}
            className="inline-textarea mono"
            value={block.lines.join("\n")}
            onChange={(event) => onTextChange(block.id, event.target.value)}
          />
        ) : (
          <pre>{block.lines.join("\n")}</pre>
        )}
      </article>
    );
  }

  return (
    <article className="doc-block checklist-block">
      <span className="callout-label">{block.title}</span>
      <div className="checklist-items">
        {block.items.map((item) => (
          <label key={item.id} className="checklist-item">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onChecklistToggle(block.id, item.id)}
            />
            {editable ? (
              <input
                aria-label={`Checklist ${item.id}`}
                className="inline-check-input"
                value={item.text}
                onChange={(event) => onChecklistItemChange(block.id, item.id, event.target.value)}
              />
            ) : (
              <span>{item.text}</span>
            )}
          </label>
        ))}
      </div>
    </article>
  );
}
