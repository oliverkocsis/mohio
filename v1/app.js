const initialPages = [
  {
    id: "vision",
    space: "Product",
    title: "Vision.md",
    content: `# Mohio Vision

Mohio is a team workspace that stores everything as plain Markdown in Git.

## Why this exists
- Teams need a single source of truth.
- Knowledge should stay portable and future-proof.
- Collaboration should not require Git expertise.

## Principles
1. Offline-first editing.
2. Reviewable diffs before commits.
3. Clear publish workflow to \`main\`.
`,
  },
  {
    id: "collaboration",
    space: "Workflows",
    title: "Async Collaboration.md",
    content: `# Async Collaboration

Mohio intentionally avoids real-time editing.

## Draft flow
- Work on a personal branch: \`drafts/<username>\`.
- Changes auto-commit and sync between devices.
- Publishing applies approved drafts onto \`main\`.

## Conflict handling
When drift happens, users get a guided merge UI and can ask AI for a safe suggestion.
`,
  },
  {
    id: "ai",
    space: "Platform",
    title: "LLM Strategy.md",
    content: `# LLM-First Strategy

Mohio supports multiple providers with user-controlled keys.

## Goals
- Diff-first editing from assistants.
- User approval required before commit.
- Provider choice per workspace.

## Non-goals (v1)
- Real-time multiplayer editor.
- Database-style blocks.
`,
  },
];

const state = {
  username: "oliver",
  currentPageId: initialPages[0].id,
  pages: clonePages(initialPages),
  mainSnapshot: pageMap(initialPages),
  draftBranchCommits: 0,
  approvedSuggestions: 0,
  publishCount: 0,
  pendingSuggestion: null,
  conflict: null,
  activity: [],
  activeView: "edit",
};

const elements = {
  spaceList: document.querySelector("#spaceList"),
  branchBadge: document.querySelector("#branchBadge"),
  publishBadge: document.querySelector("#publishBadge"),
  pageTitle: document.querySelector("#pageTitle"),
  editorInput: document.querySelector("#editorInput"),
  previewView: document.querySelector("#previewView"),
  editorView: document.querySelector("#editorView"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  promptInput: document.querySelector("#promptInput"),
  generateBtn: document.querySelector("#generateBtn"),
  approveBtn: document.querySelector("#approveBtn"),
  publishBtn: document.querySelector("#publishBtn"),
  saveDraftBtn: document.querySelector("#saveDraftBtn"),
  diffOutput: document.querySelector("#diffOutput"),
  diffSummary: document.querySelector("#diffSummary"),
  activityList: document.querySelector("#activityList"),
  conflictBtn: document.querySelector("#conflictBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  conflictPanel: document.querySelector("#conflictPanel"),
  conflictText: document.querySelector("#conflictText"),
  keepDraftBtn: document.querySelector("#keepDraftBtn"),
  keepMainBtn: document.querySelector("#keepMainBtn"),
  mergeBtn: document.querySelector("#mergeBtn"),
};

init();

function init() {
  bindEvents();
  logActivity("Workspace loaded on drafts branch.");
  render();
}

function bindEvents() {
  elements.editorInput.addEventListener("input", (event) => {
    const page = getCurrentPage();
    page.content = event.target.value;
    if (state.activeView === "preview") {
      renderPreview(page.content);
    }
    renderDiffPanel();
  });

  elements.saveDraftBtn.addEventListener("click", () => {
    state.draftBranchCommits += 1;
    logActivity(`Draft commit saved for ${getCurrentPage().title}.`);
    renderBadges();
  });

  elements.generateBtn.addEventListener("click", () => {
    const instruction = elements.promptInput.value.trim();
    const page = getCurrentPage();
    const proposed = generateSuggestion(page.content, instruction);
    state.pendingSuggestion = {
      pageId: page.id,
      instruction: instruction || "General clarity improvements",
      before: page.content,
      after: proposed,
    };
    logActivity("Assistant proposed a reviewable diff.");
    renderDiffPanel();
  });

  elements.approveBtn.addEventListener("click", () => {
    if (!state.pendingSuggestion) {
      return;
    }
    const targetPage = state.pages.find((page) => page.id === state.pendingSuggestion.pageId);
    targetPage.content = state.pendingSuggestion.after;
    state.approvedSuggestions += 1;
    state.draftBranchCommits += 1;
    logActivity(`Approved AI suggestion on ${targetPage.title}.`);
    state.pendingSuggestion = null;
    render();
  });

  elements.publishBtn.addEventListener("click", () => {
    publishDrafts();
  });

  elements.conflictBtn.addEventListener("click", () => {
    simulateConflict();
  });

  elements.resetBtn.addEventListener("click", () => {
    resetState();
    logActivity("Demo reset to initial workspace state.");
    render();
  });

  elements.keepDraftBtn.addEventListener("click", () => {
    if (!state.conflict) {
      return;
    }
    const pageId = state.conflict.pageId;
    const draftVersion = getDraftContent(pageId);
    state.mainSnapshot[pageId] = draftVersion;
    closeConflict("Kept draft version and published to main.");
  });

  elements.keepMainBtn.addEventListener("click", () => {
    if (!state.conflict) {
      return;
    }
    const pageId = state.conflict.pageId;
    setDraftContent(pageId, state.mainSnapshot[pageId]);
    closeConflict("Kept main version and synced draft.");
  });

  elements.mergeBtn.addEventListener("click", () => {
    if (!state.conflict) {
      return;
    }
    const pageId = state.conflict.pageId;
    const merged = mergeVersions(getDraftContent(pageId), state.mainSnapshot[pageId]);
    setDraftContent(pageId, merged);
    state.mainSnapshot[pageId] = merged;
    closeConflict("Merged both versions with guided resolution.");
  });

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeView = tab.dataset.view;
      elements.tabs.forEach((candidate) => candidate.classList.remove("active"));
      tab.classList.add("active");
      renderViewMode();
    });
  });
}

