import { useMemo, useState } from "react";
import { initialJots, initialPages, initialProposals } from "./data/workspace";
import type { DiffChunk, Jot, Proposal, WikiPage } from "./types";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export default function App() {
  const [jots, setJots] = useState<Jot[]>(() => clone(initialJots));
  const [pages, setPages] = useState<WikiPage[]>(() => clone(initialPages));
  const [proposals, setProposals] = useState<Proposal[]>(() => clone(initialProposals));
  const [selectedJotId, setSelectedJotId] = useState(initialJots[0].id);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(initialProposals[0].id);
  const [selectedPageId, setSelectedPageId] = useState(initialPages[2].id);
  const [statusMessage, setStatusMessage] = useState("Scratchpad ready. Select a jot and generate a proposal.");

  const selectedJot = jots.find((jot) => jot.id === selectedJotId) ?? jots[0];
  const activeProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? null;
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];

  const affectedPages = useMemo(() => {
    if (!activeProposal) {
      return [];
    }

    const existing = activeProposal.affectedPageIds
      .map((pageId) => pages.find((page) => page.id === pageId))
      .filter(Boolean) as WikiPage[];

    return activeProposal.createdPage ? [activeProposal.createdPage, ...existing] : existing;
  }, [activeProposal, pages]);

  function updateSelectedJotContent(nextContent: string) {
    setJots((current) =>
      current.map((jot) =>
        jot.id === selectedJot.id
          ? {
              ...jot,
              content: nextContent,
              title: deriveTitle(nextContent),
              updatedAt: "Just now",
            }
          : jot,
      ),
    );
  }

  function createJot() {
    const jot: Jot = {
      id: `jot-${Date.now()}`,
      title: "Untitled jot",
      content: "",
      updatedAt: "Just now",
      status: "New",
    };

    setJots((current) => [jot, ...current]);
    setSelectedJotId(jot.id);
    setSelectedProposalId(null);
    setStatusMessage("New jot created. Add a few lines, then generate a proposal.");
  }

  function selectJot(jotId: string) {
    setSelectedJotId(jotId);
    const matchingProposal = proposals.find((proposal) => proposal.sourceJotId === jotId) ?? null;
    setSelectedProposalId(matchingProposal?.id ?? null);

    if (matchingProposal?.createdPage) {
      setSelectedPageId(matchingProposal.createdPage.id);
    } else if (matchingProposal?.affectedPageIds[0]) {
      setSelectedPageId(matchingProposal.affectedPageIds[0]);
    }
  }

  function generateProposal() {
    const existing = proposals.find((proposal) => proposal.sourceJotId === selectedJot.id);
    if (existing) {
      setSelectedProposalId(existing.id);
      if (existing.createdPage) {
        setSelectedPageId(existing.createdPage.id);
      } else if (existing.affectedPageIds[0]) {
        setSelectedPageId(existing.affectedPageIds[0]);
      }
      setStatusMessage("Proposal ready for review.");
      return;
    }

    const generated = buildProposalFromJot(selectedJot);
    setProposals((current) => [generated, ...current]);
    setJots((current) =>
      current.map((jot) =>
        jot.id === selectedJot.id ? { ...jot, status: "Needs review", updatedAt: "Just now" } : jot,
      ),
    );
    setSelectedProposalId(generated.id);
    setSelectedPageId(generated.createdPage?.id ?? generated.affectedPageIds[0] ?? selectedPageId);
    setStatusMessage("Proposal generated from the current jot.");
  }

  function acceptProposal() {
    if (!activeProposal || activeProposal.status === "Accepted") {
      return;
    }

    const createdPage = activeProposal.createdPage;

    setPages((current) => {
      let next = current;

      if (createdPage && !current.some((page) => page.id === createdPage.id)) {
        next = [createdPage, ...next];
      }

      if (activeProposal.pageUpdates) {
        next = next.map((page) => {
          const update = activeProposal.pageUpdates?.[page.id];
          if (!update) {
            return page;
          }

          return {
            ...page,
            content: update,
          };
        });
      }

      return next;
    });

    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === activeProposal.id ? { ...proposal, status: "Accepted" } : proposal,
      ),
    );
    setJots((current) =>
      current.map((jot) =>
        jot.id === activeProposal.sourceJotId ? { ...jot, status: "Processed", updatedAt: "Just now" } : jot,
      ),
    );

    setSelectedPageId(createdPage?.id ?? activeProposal.affectedPageIds[0] ?? selectedPageId);
    setStatusMessage("Proposal accepted into shared wiki draft content.");
  }

  function updateSelectedPageContent(nextContent: string) {
    setPages((current) =>
      current.map((page) =>
        page.id === selectedPage.id
          ? {
              ...page,
              content: nextContent,
            }
          : page,
      ),
    );
    setStatusMessage(`Editing ${selectedPage.title} directly.`);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mohio v4</p>
          <h1>Scratchpad to wiki</h1>
        </div>
        <div className="topbar-actions">
          <span className="status-pill">{statusMessage}</span>
          <button className="primary-button" onClick={createJot}>
            New jot
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="panel panel-left" aria-label="Scratchpad panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Scratchpad</p>
              <h2>Recent jots</h2>
            </div>
            <span className="count-pill">{jots.length}</span>
          </div>

          <div className="jot-list">
            {jots.map((jot) => (
              <button
                key={jot.id}
                className={`jot-card ${jot.id === selectedJot.id ? "selected" : ""}`}
                onClick={() => selectJot(jot.id)}
              >
                <div className="jot-card-top">
                  <strong>{jot.title}</strong>
                  <span className={`mini-badge ${toneForStatus(jot.status)}`}>{jot.status}</span>
                </div>
                <p>{previewText(jot.content)}</p>
                <span>{jot.updatedAt}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="panel panel-center" aria-label="Jot editor">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Current jot</p>
              <h2>{selectedJot.title}</h2>
            </div>
            <button className="primary-button" onClick={generateProposal}>
              Generate proposal
            </button>
          </div>

          <div className="editor-meta">
            <span className={`mini-badge ${toneForStatus(selectedJot.status)}`}>{selectedJot.status}</span>
            <span>{selectedJot.updatedAt}</span>
          </div>

          <textarea
            aria-label="Jot editor"
            className="jot-editor"
            value={selectedJot.content}
            onChange={(event) => updateSelectedJotContent(event.target.value)}
            placeholder="Write a quick note, meeting summary, or early draft..."
          />

          <div className="editor-note">
            Mohio starts here: quick personal notes first, shared structure after review.
          </div>
        </main>

        <aside className="panel panel-right" aria-label="Wiki impact panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Proposal and wiki impact</p>
              <h2>{activeProposal ? activeProposal.title : "No proposal yet"}</h2>
            </div>
            {activeProposal ? (
              <button
                className="primary-button"
                disabled={activeProposal.status === "Accepted"}
                onClick={acceptProposal}
              >
                {activeProposal.status === "Accepted" ? "Accepted" : "Accept proposal"}
              </button>
            ) : null}
          </div>

          {activeProposal ? (
            <div className="proposal-stack">
              <section className="proposal-card">
                <p className="proposal-summary">{activeProposal.summary}</p>
                <p className="proposal-rationale">{activeProposal.rationale}</p>
              </section>

              <section className="impact-card">
                <div className="impact-head">
                  <h3>Affected wiki pages</h3>
                  <span>{affectedPages.length}</span>
                </div>
                <div className="impact-pages">
                  {affectedPages.map((page) => (
                    <button
                      key={page.id}
                      className={`impact-page ${page.id === selectedPage.id ? "selected" : ""}`}
                      onClick={() => setSelectedPageId(page.id)}
                    >
                      <strong>{page.title}</strong>
                      <span>{page.summary}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="diff-card">
                <h3>Readable diff</h3>
                <div className="diff-list">
                  {activeProposal.diff.map((chunk) => (
                    <div key={chunk.id} className={`diff-line diff-${chunk.kind}`}>
                      <code>{chunk.text}</code>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="empty-card">
              <h3>Generate a proposal</h3>
              <p>Select a jot and ask Mohio to turn it into a small shared wiki update.</p>
            </div>
          )}

          <section className="wiki-card">
            <div className="impact-head">
              <div>
                <p className="eyebrow">Shared wiki page</p>
                <h3>{selectedPage.title}</h3>
              </div>
              <span className="count-pill">Draft</span>
            </div>
            <p className="wiki-summary">{selectedPage.summary}</p>
            <textarea
              aria-label="Wiki page editor"
              className="wiki-editor"
              value={selectedPage.content}
              onChange={(event) => updateSelectedPageContent(event.target.value)}
            />
            <div className="related-list">
              {selectedPage.relatedTitles.map((title) => (
                <span key={title} className="related-pill">
                  {title}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function deriveTitle(content: string) {
  const firstLine = content.split("\n").find((line) => line.trim()) ?? "Untitled jot";
  return firstLine.replace(/^#\s*/, "").slice(0, 48);
}

function previewText(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 92) : "Empty jot";
}

function toneForStatus(status: Jot["status"]) {
  if (status === "Processed") {
    return "success";
  }
  if (status === "Needs review") {
    return "warning";
  }
  return "neutral";
}

function buildProposalFromJot(jot: Jot): Proposal {
  const pageTitle = `${deriveTitle(jot.content || jot.title)}.md`;
  const pageId = `page-${jot.id}`;
  const createdPage: WikiPage = {
    id: pageId,
    title: pageTitle,
    summary: "A new shared page proposed from the current jot.",
    content: `# ${pageTitle.replace(/\.md$/, "")}

${jot.content.trim() || "This page was proposed from a new jot."}`,
    relatedTitles: ["Team Handbook.md"],
  };

  return {
    id: `proposal-${jot.id}`,
    title: `Create ${pageTitle}`,
    sourceJotId: jot.id,
    summary: "Turn this jot into a new wiki page and connect it back to the handbook.",
    rationale: "The jot looks like durable team knowledge rather than a temporary note.",
    affectedPageIds: ["page-handbook"],
    status: "Pending review",
    createdPage,
    pageUpdates: {
      "page-handbook": `# Team Handbook

- Start with a jot when the idea is rough.
- Review changes before they become shared knowledge.
- Keep pages short and linked.
- Link to ${pageTitle} when teammates need the shared version of this note.`,
    },
    diff: [
      { id: `g1-${jot.id}`, kind: "add", text: `+ Create ${pageTitle} from the current jot` },
      { id: `g2-${jot.id}`, kind: "context", text: "  Team Handbook.md" },
      { id: `g3-${jot.id}`, kind: "add", text: `+ Link to ${pageTitle} when teammates need the shared version of this note.` },
    ],
  };
}
