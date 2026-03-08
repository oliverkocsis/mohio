import { type ReactNode, useMemo, useState } from "react";
import {
  initialDraftChanges,
  initialJots,
  initialPages,
  initialProposals,
  initialRelatedLinks,
  initialSnapshots,
  initialWorkspaceView,
  workspacePeople,
} from "./data/workspace";
import type {
  ContextPanelView,
  DraftChange,
  Jot,
  Proposal,
  RelatedLink,
  Snapshot,
  WikiPage,
  WorkspaceView,
} from "./types";

type EditorMode = "Read" | "Hybrid" | "Source";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>(initialWorkspaceView);
  const [contextView, setContextView] = useState<ContextPanelView>("Proposal");
  const [editorMode, setEditorMode] = useState<EditorMode>("Hybrid");
  const [searchTerm, setSearchTerm] = useState("");
  const [composerText, setComposerText] = useState("");
  const [statusMessage, setStatusMessage] = useState("Draft workspace ready for review.");

  const [jots, setJots] = useState<Jot[]>(() => clone(initialJots));
  const [pages, setPages] = useState<WikiPage[]>(() => clone(initialPages));
  const [proposals, setProposals] = useState<Proposal[]>(() => clone(initialProposals));
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => clone(initialSnapshots));
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>(() => clone(initialRelatedLinks));
  const [draftChanges, setDraftChanges] = useState<DraftChange[]>(() => clone(initialDraftChanges));

  const [selectedJotId, setSelectedJotId] = useState(initialJots[0]?.id ?? "");
  const [selectedPageId, setSelectedPageId] = useState(initialPages[0]?.id ?? "");
  const [selectedProposalId, setSelectedProposalId] = useState(initialProposals[0]?.id ?? "");

  const selectedJot = jots.find((jot) => jot.id === selectedJotId) ?? jots[0] ?? null;
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null;
  const selectedProposal =
    proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0] ?? null;

  const loweredSearch = searchTerm.trim().toLowerCase();
  const filteredJots = useMemo(
    () =>
      jots.filter((jot) =>
        [jot.title, jot.preview, jot.content].some((value) =>
          value.toLowerCase().includes(loweredSearch),
        ),
      ),
    [jots, loweredSearch],
  );
  const filteredPages = useMemo(
    () =>
      pages.filter((page) =>
        [page.title, page.summary, page.content].some((value) =>
          value.toLowerCase().includes(loweredSearch),
        ),
      ),
    [pages, loweredSearch],
  );
  const filteredProposals = useMemo(
    () =>
      proposals.filter((proposal) =>
        [proposal.title, proposal.summary, proposal.rationale].some((value) =>
          value.toLowerCase().includes(loweredSearch),
        ),
      ),
    [proposals, loweredSearch],
  );

  const recentItems = [...pages]
    .sort((left, right) => compareRelativeTime(left.lastEditedAt, right.lastEditedAt))
    .slice(0, 4);
  const favoritePages = pages.filter((page) =>
    ["page-team-handbook", "page-proposal-flow"].includes(page.id),
  );

  const proposalForSelectedJot = selectedJot
    ? proposals.find((proposal) => selectedJot.proposalIds.includes(proposal.id)) ?? null
    : null;

  const selectedPageSnapshots = selectedPage
    ? snapshots.filter((snapshot) => snapshot.pageId === selectedPage.id)
    : [];

  const selectedPageRelatedLinks = selectedPage
    ? relatedLinks.filter((link) => link.fromPageId === selectedPage.id)
    : [];

  const selectedPageBacklinks = selectedPage
    ? pages.filter((page) => selectedPage.backlinkIds.includes(page.id))
    : [];

  function switchView(view: WorkspaceView) {
    setActiveView(view);
    if (view === "Scratchpad") {
      setContextView("Proposal");
    }
    if (view === "Wiki") {
      setContextView("Related");
    }
    if (view === "Proposals") {
      setContextView("Proposal");
    }
    if (view === "Publish") {
      setContextView("History");
    }
  }

  function selectJot(jotId: string) {
    setSelectedJotId(jotId);
    setActiveView("Scratchpad");
    setContextView("Proposal");
  }

  function selectPage(pageId: string) {
    setSelectedPageId(pageId);
    setActiveView("Wiki");
    setContextView("Related");
  }

  function selectProposal(proposalId: string) {
    setSelectedProposalId(proposalId);
    setActiveView("Proposals");
    setContextView("Proposal");
  }

  function createJot() {
    const text = composerText.trim();
    if (!text) {
      return;
    }

    const firstLine = text.split("\n").find((line) => line.trim()) ?? "Untitled jot";
    const newJot: Jot = {
      id: `jot-${Date.now()}`,
      title: firstLine.replace(/^#\s*/, "").slice(0, 48),
      preview: text.slice(0, 110),
      content: text,
      updatedAt: "Just now",
      status: "New",
      proposalIds: [],
      relatedPageIds: ["page-team-handbook"],
    };

    setJots((current) => [newJot, ...current]);
    setSelectedJotId(newJot.id);
    setComposerText("");
    setStatusMessage("New jot captured in the personal scratchpad.");
    switchView("Scratchpad");
  }

  function updateSelectedPageContent(nextContent: string) {
    if (!selectedPage) {
      return;
    }

    setPages((current) =>
      current.map((page) =>
        page.id === selectedPage.id
          ? {
              ...page,
              content: nextContent,
              lastEditedAt: "Just now",
              lastEditedBy: "Oliver",
            }
          : page,
      ),
    );
  }

  function saveCurrentPageDraft() {
    if (!selectedPage) {
      return;
    }

    const isChanged = selectedPage.content.trim() !== selectedPage.publishedContent.trim();

    setPages((current) =>
      current.map((page) =>
        page.id === selectedPage.id
          ? {
              ...page,
              status: isChanged ? "Draft updates" : "Published",
              lastEditedAt: "Just now",
              lastEditedBy: "Oliver",
            }
          : page,
      ),
    );

    if (!isChanged) {
      setDraftChanges((current) => current.filter((draft) => draft.targetId !== selectedPage.id));
      setStatusMessage(`${selectedPage.title} matches the published version.`);
      return;
    }

    const draft = createDraftChange(
      selectedPage.id,
      selectedPage.title,
      "Saved direct edits to the page draft.",
      "Direct edit",
    );
    setDraftChanges((current) => upsertDraftChange(current, draft));
    setStatusMessage(`${selectedPage.title} was added to draft changes.`);
  }

  function rejectSelectedProposal() {
    if (!selectedProposal) {
      return;
    }

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === selectedProposal.id ? { ...proposal, status: "Rejected" } : proposal,
      ),
    );
    setStatusMessage(`${selectedProposal.title} was marked as rejected.`);
  }

  function stageSelectedProposal() {
    if (!selectedProposal || selectedProposal.status === "Staged" || selectedProposal.status === "Published") {
      return;
    }

    const createdPage = selectedProposal.createdPage;

    if (createdPage) {
      setPages((current) => {
        const exists = current.some((page) => page.id === createdPage.id);
        if (exists) {
          return current;
        }

        return [
          {
            ...createdPage,
            lastEditedAt: "Just now",
          },
          ...current.map((page) =>
            selectedProposal.affectedPageIds.includes(page.id)
              ? addRelatedPage(page, createdPage.id)
              : page,
          ),
        ];
      });

      setRelatedLinks((current) =>
        upsertRelatedLink(
          current,
          {
            id: "link-decision-log-release",
            fromPageId: "page-release-checklist",
            toPageId: "page-decision-log",
            label: "Decision Log.md",
            reason: "The publish checklist should point readers to the page that stores recent decisions.",
          },
        ),
      );

      setDraftChanges((current) =>
        upsertDraftChange(
          current,
          createDraftChange(
            createdPage.id,
            createdPage.title,
            "New shared page proposed from rollout notes.",
            "AI proposal",
          ),
        ),
      );
      setSelectedPageId(createdPage.id);
    }

    if (selectedProposal.appliedContent) {
      const appliedEntries = Object.entries(selectedProposal.appliedContent);
      setPages((current) =>
        current.map((page) => {
          const nextContent = selectedProposal.appliedContent?.[page.id];
          if (!nextContent) {
            return page;
          }

          return {
            ...page,
            content: nextContent,
            status: "Draft updates",
            lastEditedAt: "Just now",
            lastEditedBy: "AI proposal",
          };
        }),
      );

      setDraftChanges((current) => {
        let next = current;
        appliedEntries.forEach(([pageId]) => {
          const page = pages.find((candidate) => candidate.id === pageId);
          if (!page) {
            return;
          }

          next = upsertDraftChange(
            next,
            createDraftChange(
              pageId,
              page.title,
              selectedProposal.summary,
              "AI proposal",
            ),
          );
        });
        return next;
      });

      if (selectedProposal.kind === "link-suggestion" && selectedProposal.affectedPageIds.length >= 2) {
        const [firstPageId, secondPageId] = selectedProposal.affectedPageIds;
        setPages((current) =>
          current.map((page) => {
            if (page.id === firstPageId) {
              return addRelatedPage(page, secondPageId);
            }
            if (page.id === secondPageId) {
              return addRelatedPage(page, firstPageId);
            }
            return page;
          }),
        );
      }

      setSelectedPageId(selectedProposal.affectedPageIds[0] ?? selectedPageId);
    }

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === selectedProposal.id ? { ...proposal, status: "Staged" } : proposal,
      ),
    );

    if (selectedProposal.sourceJotId) {
      setJots((current) =>
        current.map((jot) =>
          jot.id === selectedProposal.sourceJotId ? { ...jot, status: "Processed" } : jot,
        ),
      );
    }

    setStatusMessage(`${selectedProposal.title} was staged for publish review.`);
    setActiveView("Proposals");
    setContextView("Proposal");
  }

  function publishDrafts() {
    if (!draftChanges.length) {
      setStatusMessage("No draft changes are ready to publish.");
      return;
    }

    const changedPageIds = new Set(draftChanges.map((draft) => draft.targetId));
    const newSnapshots: Snapshot[] = [];
    const nowLabel = "Just now";

    const nextPages = pages.map((page) => {
      if (!changedPageIds.has(page.id)) {
        return page;
      }

      const matchingDraft = draftChanges.find((draft) => draft.targetId === page.id);
      const snapshotId = `snapshot-${page.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      newSnapshots.push({
        id: snapshotId,
        pageId: page.id,
        summary: matchingDraft?.summary ?? "Published draft changes.",
        changedBy: "Oliver",
        changedAt: nowLabel,
        source: matchingDraft?.source === "AI proposal" ? "AI proposal" : "Publish",
        diffPreview: [matchingDraft?.summary ?? "Published the latest page draft."],
      });

      return {
        ...page,
        publishedContent: page.content,
        status: "Published" as const,
        lastEditedAt: nowLabel,
        lastEditedBy: "Oliver",
        snapshotIds: [snapshotId, ...page.snapshotIds],
      };
    });

    setPages(nextPages);
    setSnapshots((current) => [...newSnapshots, ...current]);
    setDraftChanges([]);
    setProposals((current) =>
      current.map((proposal) =>
        proposal.status === "Staged" ? { ...proposal, status: "Published", updatedAt: nowLabel } : proposal,
      ),
    );
    setStatusMessage(`Published ${changedPageIds.size} workspace change${changedPageIds.size > 1 ? "s" : ""}.`);
    setActiveView("Publish");
    setContextView("History");
  }

  function renderMainContent() {
    if (activeView === "Scratchpad") {
      return (
        <section className="content-stack" aria-label="Scratchpad view">
          <article className="hero-card">
            <div>
              <p className="eyebrow">Personal scratchpad</p>
              <h2>Capture rough notes first. Organise later.</h2>
            </div>
            <div className="composer">
              <textarea
                aria-label="New jot"
                className="composer-input"
                placeholder="Write a rough note, meeting summary, or idea for Mohio..."
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
              />
              <div className="inline-actions">
                <span className="helper-copy">Each jot stays personal until you review a proposal.</span>
                <button className="primary-button" onClick={createJot}>
                  Capture jot
                </button>
              </div>
            </div>
          </article>

          <div className="section-heading">
            <h3>Recent jots</h3>
            <span className="metric-pill">{filteredJots.length} items</span>
          </div>

          <div className="jot-stream">
            {filteredJots.map((jot) => (
              <button
                key={jot.id}
                className={`jot-row ${jot.id === selectedJot?.id ? "selected" : ""}`}
                onClick={() => selectJot(jot.id)}
              >
                <div className="jot-copy">
                  <strong>{jot.title}</strong>
                  <p>{jot.preview}</p>
                </div>
                <div className="jot-meta">
                  <StatusBadge tone={jot.status === "Needs review" ? "warning" : "neutral"}>
                    {jot.status}
                  </StatusBadge>
                  <span>{jot.updatedAt}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedJot ? (
            <article className="detail-card">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Selected jot</p>
                  <h3>{selectedJot.title}</h3>
                </div>
                <div className="inline-actions">
                  {proposalForSelectedJot ? (
                    <button
                      className="secondary-button"
                      onClick={() => selectProposal(proposalForSelectedJot.id)}
                    >
                      Open related proposal
                    </button>
                  ) : null}
                  {selectedJot.relatedPageIds[0] ? (
                    <button
                      className="ghost-button"
                      onClick={() => selectPage(selectedJot.relatedPageIds[0])}
                    >
                      Open related page
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="markdown-body">{renderMarkdown(selectedJot.content)}</div>
            </article>
          ) : null}
        </section>
      );
    }

    if (activeView === "Wiki" && selectedPage) {
      return (
        <section className="content-stack" aria-label="Wiki view">
          <article className="editor-surface">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{selectedPage.space}</p>
                <h2>{selectedPage.title}</h2>
                <p className="lede">{selectedPage.summary}</p>
              </div>
              <div className="editor-actions">
                <StatusBadge tone={selectedPage.status === "Draft updates" ? "warning" : "success"}>
                  {selectedPage.status}
                </StatusBadge>
                <div className="segmented-control" role="tablist" aria-label="Editor mode">
                  {(["Read", "Hybrid", "Source"] as EditorMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={mode === editorMode ? "active" : ""}
                      aria-pressed={mode === editorMode}
                      onClick={() => setEditorMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <button className="primary-button" onClick={saveCurrentPageDraft}>
                  Save draft
                </button>
              </div>
            </div>

            {editorMode === "Read" ? (
              <div className="markdown-body editor-body">{renderMarkdown(selectedPage.content)}</div>
            ) : null}

            {editorMode === "Source" ? (
              <textarea
                aria-label="Page source"
                className="source-editor"
                value={selectedPage.content}
                onChange={(event) => updateSelectedPageContent(event.target.value)}
              />
            ) : null}

            {editorMode === "Hybrid" ? (
              <div className="hybrid-layout">
                <textarea
                  aria-label="Page source"
                  className="source-editor"
                  value={selectedPage.content}
                  onChange={(event) => updateSelectedPageContent(event.target.value)}
                />
                <div className="markdown-body editor-body">{renderMarkdown(selectedPage.content)}</div>
              </div>
            ) : null}
          </article>
        </section>
      );
    }

    if (activeView === "Proposals") {
      return (
        <section className="content-stack" aria-label="Proposals view">
          <div className="proposal-grid">
            {filteredProposals.map((proposal) => (
              <button
                key={proposal.id}
                className={`proposal-card ${proposal.id === selectedProposal?.id ? "selected" : ""}`}
                onClick={() => selectProposal(proposal.id)}
              >
                <div className="proposal-card-top">
                  <span className="kind-pill">{formatProposalKind(proposal.kind)}</span>
                  <StatusBadge tone={proposal.status === "Rejected" ? "danger" : proposal.status === "Published" ? "success" : "neutral"}>
                    {proposal.status}
                  </StatusBadge>
                </div>
                <strong>{proposal.title}</strong>
                <p>{proposal.summary}</p>
                <span>{proposal.updatedAt}</span>
              </button>
            ))}
          </div>

          {selectedProposal ? (
            <article className="detail-card">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Proposal review</p>
                  <h3>{selectedProposal.title}</h3>
                  <p className="lede">{selectedProposal.rationale}</p>
                </div>
                <div className="inline-actions">
                  <button
                    className="secondary-button"
                    onClick={rejectSelectedProposal}
                    disabled={selectedProposal.status === "Published"}
                  >
                    Reject
                  </button>
                  <button
                    className="primary-button"
                    onClick={stageSelectedProposal}
                    disabled={selectedProposal.status === "Staged" || selectedProposal.status === "Published"}
                  >
                    Stage proposal
                  </button>
                </div>
              </div>

              <div className="proposal-summary">
                <div className="summary-tile">
                  <p className="eyebrow">Affected pages</p>
                  <strong>{selectedProposal.affectedPageIds.length || 1}</strong>
                </div>
                <div className="summary-tile">
                  <p className="eyebrow">Suggested links</p>
                  <strong>{selectedProposal.suggestedLinks.length}</strong>
                </div>
                <div className="summary-tile">
                  <p className="eyebrow">Source</p>
                  <strong>{selectedProposal.sourceJotId ? "Scratchpad jot" : "Wiki page"}</strong>
                </div>
              </div>

              <section className="diff-card" aria-label="Proposal diff">
                <div className="panel-heading compact">
                  <h4>Reviewable diff</h4>
                  <span className="helper-copy">Stage first, publish later.</span>
                </div>
                <div className="diff-list">
                  {selectedProposal.diff.map((chunk) => (
                    <div key={chunk.id} className={`diff-line diff-${chunk.kind}`}>
                      <code>{chunk.text}</code>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          ) : null}
        </section>
      );
    }

    return (
      <section className="content-stack" aria-label="Publish view">
        <article className="hero-card">
          <div>
            <p className="eyebrow">Publish review</p>
            <h2>Make shared updates explicit and understandable.</h2>
            <p className="lede">
              Draft changes stay private until you publish them into the shared wiki.
            </p>
          </div>
          <div className="inline-actions">
            <span className="metric-pill">{draftChanges.length} staged changes</span>
            <button className="primary-button" onClick={publishDrafts}>
              Publish selected changes
            </button>
          </div>
        </article>

        <div className="publish-list">
          {draftChanges.length ? (
            draftChanges.map((draft) => (
              <article key={draft.id} className="publish-card">
                <div>
                  <p className="eyebrow">{draft.source}</p>
                  <h3>{draft.title}</h3>
                  <p>{draft.summary}</p>
                </div>
                <span>{draft.updatedAt}</span>
              </article>
            ))
          ) : (
            <article className="empty-card">
              <h3>Shared wiki is up to date</h3>
              <p>Stage a proposal or save a page draft to see publish-ready changes here.</p>
            </article>
          )}
        </div>
      </section>
    );
  }

  function renderContextPanel() {
    return (
      <aside className="context-panel" aria-label="Context panel surface">
        <div className="context-tabs" role="tablist" aria-label="Context panel">
          {(["Proposal", "Related", "Backlinks", "History"] as ContextPanelView[]).map((view) => (
            <button
              key={view}
              className={view === contextView ? "active" : ""}
              aria-pressed={view === contextView}
              onClick={() => setContextView(view)}
            >
              {view}
            </button>
          ))}
        </div>

        {contextView === "Proposal" ? (
          <div className="context-stack">
            <section className="context-card">
              <p className="eyebrow">Selected proposal</p>
              {selectedProposal ? (
                <>
                  <h3>{selectedProposal.title}</h3>
                  <p>{selectedProposal.summary}</p>
                  <div className="context-list">
                    {selectedProposal.suggestedLinks.map((link) => (
                      <span key={link} className="metric-pill">
                        {link}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p>No proposal selected.</p>
              )}
            </section>
            {selectedJot && proposalForSelectedJot ? (
              <section className="context-card">
                <p className="eyebrow">Scratchpad signal</p>
                <h3>{selectedJot.title}</h3>
                <p>This jot already has a matching proposal and can move into shared review.</p>
                <button className="secondary-button" onClick={() => selectProposal(proposalForSelectedJot.id)}>
                  Review proposal
                </button>
              </section>
            ) : null}
          </div>
        ) : null}

        {contextView === "Related" ? (
          <div className="context-stack">
            <section className="context-card">
              <p className="eyebrow">Related pages</p>
              {selectedPage ? (
                <>
                  <h3>{selectedPage.title}</h3>
                  <div className="context-list">
                    {selectedPageRelatedLinks.length ? (
                      selectedPageRelatedLinks.map((link) => (
                        <button key={link.id} className="context-link" onClick={() => selectPage(link.toPageId)}>
                          <strong>{link.label}</strong>
                          <span>{link.reason}</span>
                        </button>
                      ))
                    ) : (
                      <p>No related pages for this page yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p>Select a wiki page to inspect related context.</p>
              )}
            </section>
          </div>
        ) : null}

        {contextView === "Backlinks" ? (
          <div className="context-stack">
            <section className="context-card">
              <p className="eyebrow">Backlinks</p>
              {selectedPage ? (
                <>
                  <h3>{selectedPage.title}</h3>
                  <div className="context-list">
                    {selectedPageBacklinks.length ? (
                      selectedPageBacklinks.map((page) => (
                        <button key={page.id} className="context-link" onClick={() => selectPage(page.id)}>
                          <strong>{page.title}</strong>
                          <span>{page.summary}</span>
                        </button>
                      ))
                    ) : (
                      <p>No backlinks captured yet for this page.</p>
                    )}
                  </div>
                </>
              ) : (
                <p>Select a wiki page to inspect backlinks.</p>
              )}
            </section>
          </div>
        ) : null}

        {contextView === "History" ? (
          <div className="context-stack">
            <section className="context-card">
              <p className="eyebrow">Page history</p>
              {selectedPage ? (
                <>
                  <h3>{selectedPage.title}</h3>
                  <div className="history-list">
                    {selectedPageSnapshots.length ? (
                      selectedPageSnapshots.map((snapshot) => (
                        <article key={snapshot.id} className="history-item">
                          <div className="history-meta">
                            <strong>{snapshot.summary}</strong>
                            <span>
                              {snapshot.changedBy} · {snapshot.changedAt}
                            </span>
                          </div>
                          <StatusBadge tone={snapshot.source === "AI proposal" ? "neutral" : "success"}>
                            {snapshot.source}
                          </StatusBadge>
                        </article>
                      ))
                    ) : (
                      <p>No snapshots yet for this page.</p>
                    )}
                  </div>
                </>
              ) : (
                <p>Select a page to inspect history.</p>
              )}
            </section>
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <div className="app-page">
      <div className="app-shell">
        <nav className="icon-rail" aria-label="Global navigation">
          {[
            { key: "home", label: "Home" },
            { key: "scratchpad", label: "Scratchpad", view: "Scratchpad" as WorkspaceView },
            { key: "wiki", label: "Wiki", view: "Wiki" as WorkspaceView },
            { key: "proposal", label: "Proposals", view: "Proposals" as WorkspaceView },
            { key: "history", label: "Publish", view: "Publish" as WorkspaceView },
            { key: "spark", label: "AI" },
            { key: "settings", label: "Settings" },
          ].map((item) => (
            <button
              key={item.key}
              className={`rail-button ${item.view === activeView ? "active" : ""}`}
              aria-label={item.label}
              onClick={() => {
                if (item.view) {
                  switchView(item.view);
                }
              }}
            >
              <RailIcon name={item.key} />
            </button>
          ))}

          <div className="rail-footer">
            <button className="rail-action" onClick={() => switchView("Scratchpad")}>
              +
            </button>
          </div>
        </nav>

        <aside className="workspace-sidebar" aria-label="Workspace sidebar">
          <div className="sidebar-top">
            <p className="eyebrow">Workspace</p>
            <h1>Mohio</h1>
            <p className="sidebar-copy">
              AI-assisted team knowledge in Markdown, with proposals and visible history.
            </p>
          </div>

          <SidebarSection title="Recents" count={recentItems.length}>
            {recentItems.map((page) => (
              <SidebarRow
                key={page.id}
                active={page.id === selectedPage?.id && activeView === "Wiki"}
                title={page.title}
                meta={page.lastEditedAt}
                onClick={() => selectPage(page.id)}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Scratchpad" count={jots.length}>
            <SidebarRow
              active={activeView === "Scratchpad"}
              title="Personal jots"
              meta={`${jots.filter((jot) => jot.status === "Needs review").length} need review`}
              onClick={() => switchView("Scratchpad")}
            />
          </SidebarSection>

          <SidebarSection title="Draft changes" count={draftChanges.length}>
            {draftChanges.length ? (
              draftChanges.map((draft) => (
                <SidebarRow
                  key={draft.id}
                  active={activeView === "Publish"}
                  title={draft.title}
                  meta={draft.updatedAt}
                  onClick={() => switchView("Publish")}
                />
              ))
            ) : (
              <SidebarRow active={false} title="No draft changes" meta="Shared wiki is current" onClick={() => switchView("Publish")} />
            )}
          </SidebarSection>

          <SidebarSection title="Shared pages" count={pages.length}>
            {pages.map((page) => (
              <SidebarRow
                key={page.id}
                active={page.id === selectedPage?.id && activeView === "Wiki"}
                title={page.title}
                meta={page.status}
                onClick={() => selectPage(page.id)}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="Favorites" count={favoritePages.length}>
            {favoritePages.map((page) => (
              <SidebarRow
                key={page.id}
                active={page.id === selectedPage?.id && activeView === "Wiki"}
                title={page.title}
                meta={page.space}
                onClick={() => selectPage(page.id)}
              />
            ))}
          </SidebarSection>
        </aside>

        <section className="workspace-main">
          <header className="workspace-header">
            <div className="workspace-identity">
              <div className="workspace-mark">M</div>
              <div>
                <p className="eyebrow">Phase 1 prototype</p>
                <h2>Core workspace</h2>
              </div>
              <div className="avatar-row" aria-label="Collaborators">
                {workspacePeople.map((person) => (
                  <span key={person.id} className="avatar" title={`${person.name} · ${person.role}`}>
                    {person.name.slice(0, 1)}
                  </span>
                ))}
              </div>
            </div>

            <div className="workspace-actions">
              <button className="secondary-button" onClick={() => setStatusMessage("Import stays out of scope in this local prototype.")}>
                Import Markdown
              </button>
              <button className="primary-button" onClick={() => switchView("Scratchpad")}>
                New jot
              </button>
            </div>
          </header>

          <div className="tabs-row" role="tablist" aria-label="Workspace views">
            {(["Scratchpad", "Wiki", "Proposals", "Publish"] as WorkspaceView[]).map((view) => (
              <button
                key={view}
                className={view === activeView ? "active" : ""}
                aria-pressed={view === activeView}
                onClick={() => switchView(view)}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="toolbar-row">
            <div className="search-wrap">
              <input
                aria-label="Search workspace"
                type="search"
                placeholder="Search jots, pages, proposals..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="toolbar-meta">
              <span className="metric-pill">{pages.filter((page) => page.status === "Draft updates").length} draft pages</span>
              <span className="metric-pill">{proposals.filter((proposal) => proposal.status === "Pending review").length} pending proposals</span>
              <span className="metric-pill">Markdown-first workspace</span>
            </div>
          </div>

          <div className="content-region">
            <main className="content-main">{renderMainContent()}</main>
            {renderContextPanel()}
          </div>

          <footer className="workspace-footer">
            <span>{statusMessage}</span>
            <button className="ghost-button" onClick={publishDrafts}>
              Publish flow
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-head">
        <h3>{title}</h3>
        <span>{count}</span>
      </div>
      <div className="sidebar-section-body">{children}</div>
    </section>
  );
}

function SidebarRow({
  active,
  title,
  meta,
  onClick,
}: {
  active: boolean;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button className={`sidebar-row ${active ? "active" : ""}`} onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
    </button>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "neutral" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function RailIcon({ name }: { name: string }) {
  if (name === "scratchpad") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10v14H7zM9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }
  if (name === "wiki") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14v12H5zM9 10h6M9 14h6" />
      </svg>
    );
  }
  if (name === "proposal") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 12h12M12 6l6 6-6 6" />
      </svg>
    );
  }
  if (name === "history") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7v5l3 2M7 7H4v3M4 10a8 8 0 1 0 3-6" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Zm7 3.5-2 .7a5.6 5.6 0 0 1-.4 1l1.2 1.8-1.8 1.8-1.8-1.2a5.6 5.6 0 0 1-1 .4l-.7 2h-2.6l-.7-2a5.6 5.6 0 0 1-1-.4l-1.8 1.2-1.8-1.8 1.2-1.8a5.6 5.6 0 0 1-.4-1l-2-.7V10l2-.7a5.6 5.6 0 0 1 .4-1L4.3 6.5l1.8-1.8L7.9 5.9a5.6 5.6 0 0 1 1-.4l.7-2h2.6l.7 2a5.6 5.6 0 0 1 1 .4l1.8-1.2 1.8 1.8-1.2 1.8a5.6 5.6 0 0 1 .4 1l2 .7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let listItems: string[] = [];
  let listMode: "ol" | "ul" | null = null;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) {
      return;
    }
    nodes.push(
      <p key={`p-${nodes.length}`}>{paragraphBuffer.join(" ")}</p>,
    );
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listItems.length || !listMode) {
      return;
    }

    if (listMode === "ul") {
      nodes.push(
        <ul key={`ul-${nodes.length}`}>
          {listItems.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>,
      );
    } else {
      nodes.push(
        <ol key={`ol-${nodes.length}`}>
          {listItems.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ol>,
      );
    }

    listItems = [];
    listMode = null;
  };

  lines.forEach((line) => {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push(<h1 key={`h1-${nodes.length}`}>{line.replace(/^# /, "")}</h1>);
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push(<h2 key={`h2-${nodes.length}`}>{line.replace(/^## /, "")}</h2>);
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push(<h3 key={`h3-${nodes.length}`}>{line.replace(/^### /, "")}</h3>);
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      if (listMode && listMode !== "ol") {
        flushList();
      }
      listMode = "ol";
      listItems.push(line.replace(/^\d+\.\s/, ""));
      return;
    }

    if (/^-\s/.test(line)) {
      flushParagraph();
      if (listMode && listMode !== "ul") {
        flushList();
      }
      listMode = "ul";
      listItems.push(line.replace(/^-\s/, ""));
      return;
    }

    if (listMode) {
      flushList();
    }
    paragraphBuffer.push(line);
  });

  flushParagraph();
  flushList();

  return nodes;
}

function addRelatedPage(page: WikiPage, pageId: string): WikiPage {
  if (page.relatedPageIds.includes(pageId)) {
    return page;
  }
  return {
    ...page,
    relatedPageIds: [...page.relatedPageIds, pageId],
  };
}

function createDraftChange(
  targetId: string,
  title: string,
  summary: string,
  source: DraftChange["source"],
): DraftChange {
  return {
    id: `draft-${targetId}`,
    targetType: "page",
    targetId,
    title,
    summary,
    source,
    updatedAt: "Just now",
  };
}

function upsertDraftChange(current: DraftChange[], next: DraftChange): DraftChange[] {
  const existing = current.some((draft) => draft.id === next.id);
  if (!existing) {
    return [next, ...current];
  }
  return current.map((draft) => (draft.id === next.id ? next : draft));
}

function upsertRelatedLink(current: RelatedLink[], next: RelatedLink): RelatedLink[] {
  const exists = current.some((link) => link.id === next.id);
  if (!exists) {
    return [next, ...current];
  }
  return current.map((link) => (link.id === next.id ? next : link));
}

function formatProposalKind(kind: Proposal["kind"]) {
  if (kind === "new-page") {
    return "New page";
  }
  if (kind === "page-edit") {
    return "Page edit";
  }
  return "Link suggestion";
}

function compareRelativeTime(left: string, right: string) {
  return scoreRelativeTime(left) - scoreRelativeTime(right);
}

function scoreRelativeTime(value: string) {
  if (value === "Just now") {
    return 0;
  }
  if (value.includes("minute")) {
    return 1;
  }
  if (value.includes("hour")) {
    return 2;
  }
  if (value === "Yesterday") {
    return 3;
  }
  return 4;
}