function publishDrafts() {
  const changedPages = state.pages.filter((page) => state.mainSnapshot[page.id] !== page.content);
  if (!changedPages.length) {
    logActivity("Nothing to publish. Draft is already in sync.");
    renderBadges();
    return;
  }

  const conflictTarget = changedPages.find((page) => state.conflict && state.conflict.pageId === page.id);
  if (conflictTarget) {
    showConflict(conflictTarget);
    return;
  }

  changedPages.forEach((page) => {
    state.mainSnapshot[page.id] = page.content;
  });
  state.publishCount += 1;
  logActivity(`Published ${changedPages.length} page(s) to main.`);
  renderBadges();
}

function simulateConflict() {
  const page = getCurrentPage();
  const remoteLine = `- Remote update on main at ${new Date().toLocaleTimeString()}.`;
  const remote = `${state.mainSnapshot[page.id].trim()}\n${remoteLine}\n`;
  state.mainSnapshot[page.id] = remote;
  state.conflict = {
    pageId: page.id,
    title: page.title,
  };
  logActivity(`Simulated main branch drift for ${page.title}.`);
  renderBadges();
}

function showConflict(page) {
  elements.conflictPanel.classList.remove("hidden");
  elements.conflictText.textContent =
    `Main changed ${page.title} since your draft diverged. Choose a merge strategy to continue publishing.`;
  logActivity(`Publish blocked by conflict in ${page.title}.`);
}

function closeConflict(message) {
  state.conflict = null;
  state.publishCount += 1;
  elements.conflictPanel.classList.add("hidden");
  logActivity(message);
  render();
}

function resetState() {
  state.currentPageId = initialPages[0].id;
  state.pages = clonePages(initialPages);
  state.mainSnapshot = pageMap(initialPages);
  state.draftBranchCommits = 0;
  state.approvedSuggestions = 0;
  state.publishCount = 0;
  state.pendingSuggestion = null;
  state.conflict = null;
  state.activity = [];
  state.activeView = "edit";
  elements.promptInput.value = "";
}

function render() {
  renderSpaceList();
  renderEditor();
  renderPreview(getCurrentPage().content);
  renderViewMode();
  renderDiffPanel();
  renderBadges();
  renderActivity();
  renderConflictPanel();
}

function renderSpaceList() {
  const bySpace = state.pages.reduce((accumulator, page) => {
    if (!accumulator[page.space]) {
      accumulator[page.space] = [];
    }
    accumulator[page.space].push(page);
    return accumulator;
  }, {});

  elements.spaceList.innerHTML = "";
  Object.keys(bySpace).forEach((spaceName) => {
    const group = document.createElement("div");
    group.className = "space-group";

    const title = document.createElement("p");
    title.className = "space-name";
    title.textContent = spaceName;
    group.appendChild(title);

    bySpace[spaceName].forEach((page) => {
      const button = document.createElement("button");
      button.className = "page-link";
      if (page.id === state.currentPageId) {
        button.classList.add("active");
      }
      button.textContent = page.title;
      button.addEventListener("click", () => {
        state.currentPageId = page.id;
        state.pendingSuggestion = null;
        render();
      });
      group.appendChild(button);
    });

    elements.spaceList.appendChild(group);
  });
}

function renderEditor() {
  const page = getCurrentPage();
  elements.pageTitle.textContent = page.title;
  elements.editorInput.value = page.content;
}

function renderPreview(source) {
  elements.previewView.innerHTML = markdownToHtml(source);
}

function renderViewMode() {
  const editMode = state.activeView === "edit";
  elements.editorView.classList.toggle("hidden", !editMode);
  elements.previewView.classList.toggle("hidden", editMode);
}

