import { useMemo, useRef, useState } from "react";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { resolveRelativeMarkdownPath, searchWorkspace } from "./lib/markdown";
import { useWorkspaceStore } from "./lib/workspace-store";

export default function App() {
  const {
    workspaces,
    activeWorkspace,
    selectedFile,
    searchQuery,
    activeProposal,
    desktopMeta,
    openWorkspace,
    selectFile,
    setSearchQuery,
    updateFileContent,
    createFile,
    renameFile,
    deleteFile,
    createCheckpoint,
    restoreCheckpoint,
    publishFile,
    submitAgentPrompt,
    applyProposal,
    discardProposal,
  } = useWorkspaceStore();

  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [checkpointName, setCheckpointName] = useState("");
  const [checkpointNote, setCheckpointNote] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const searchResults = useMemo(
    () => searchWorkspace(activeWorkspace, searchQuery),
    [activeWorkspace, searchQuery],
  );
  const recentFiles = activeWorkspace.recentFileIds
    .map((fileId) => activeWorkspace.files.find((file) => file.id === fileId))
    .filter((file): file is typeof activeWorkspace.files[number] => Boolean(file))
    .slice(0, 4);
  const pinnedFiles = activeWorkspace.files.filter((file) => file.pinned);
  const unpublishedChanges = selectedFile.lastPublished?.content !== selectedFile.content;

  function handleWorkspaceChange(nextWorkspaceId: string) {
    openWorkspace(nextWorkspaceId);
    setRenamingFileId(null);
    setCheckpointOpen(false);
  }

  function handleCreateCheckpoint() {
    if (!checkpointName.trim()) {
      return;
    }

    createCheckpoint(selectedFile.id, checkpointName, checkpointNote);
    setCheckpointOpen(false);
    setCheckpointName("");
    setCheckpointNote("");
  }

  function handleSubmitPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    submitAgentPrompt(trimmed);
    setAgentPrompt("");
  }

  function handleDeleteFile(fileId: string) {
    if (window.confirm("Delete this note from the current demo workspace?")) {
      deleteFile(fileId);
    }
  }

  function handleOpenMarkdownLink(relativePath: string) {
    const resolved = resolveRelativeMarkdownPath(selectedFile.path, relativePath);
    if (!resolved) {
      return;
    }

    const linkedFile = activeWorkspace.files.find((file) => file.path === resolved);
    if (linkedFile) {
      selectFile(linkedFile.id);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-block topbar-workspace">
          <p className="eyebrow">Workspace</p>
          <label className="visually-hidden" htmlFor="workspace-select">
            Open workspace
          </label>
          <select
            id="workspace-select"
            className="workspace-select"
            value={activeWorkspace.id}
            onChange={(event) => handleWorkspaceChange(event.target.value)}
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <div className="topbar-block topbar-current-file">
          <p className="eyebrow">Current file</p>
          <h1>{selectedFile.title}</h1>
          <p className="topbar-subtle">
            {activeWorkspace.description} · {desktopMeta.platform} · Electron {desktopMeta.electronVersion}
          </p>
        </div>

        <div className="topbar-actions">
          <button className="secondary-button" type="button" onClick={() => searchInputRef.current?.focus()}>
            Search
          </button>
          <button className="secondary-button" type="button" onClick={() => createFile()}>
            New note
          </button>
          <button className="secondary-button" type="button" onClick={() => setCheckpointOpen((current) => !current)}>
            Create checkpoint
          </button>
          <button className="primary-button" type="button" onClick={() => publishFile(selectedFile.id)}>
            Publish
          </button>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="sidebar sidebar-left" aria-label="Workspace navigation">
          <div className="sidebar-header">
            <div>
              <p className="eyebrow">Search</p>
              <h2>Workspace notes</h2>
            </div>
            <button className="secondary-button compact-button" type="button" onClick={() => createFile()}>
              New note
            </button>
          </div>

          <label className="visually-hidden" htmlFor="workspace-search">
            Search notes
          </label>
          <input
            id="workspace-search"
            ref={searchInputRef}
            className="app-input search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by file name or note text"
          />

          {searchQuery.trim() ? (
            <div className="sidebar-section-list">
              <section aria-label="File search results">
                <div className="section-heading">
                  <p className="eyebrow">File matches</p>
                  <span>{searchResults.filenameMatches.length}</span>
                </div>
                <div className="result-list">
                  {searchResults.filenameMatches.map((result) => (
                    <button
                      key={result.id}
                      className="search-result"
                      type="button"
                      onClick={() => selectFile(result.fileId)}
                    >
                      <strong>{result.title}</strong>
                      <span>{result.excerpt}</span>
                    </button>
                  ))}
                  {searchResults.filenameMatches.length === 0 ? <p className="empty-copy">No file-name matches.</p> : null}
                </div>
              </section>

              <section aria-label="Content search results">
                <div className="section-heading">
                  <p className="eyebrow">Text matches</p>
                  <span>{searchResults.contentMatches.length}</span>
                </div>
                <div className="result-list">
                  {searchResults.contentMatches.map((result) => (
                    <button
                      key={result.id}
                      className="search-result"
                      type="button"
                      onClick={() => selectFile(result.fileId)}
                    >
                      <strong>{result.title}</strong>
                      <span>{result.excerpt}</span>
                    </button>
                  ))}
                  {searchResults.contentMatches.length === 0 ? <p className="empty-copy">No content matches.</p> : null}
                </div>
              </section>
            </div>
          ) : (
            <div className="sidebar-section-list">
              <section aria-label="Recent files">
                <div className="section-heading">
                  <p className="eyebrow">Recent files</p>
                </div>
                <div className="file-list">
                  {recentFiles.map((file) => (
                    <FileRow
                      key={`recent-${file.id}`}
                      file={file}
                      isSelected={file.id === selectedFile.id}
                      isRenaming={renamingFileId === file.id}
                      renameValue={renameValue}
                      onSelect={() => selectFile(file.id)}
                      onBeginRename={() => {
                        setRenamingFileId(file.id);
                        setRenameValue(file.title);
                      }}
                      onRenameChange={setRenameValue}
                      onCommitRename={() => {
                        renameFile(file.id, renameValue);
                        setRenamingFileId(null);
                      }}
                      onCancelRename={() => setRenamingFileId(null)}
                      onDelete={() => handleDeleteFile(file.id)}
                      showActions={false}
                    />
                  ))}
                </div>
              </section>

              <section aria-label="Pinned files">
                <div className="section-heading">
                  <p className="eyebrow">Pinned files</p>
                </div>
                <div className="file-list">
                  {pinnedFiles.map((file) => (
                    <FileRow
                      key={`pinned-${file.id}`}
                      file={file}
                      isSelected={file.id === selectedFile.id}
                      isRenaming={renamingFileId === file.id}
                      renameValue={renameValue}
                      onSelect={() => selectFile(file.id)}
                      onBeginRename={() => {
                        setRenamingFileId(file.id);
                        setRenameValue(file.title);
                      }}
                      onRenameChange={setRenameValue}
                      onCommitRename={() => {
                        renameFile(file.id, renameValue);
                        setRenamingFileId(null);
                      }}
                      onCancelRename={() => setRenamingFileId(null)}
                      onDelete={() => handleDeleteFile(file.id)}
                      showActions={false}
                    />
                  ))}
                </div>
              </section>

              <section aria-label="All files">
                <div className="section-heading">
                  <p className="eyebrow">All files</p>
                  <span>{activeWorkspace.files.length}</span>
                </div>
                <div className="file-list">
                  {activeWorkspace.files.map((file) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      isSelected={file.id === selectedFile.id}
                      isRenaming={renamingFileId === file.id}
                      renameValue={renameValue}
                      onSelect={() => selectFile(file.id)}
                      onBeginRename={() => {
                        setRenamingFileId(file.id);
                        setRenameValue(file.title);
                      }}
                      onRenameChange={setRenameValue}
                      onCommitRename={() => {
                        renameFile(file.id, renameValue);
                        setRenamingFileId(null);
                      }}
                      onCancelRename={() => setRenamingFileId(null)}
                      onDelete={() => handleDeleteFile(file.id)}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>

        <main className="editor-panel" aria-label="Markdown editor panel">
          <div className="editor-header">
            <div>
              <p className="eyebrow">Document</p>
              <input
                aria-label="Document title"
                className="title-input"
                value={selectedFile.title}
                onChange={(event) => renameFile(selectedFile.id, event.target.value)}
              />
              <p className="editor-meta">
                {selectedFile.path} · updated {selectedFile.updatedAt} · autosaves within this session
              </p>
            </div>
            <span className={`status-pill ${unpublishedChanges ? "status-draft" : "status-published"}`}>
              {selectedFile.lastPublished ? (unpublishedChanges ? "Unpublished changes" : "Published state current") : "Not published"}
            </span>
          </div>

          <MarkdownEditor
            value={selectedFile.content}
            onChange={(content) => updateFileContent(selectedFile.id, content)}
            onOpenLink={handleOpenMarkdownLink}
          />
        </main>

        <aside className="sidebar sidebar-right" aria-label="Agent and document context">
          <section className="sidebar-card proposal-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Agent review</p>
                <h2>{activeProposal ? "Pending proposal" : "No pending proposal"}</h2>
              </div>
            </div>

            {activeProposal ? (
              <div className="proposal-stack">
                <p className="proposal-summary">{activeProposal.summary}</p>
                <p className="proposal-rationale">{activeProposal.rationale}</p>
                <div className="proposal-changes">
                  {activeProposal.changes.map((change) => (
                    <article key={change.id} className="change-card">
                      <div className="change-head">
                        <strong>{change.title}</strong>
                        <span>{change.type === "create" ? "Create" : "Update"}</span>
                      </div>
                      <p>{change.summary}</p>
                      <pre className="diff-preview">{buildDiffPreview(change.beforeContent, change.afterContent)}</pre>
                    </article>
                  ))}
                </div>
                <div className="proposal-actions">
                  <button className="secondary-button" type="button" onClick={() => discardProposal(activeProposal.id)}>
                    Discard
                  </button>
                  <button className="primary-button" type="button" onClick={() => applyProposal(activeProposal.id)}>
                    Apply changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-copy">Ask the agent to summarize, rewrite, organize, expand, or create a new note.</p>
            )}
          </section>

          <section className="sidebar-card chat-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Agent chat</p>
                <h2>Workspace assistant</h2>
              </div>
            </div>

            <div className="suggested-prompt-list">
              {activeWorkspace.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  className="suggested-prompt"
                  type="button"
                  onClick={() => handleSubmitPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="chat-thread" aria-label="Agent chat thread">
              {activeWorkspace.chatMessages.map((message) => (
                <article key={message.id} className={`chat-message ${message.role}`}>
                  <div className="chat-message-head">
                    <strong>{message.role === "assistant" ? "Assistant" : "You"}</strong>
                    <span>{message.createdAt}</span>
                  </div>
                  <p>{message.content}</p>
                </article>
              ))}
            </div>

            <div className="chat-composer">
              <label className="visually-hidden" htmlFor="agent-prompt">
                Ask the agent
              </label>
              <textarea
                id="agent-prompt"
                className="app-input composer-input"
                value={agentPrompt}
                onChange={(event) => setAgentPrompt(event.target.value)}
                placeholder="Ask the agent to summarize, rewrite, organize, expand, or create a note"
              />
              <button className="secondary-button" type="button" onClick={() => handleSubmitPrompt(agentPrompt)}>
                Send
              </button>
            </div>
          </section>

          <section className="sidebar-card checkpoint-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Checkpoints</p>
                <h2>{selectedFile.checkpoints.length} saved states</h2>
              </div>
            </div>

            {checkpointOpen ? (
              <div className="checkpoint-form">
                <input
                  aria-label="Checkpoint name"
                  className="app-input"
                  value={checkpointName}
                  onChange={(event) => setCheckpointName(event.target.value)}
                  placeholder="Checkpoint name"
                />
                <textarea
                  aria-label="Checkpoint note"
                  className="app-input checkpoint-note"
                  value={checkpointNote}
                  onChange={(event) => setCheckpointNote(event.target.value)}
                  placeholder="Optional note"
                />
                <div className="checkpoint-form-actions">
                  <button className="secondary-button" type="button" onClick={() => setCheckpointOpen(false)}>
                    Cancel
                  </button>
                  <button className="secondary-button" type="button" onClick={handleCreateCheckpoint}>
                    Save checkpoint
                  </button>
                </div>
              </div>
            ) : null}

            <div className="checkpoint-list">
              {selectedFile.checkpoints.map((checkpoint) => (
                <article key={checkpoint.id} className="checkpoint-row">
                  <div>
                    <strong>{checkpoint.name}</strong>
                    <p>{checkpoint.createdAt}</p>
                    {checkpoint.note ? <span>{checkpoint.note}</span> : null}
                  </div>
                  <button
                    className="secondary-button compact-button"
                    type="button"
                    onClick={() => {
                      if (window.confirm("Restore this checkpoint into the current draft?")) {
                        restoreCheckpoint(selectedFile.id, checkpoint.id);
                      }
                    }}
                  >
                    Restore
                  </button>
                </article>
              ))}
              {selectedFile.checkpoints.length === 0 ? (
                <p className="empty-copy">Create a named checkpoint before a larger revision or a pre-publish draft.</p>
              ) : null}
            </div>
          </section>

          <section className="sidebar-card publish-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Publish status</p>
                <h2>{selectedFile.title}</h2>
              </div>
            </div>
            <p className="publish-status-copy">
              {selectedFile.lastPublished
                ? `Last published at ${selectedFile.lastPublished.publishedAt}. ${unpublishedChanges ? "Draft differs from the shared version." : "Draft matches the shared version."}`
                : "This note has not been published yet. Publishing remains an explicit action."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

interface FileRowProps {
  file: {
    id: string;
    title: string;
    path: string;
    updatedAt: string;
  };
  isSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onBeginRename: () => void;
  onRenameChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  showActions?: boolean;
}

function FileRow({
  file,
  isSelected,
  isRenaming,
  renameValue,
  onSelect,
  onBeginRename,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onDelete,
  showActions = true,
}: FileRowProps) {
  return (
    <div className={`file-row ${isSelected ? "selected" : ""}`}>
      {isRenaming ? (
        <div className="rename-form">
          <input
            aria-label={`Rename ${file.title}`}
            className="app-input rename-input"
            value={renameValue}
            onChange={(event) => onRenameChange(event.target.value)}
          />
          <div className="row-actions">
            <button className="secondary-button compact-button" type="button" onClick={onCommitRename}>
              Save
            </button>
            <button className="secondary-button compact-button" type="button" onClick={onCancelRename}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button className="file-select" type="button" onClick={onSelect}>
            <strong>{file.title}</strong>
            <span>{file.path}</span>
            <span>{file.updatedAt}</span>
          </button>
          {showActions ? (
            <div className="row-actions">
              <button className="icon-button" type="button" aria-label={`Rename ${file.title}`} onClick={onBeginRename}>
                Rename
              </button>
              <button className="icon-button" type="button" aria-label={`Delete ${file.title}`} onClick={onDelete}>
                Delete
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function buildDiffPreview(beforeContent: string | undefined, afterContent: string) {
  const beforeLines = (beforeContent ?? "").split("\n");
  const afterLines = afterContent.split("\n");
  const longest = Math.max(beforeLines.length, afterLines.length);
  const diffLines: string[] = [];

  for (let index = 0; index < longest; index += 1) {
    const beforeLine = beforeLines[index];
    const afterLine = afterLines[index];

    if (beforeLine === afterLine) {
      if (beforeLine) {
        diffLines.push(`  ${beforeLine}`);
      }
      continue;
    }

    if (beforeLine !== undefined && beforeLine !== "") {
      diffLines.push(`- ${beforeLine}`);
    }
    if (afterLine !== undefined && afterLine !== "") {
      diffLines.push(`+ ${afterLine}`);
    }
  }

  return diffLines.slice(0, 16).join("\n");
}