function renderDiffPanel() {
  if (!state.pendingSuggestion) {
    elements.diffSummary.textContent = "";
    elements.diffOutput.textContent = "No pending AI suggestion.";
    elements.approveBtn.disabled = true;
    return;
  }

  const diff = createDiff(state.pendingSuggestion.before, state.pendingSuggestion.after);
  elements.diffOutput.innerHTML = diff.lines.map(lineToHtml).join("\n");
  elements.diffSummary.textContent = `+${diff.added} / -${diff.removed} lines`;
  elements.approveBtn.disabled = false;
}

function renderBadges() {
  const draftBranch = `drafts/${state.username}`;
  const pendingPublish = state.pages.filter((page) => state.mainSnapshot[page.id] !== page.content).length;
  elements.branchBadge.textContent = `${draftBranch} commits: ${state.draftBranchCommits}`;
  elements.publishBadge.textContent = `Pending pages: ${pendingPublish} | Publishes: ${state.publishCount}`;
}

function renderActivity() {
  elements.activityList.innerHTML = "";
  const activity = state.activity.slice(-8).reverse();
  activity.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `<div>${entry.message}</div><div class="time">${entry.time}</div>`;
    elements.activityList.appendChild(item);
  });
}

function renderConflictPanel() {
  const visible = Boolean(state.conflict);
  elements.conflictPanel.classList.toggle("hidden", !visible);
  if (!visible) {
    return;
  }
  elements.conflictText.textContent = `${state.conflict.title} has diverged between draft and main. Choose how to resolve before publish.`;
}

function logActivity(message) {
  state.activity.push({
    message,
    time: new Date().toLocaleTimeString(),
  });
  renderActivity();
}

function getCurrentPage() {
  return state.pages.find((page) => page.id === state.currentPageId);
}

function getDraftContent(pageId) {
  return state.pages.find((page) => page.id === pageId).content;
}

function setDraftContent(pageId, content) {
  const page = state.pages.find((candidate) => candidate.id === pageId);
  page.content = content;
}

function clonePages(pages) {
  return pages.map((page) => ({ ...page }));
}

function pageMap(pages) {
  const map = {};
  pages.forEach((page) => {
    map[page.id] = page.content;
  });
  return map;
}

function generateSuggestion(content, instruction) {
  const cleanInstruction = instruction || "Improve clarity for a non-technical audience.";
  const lowered = cleanInstruction.toLowerCase();
  const lines = content.trimEnd().split("\n");

  if (lowered.includes("checklist")) {
    lines.push("");
    lines.push("## Publish Checklist");
    lines.push("- [ ] Review AI-generated diff.");
    lines.push("- [ ] Approve only required changes.");
    lines.push("- [ ] Publish selected pages to `main`.");
  } else if (lowered.includes("summary")) {
    lines.push("");
    lines.push("## Executive Summary");
    lines.push("Mohio delivers Git-level safety with a workspace UX that non-technical teams can adopt quickly.");
  } else {
    lines.push("");
    lines.push("## AI Suggested Improvements");
    lines.push(`- ${cleanInstruction}`);
    lines.push("- Add clearer onboarding language for teammates new to Git.");
    lines.push("- Highlight approval before commit as a safety control.");
  }

  return lines.join("\n") + "\n";
}

function createDiff(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const lines = [];
  let added = 0;
  let removed = 0;
  const limit = Math.max(a.length, b.length);

  for (let i = 0; i < limit; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      lines.push({ type: "context", value: left || " " });
      continue;
    }
    if (typeof left === "string") {
      removed += 1;
      lines.push({ type: "remove", value: left });
    }
    if (typeof right === "string") {
      added += 1;
      lines.push({ type: "add", value: right });
    }
  }

  return { lines, added, removed };
}

function lineToHtml(line) {
  const text = escapeHtml(line.value);
  if (line.type === "add") {
    return `<span class="line-add">+ ${text}</span>`;
  }
  if (line.type === "remove") {
    return `<span class="line-remove">- ${text}</span>`;
  }
  return `<span class="line-context">  ${text}</span>`;
}

function mergeVersions(draft, main) {
  const draftLines = draft.split("\n");
  const mainLines = main.split("\n");
  const merged = [...mainLines];
  draftLines.forEach((line) => {
    if (!merged.includes(line)) {
      merged.push(line);
    }
  });
  return `${merged.join("\n")}\n`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inList = false;
  let inNumbered = false;

  function closeLists() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (inNumbered) {
      html.push("</ol>");
      inNumbered = false;
    }
  }

  lines.forEach((raw) => {
    const line = raw.trimEnd();

    if (!line.trim()) {
      closeLists();
      return;
    }

    if (line.startsWith("### ")) {
      closeLists();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      return;
    }
    if (line.startsWith("## ")) {
      closeLists();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      return;
    }
    if (line.startsWith("# ")) {
      closeLists();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      return;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        closeLists();
        inList = true;
        html.push("<ul>");
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      if (!inNumbered) {
        closeLists();
        inNumbered = true;
        html.push("<ol>");
      }
      html.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s/, ""))}</li>`);
      return;
    }

    closeLists();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  });

  closeLists();
  return html.join("");
}

function inlineMarkdown(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
