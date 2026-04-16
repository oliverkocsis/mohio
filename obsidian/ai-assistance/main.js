var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MohioAIAssistancePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_child_process = require("child_process");
var import_readline = require("readline");
var VIEW_TYPE_ASSISTANT = "mohio-ai-assistance";
var DEFAULT_ASSISTANT_INSTRUCTIONS = [
  "You are Codex embedded inside Mohio, a local-first Markdown workspace for small teams.",
  "Work as a chat-first assistant for a Markdown knowledgebase.",
  "Treat the active document as the primary context and the wider workspace as supporting context.",
  "You may inspect the rest of the workspace when useful.",
  "Do not make file edits, propose patches, or claim to have changed files in this environment.",
  "Return concise, practical answers that fit a document-first workflow."
].join("\n");
var MOHIO_PROMPT_OPEN = "[MOHIO_USER_REQUEST]";
var MOHIO_PROMPT_CLOSE = "[/MOHIO_USER_REQUEST]";
var TURN_START_MAX_ROLLOUT_RETRIES = 3;
var TURN_START_ROLLOUT_RETRY_DELAY_MS = 120;
function createAssistantRuntime() {
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = () => (/* @__PURE__ */ new Date()).toISOString();
  const listeners = /* @__PURE__ */ new Set();
  const threadStates = /* @__PURE__ */ new Map();
  let connectionPromise = null;
  let childProcess = null;
  const emit = (event) => {
    for (const listener of listeners) {
      listener(event);
    }
  };
  const emitThread = (threadId) => {
    const threadState = threadStates.get(threadId);
    if (!threadState)
      return;
    emit({
      type: "thread",
      workspacePath: threadState.thread.workspacePath,
      thread: cloneThread(threadState.thread)
    });
  };
  const emitThreadList = async (workspacePath) => {
    try {
      const threads = await listThreads({ workspacePath });
      emit({ type: "thread-list", workspacePath, threads });
    } catch (e) {
    }
  };
  const getConnection = () => {
    if (!connectionPromise) {
      connectionPromise = createServerConnection({
        onChildProcess: (child) => {
          childProcess = child;
        },
        onExit: (errorMessage) => {
          for (const [threadId, threadState] of threadStates.entries()) {
            if (threadState.thread.status !== "running")
              continue;
            threadState.turnId = null;
            threadState.assistantMessageId = null;
            threadState.thread.status = "error";
            threadState.thread.errorMessage = errorMessage;
            emitThread(threadId);
          }
          connectionPromise = null;
          childProcess = null;
        },
        onNotification: (notification) => {
          handleServerNotification({
            createId,
            emitThread,
            emitThreadList,
            now,
            notification,
            threadStates
          });
        }
      });
    }
    return connectionPromise;
  };
  const cacheThread = (thread, options = {}) => {
    var _a, _b, _c, _d;
    const existingState = threadStates.get(thread.id);
    threadStates.set(thread.id, {
      assistantMessageId: (_a = existingState == null ? void 0 : existingState.assistantMessageId) != null ? _a : null,
      isTurnReady: (_c = (_b = options.isTurnReady) != null ? _b : existingState == null ? void 0 : existingState.isTurnReady) != null ? _c : false,
      thread,
      turnId: (_d = existingState == null ? void 0 : existingState.turnId) != null ? _d : null
    });
  };
  const ensureLoadedThread = async ({
    threadId,
    workspacePath
  }) => {
    const connection = await getConnection();
    const threadState = threadStates.get(threadId);
    if ((threadState == null ? void 0 : threadState.thread.workspacePath) === workspacePath && threadState.isTurnReady) {
      return threadState.thread;
    }
    const response = await connection.request("thread/resume", {
      approvalPolicy: "never",
      cwd: workspacePath,
      developerInstructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
      persistExtendedHistory: true,
      sandbox: "read-only",
      threadId
    });
    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath
    });
    cacheThread(assistantThread, { isTurnReady: true });
    return assistantThread;
  };
  const listThreads = async ({
    workspacePath
  }) => {
    const connection = await getConnection();
    let nextCursor = null;
    const threads = [];
    do {
      const response = await connection.request("thread/list", {
        archived: false,
        cursor: nextCursor,
        cwd: workspacePath,
        sortKey: "updated_at"
      });
      for (const thread of response.data) {
        threads.push(mapCodexThreadToSummary(thread));
      }
      nextCursor = response.nextCursor;
    } while (nextCursor);
    return threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  };
  const createThread = async ({
    workspacePath
  }) => {
    const connection = await getConnection();
    const response = await connection.request("thread/start", {
      approvalPolicy: "never",
      cwd: workspacePath,
      developerInstructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
      ephemeral: false,
      experimentalRawEvents: false,
      persistExtendedHistory: true,
      sandbox: "read-only"
    });
    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath
    });
    cacheThread(assistantThread, { isTurnReady: true });
    void emitThreadList(workspacePath);
    emitThread(assistantThread.id);
    return cloneThread(assistantThread);
  };
  const getThread = async ({
    threadId,
    workspacePath
  }) => {
    const connection = await getConnection();
    let response;
    try {
      response = await connection.request("thread/read", {
        includeTurns: true,
        threadId
      });
    } catch (error) {
      if (!isUnmaterializedThreadReadError(error))
        throw error;
      response = await connection.request("thread/read", {
        includeTurns: false,
        threadId
      });
    }
    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath
    });
    cacheThread(assistantThread, { isTurnReady: false });
    return cloneThread(assistantThread);
  };
  const sendMessage = async ({
    content,
    documentMarkdown,
    documentTitle,
    documentRelativePath,
    threadId,
    workspaceName,
    workspacePath
  }) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error("Enter a message before asking Codex for help.");
    }
    await ensureLoadedThread({ threadId, workspacePath });
    const threadState = threadStates.get(threadId);
    if (!threadState) {
      throw new Error("Mohio could not load the selected Codex conversation.");
    }
    if (threadState.turnId) {
      throw new Error("Wait for the current Codex run to finish.");
    }
    const userMessage = {
      id: createId(),
      role: "user",
      content: trimmedContent,
      createdAt: now()
    };
    const assistantMessage = {
      id: createId(),
      role: "assistant",
      content: "",
      createdAt: now()
    };
    threadState.assistantMessageId = assistantMessage.id;
    threadState.thread.errorMessage = null;
    threadState.thread.messages = [...threadState.thread.messages, userMessage, assistantMessage];
    threadState.thread.preview = threadState.thread.preview || trimmedContent;
    threadState.thread.status = "running";
    emitThread(threadId);
    void emitThreadList(workspacePath);
    try {
      const connection = await getConnection();
      const turnStartParams = {
        cwd: workspacePath,
        input: [
          {
            text: buildAssistantPrompt({
              documentMarkdown,
              documentTitle,
              documentRelativePath,
              userRequest: trimmedContent,
              workspaceName,
              workspacePath
            }),
            text_elements: [],
            type: "text"
          }
        ],
        threadId
      };
      let response = null;
      let rolloutRetryCount = 0;
      while (!response) {
        try {
          response = await connection.request(
            "turn/start",
            turnStartParams
          );
        } catch (error) {
          if (!isNoRolloutFoundError(error) || rolloutRetryCount >= TURN_START_MAX_ROLLOUT_RETRIES) {
            throw error;
          }
          rolloutRetryCount += 1;
          await resumeThread({ connection, threadId, threadState, workspacePath });
          await wait(TURN_START_ROLLOUT_RETRY_DELAY_MS);
        }
      }
      threadState.turnId = response.turn.id;
    } catch (error) {
      threadState.assistantMessageId = null;
      threadState.thread.errorMessage = getErrorMessage(error);
      threadState.thread.status = "error";
      emitThread(threadId);
      throw error;
    }
    return cloneThread(threadState.thread);
  };
  const cancelRun = async ({
    threadId
  }) => {
    const threadState = threadStates.get(threadId);
    if (!(threadState == null ? void 0 : threadState.turnId))
      return;
    const connection = await getConnection();
    const turnId = threadState.turnId;
    threadState.turnId = null;
    threadState.assistantMessageId = null;
    threadState.thread.errorMessage = null;
    threadState.thread.status = "idle";
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    await connection.request("turn/interrupt", {
      threadId,
      turnId
    });
  };
  const renameThread = async ({
    threadId,
    title,
    workspacePath
  }) => {
    const nextTitle = title.trim();
    if (!nextTitle)
      throw new Error("Enter a title before renaming this chat.");
    const connection = await getConnection();
    await connection.request("thread/name/set", {
      name: nextTitle,
      threadId
    });
    const threadState = threadStates.get(threadId);
    if (threadState) {
      threadState.thread.title = nextTitle;
      emitThread(threadId);
    }
    void emitThreadList(workspacePath);
  };
  const deleteThread = async ({
    threadId,
    workspacePath
  }) => {
    const connection = await getConnection();
    await connection.request("thread/archive", { threadId });
    threadStates.delete(threadId);
    void emitThreadList(workspacePath);
  };
  const dispose = () => {
    if (childProcess) {
      childProcess.kill();
      childProcess = null;
    }
    connectionPromise = null;
    listeners.clear();
    threadStates.clear();
  };
  return {
    cancelRun,
    createThread,
    deleteThread,
    getThread,
    listThreads,
    onEvent: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    renameThread,
    sendMessage,
    dispose
  };
}
function createServerConnection({
  onChildProcess,
  onExit,
  onNotification
}) {
  const child = (0, import_child_process.spawn)("codex", ["app-server"], {
    stdio: "pipe"
  });
  onChildProcess(child);
  const stdoutReader = (0, import_readline.createInterface)({ input: child.stdout });
  const stderrReader = (0, import_readline.createInterface)({ input: child.stderr });
  let nextRequestId = 1;
  const pendingRequests = /* @__PURE__ */ new Map();
  const connection = {
    request: (method, params) => new Promise((resolve, reject) => {
      const requestId = nextRequestId++;
      pendingRequests.set(requestId, {
        resolve: (value) => resolve(value),
        reject
      });
      const request = { id: requestId, method, params };
      child.stdin.write(`${JSON.stringify(request)}
`);
    })
  };
  child.on("close", () => {
    stdoutReader.close();
    stderrReader.close();
    for (const pending of pendingRequests.values()) {
      pending.reject(new Error("Mohio lost its connection to Codex."));
    }
    pendingRequests.clear();
    onExit("Mohio lost its connection to the installed Codex app server.");
  });
  stdoutReader.on("line", (line) => {
    var _a;
    const parsed = parseJsonLine(line);
    if (!parsed)
      return;
    if (typeof parsed.id === "number") {
      const pending = pendingRequests.get(parsed.id);
      if (!pending)
        return;
      pendingRequests.delete(parsed.id);
      if (parsed.error) {
        pending.reject(new Error((_a = parsed.error.message) != null ? _a : "Codex returned an unknown error."));
        return;
      }
      pending.resolve(parsed.result);
      return;
    }
    if (typeof parsed.method === "string") {
      onNotification(parsed);
    }
  });
  stderrReader.on("line", () => {
  });
  return connection.request("initialize", {
    capabilities: {
      experimentalApi: true,
      optOutNotificationMethods: null
    },
    clientInfo: { name: "mohio", title: "Mohio", version: "0.1.0" }
  }).then(() => connection);
}
function handleServerNotification({
  createId,
  emitThread,
  emitThreadList,
  now,
  notification,
  threadStates
}) {
  var _a, _b;
  const params = isRecord(notification.params) ? notification.params : null;
  if (!params || typeof notification.method !== "string")
    return;
  if (notification.method === "thread/started") {
    const thread = parseCodexThread(params.thread);
    if (!thread)
      return;
    const existingState = threadStates.get(thread.id);
    threadStates.set(thread.id, {
      assistantMessageId: (_a = existingState == null ? void 0 : existingState.assistantMessageId) != null ? _a : null,
      isTurnReady: true,
      thread: mapCodexThreadToAssistantThread({ thread, workspacePath: thread.cwd }),
      turnId: (_b = existingState == null ? void 0 : existingState.turnId) != null ? _b : null
    });
    emitThread(thread.id);
    void emitThreadList(thread.cwd);
    return;
  }
  if (notification.method === "thread/status/changed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId)
      return;
    threadState.thread.status = mapCodexStatusToAssistantStatus(params.status);
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }
  if (notification.method === "thread/name/updated") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId)
      return;
    threadState.thread.title = typeof params.threadName === "string" && params.threadName.trim() ? params.threadName : threadState.thread.preview || "New chat";
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }
  if (notification.method === "thread/archived") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId)
      return;
    threadStates.delete(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }
  if (notification.method === "turn/started") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const turn = isRecord(params.turn) ? params.turn : null;
    const turnId = turn && typeof turn.id === "string" ? turn.id : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId || !turnId)
      return;
    threadState.turnId = turnId;
    threadState.thread.status = "running";
    emitThread(threadId);
    return;
  }
  if (notification.method === "turn/completed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const turn = isRecord(params.turn) ? params.turn : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId || !turn)
      return;
    threadState.turnId = null;
    threadState.assistantMessageId = null;
    if (turn.status === "failed") {
      threadState.thread.errorMessage = getTurnErrorMessage(turn.error);
      threadState.thread.status = "error";
    } else {
      threadState.thread.errorMessage = null;
      threadState.thread.status = "idle";
    }
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }
  if (notification.method === "error") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    const error = isRecord(params.error) ? params.error : null;
    if (!threadState || !threadId)
      return;
    threadState.thread.errorMessage = typeof (error == null ? void 0 : error.message) === "string" ? error.message : "Codex could not complete that run.";
    if (params.willRetry !== true) {
      threadState.turnId = null;
      threadState.assistantMessageId = null;
      threadState.thread.status = "error";
      emitThread(threadId);
      void emitThreadList(threadState.thread.workspacePath);
    }
    return;
  }
  if (notification.method === "item/agentMessage/delta") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const delta = typeof params.delta === "string" ? params.delta : null;
    const itemId = typeof params.itemId === "string" ? params.itemId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId || !delta)
      return;
    const assistantMessage = getOrCreateAssistantMessage({ createId, itemId, now, threadState });
    assistantMessage.content += delta;
    threadState.thread.status = "running";
    emitThread(threadId);
    return;
  }
  if (notification.method === "item/completed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    const item = isRecord(params.item) ? params.item : null;
    if (!threadState || !threadId || !isAgentMessageItem(item))
      return;
    const assistantMessage = getOrCreateAssistantMessage({
      createId,
      itemId: typeof item.id === "string" ? item.id : null,
      now,
      threadState
    });
    if (item.text.trim().length > 0 || assistantMessage.content.length === 0) {
      assistantMessage.content = item.text;
    }
    emitThread(threadId);
    return;
  }
}
function getOrCreateAssistantMessage({
  createId,
  itemId,
  now,
  threadState
}) {
  var _a, _b;
  const pendingId = threadState.assistantMessageId;
  let assistantMessageId = pendingId;
  if (itemId) {
    assistantMessageId = itemId;
    threadState.assistantMessageId = itemId;
  }
  let msg = assistantMessageId ? (_a = threadState.thread.messages.find((m) => m.id === assistantMessageId)) != null ? _a : null : null;
  if (!msg && pendingId) {
    msg = (_b = threadState.thread.messages.find((m) => m.id === pendingId)) != null ? _b : null;
    if (msg && itemId)
      msg.id = itemId;
  }
  if (!msg) {
    msg = {
      id: assistantMessageId != null ? assistantMessageId : createId(),
      role: "assistant",
      content: "",
      createdAt: now()
    };
    threadState.assistantMessageId = msg.id;
    threadState.thread.messages = [...threadState.thread.messages, msg];
  }
  return msg;
}
async function resumeThread({
  connection,
  threadId,
  threadState,
  workspacePath
}) {
  const response = await connection.request("thread/resume", {
    approvalPolicy: "never",
    cwd: workspacePath,
    developerInstructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
    persistExtendedHistory: true,
    sandbox: "read-only",
    threadId
  });
  const resumedThread = mapCodexThreadToAssistantThread({
    thread: response.thread,
    workspacePath
  });
  threadState.isTurnReady = true;
  threadState.thread = {
    ...resumedThread,
    errorMessage: threadState.thread.errorMessage,
    messages: threadState.thread.messages,
    preview: threadState.thread.preview || resumedThread.preview,
    status: threadState.thread.status
  };
}
function buildAssistantPrompt({
  documentMarkdown,
  documentTitle,
  documentRelativePath,
  userRequest,
  workspaceName,
  workspacePath
}) {
  return [
    MOHIO_PROMPT_OPEN,
    userRequest,
    MOHIO_PROMPT_CLOSE,
    "",
    "Treat the current document as primary context.",
    `Workspace name: ${workspaceName}`,
    `Workspace path: ${workspacePath}`,
    `Current document title: ${documentTitle}`,
    `Current document path: ${documentRelativePath}`,
    "Current document body:",
    "```markdown",
    documentMarkdown.trimEnd(),
    "```"
  ].join("\n");
}
function mapCodexThreadToSummary(thread) {
  return {
    createdAt: toIsoTimestamp(thread.createdAt),
    id: thread.id,
    preview: getThreadPreview(thread.preview),
    status: mapCodexStatusToAssistantStatus(thread.status),
    title: getThreadTitle(thread),
    updatedAt: toIsoTimestamp(thread.updatedAt)
  };
}
function mapCodexThreadToAssistantThread({
  thread,
  workspacePath
}) {
  return {
    errorMessage: null,
    id: thread.id,
    messages: flattenThreadMessages(thread),
    preview: getThreadPreview(thread.preview),
    status: mapCodexStatusToAssistantStatus(thread.status),
    title: getThreadTitle(thread),
    workspacePath
  };
}
function flattenThreadMessages(thread) {
  const messages = [];
  const createdAt = toIsoTimestamp(thread.createdAt);
  for (const turn of thread.turns) {
    for (const item of turn.items) {
      if (isUserMessageItem(item)) {
        const content = getDisplayUserMessage(item.content);
        if (!content)
          continue;
        messages.push({ content, createdAt, id: item.id, role: "user" });
      }
      if (isAgentMessageItem(item)) {
        messages.push({ content: item.text, createdAt, id: item.id, role: "assistant" });
      }
    }
  }
  return messages;
}
function getDisplayUserMessage(contentItems) {
  var _a;
  const rawText = contentItems.map((item) => isTextUserInput(item) ? item.text : "").join("\n").trim();
  return (_a = extractMohioUserRequest(rawText)) != null ? _a : rawText;
}
function extractMohioUserRequest(text) {
  const startIndex = text.indexOf(MOHIO_PROMPT_OPEN);
  const endIndex = text.indexOf(MOHIO_PROMPT_CLOSE);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex)
    return null;
  return text.slice(startIndex + MOHIO_PROMPT_OPEN.length, endIndex).trim();
}
function getThreadPreview(preview) {
  var _a;
  return (_a = extractMohioUserRequest(preview)) != null ? _a : preview.trim();
}
function getThreadTitle(thread) {
  var _a;
  return ((_a = thread.name) == null ? void 0 : _a.trim()) || getThreadPreview(thread.preview) || "New chat";
}
function mapCodexStatusToAssistantStatus(status) {
  if (!isRecord(status) || typeof status.type !== "string")
    return "idle";
  if (status.type === "active")
    return "running";
  if (status.type === "systemError")
    return "error";
  return "idle";
}
function getTurnErrorMessage(turnError) {
  if (!isRecord(turnError) || typeof turnError.message !== "string") {
    return "Codex could not complete that run.";
  }
  if (typeof turnError.additionalDetails === "string" && turnError.additionalDetails.trim()) {
    return `${turnError.message} ${turnError.additionalDetails}`.trim();
  }
  return turnError.message;
}
function getErrorMessage(error) {
  if (error instanceof Error && error.message.trim())
    return error.message;
  return "Mohio could not start the installed Codex app server.";
}
function isUnmaterializedThreadReadError(error) {
  return error instanceof Error && error.message.includes("is not materialized yet") && error.message.includes("includeTurns");
}
function isNoRolloutFoundError(error) {
  return error instanceof Error && error.message.includes("no rollout found for thread id");
}
function parseCodexThread(value) {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.cwd !== "string") {
    return null;
  }
  return value;
}
function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch (e) {
    return null;
  }
}
function toIsoTimestamp(unixTimestampSeconds) {
  return new Date(unixTimestampSeconds * 1e3).toISOString();
}
function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
function cloneThread(thread) {
  return { ...thread, messages: thread.messages.map((m) => ({ ...m })) };
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function isAgentMessageItem(item) {
  return isRecord(item) && item.type === "agentMessage" && typeof item.text === "string";
}
function isUserMessageItem(item) {
  return isRecord(item) && item.type === "userMessage" && Array.isArray(item.content);
}
function isTextUserInput(item) {
  return item.type === "text" && "text" in item && typeof item.text === "string";
}
var PromptModal = class extends import_obsidian.Modal {
  constructor(app, label, initial) {
    super(app);
    this.label = label;
    this.initial = initial;
    this.resolve = () => {
    };
  }
  open() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.label, cls: "mohio-prompt-label" });
    this.inputEl = contentEl.createEl("input", {
      type: "text",
      cls: "mohio-prompt-input"
    });
    this.inputEl.value = this.initial;
    const btnRow = contentEl.createDiv({ cls: "mohio-prompt-buttons" });
    const confirmBtn = btnRow.createEl("button", {
      text: "Confirm",
      cls: "mod-cta"
    });
    const cancelBtn = btnRow.createEl("button", { text: "Cancel" });
    confirmBtn.addEventListener("click", () => {
      this.resolve(this.inputEl.value.trim() || null);
      this.close();
    });
    cancelBtn.addEventListener("click", () => {
      this.resolve(null);
      this.close();
    });
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.resolve(this.inputEl.value.trim() || null);
        this.close();
      } else if (e.key === "Escape") {
        this.resolve(null);
        this.close();
      }
    });
    setTimeout(() => this.inputEl.select(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AssistantView = class extends import_obsidian.ItemView {
  constructor(leaf, runtime, vaultPath, vaultName) {
    super(leaf);
    // State
    this.viewMode = "list";
    this.threads = [];
    this.activeThread = null;
    this.isLoadingThreads = false;
    this.runtime = runtime;
    this.vaultPath = vaultPath;
    this.vaultName = vaultName;
  }
  getViewType() {
    return VIEW_TYPE_ASSISTANT;
  }
  getDisplayText() {
    return "AI Assistance";
  }
  getIcon() {
    return "bot";
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mohio-assistant-container");
    this.panelEl = contentEl.createDiv({ cls: "mohio-panel" });
    this.mainContentEl = this.panelEl.createDiv({ cls: "mohio-main-content" });
    this.footerEl = this.panelEl.createDiv({ cls: "mohio-footer" });
    this.buildFooter();
    this.unsubscribeRuntime = this.runtime.onEvent((event) => {
      var _a, _b, _c;
      if (event.workspacePath !== this.vaultPath)
        return;
      if (event.type === "thread-list") {
        this.threads = event.threads;
        if (this.viewMode === "list") {
          this.renderList();
        }
      }
      if (event.type === "thread") {
        if (this.viewMode === "thread" && ((_a = this.activeThread) == null ? void 0 : _a.id) === event.thread.id) {
          this.activeThread = event.thread;
          this.renderThread();
        }
        const idx = this.threads.findIndex((t) => t.id === event.thread.id);
        const summary = {
          id: event.thread.id,
          title: event.thread.title,
          preview: event.thread.preview,
          status: event.thread.status,
          createdAt: (_c = (_b = event.thread.messages[0]) == null ? void 0 : _b.createdAt) != null ? _c : (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (idx >= 0) {
          this.threads = [
            ...this.threads.slice(0, idx),
            summary,
            ...this.threads.slice(idx + 1)
          ];
        }
      }
    });
    this.unsubscribeWorkspace = this.app.workspace.on("active-leaf-change", () => {
      this.updateComposerState();
    });
    await this.showListView();
  }
  async onClose() {
    var _a;
    (_a = this.unsubscribeRuntime) == null ? void 0 : _a.call(this);
    if (this.unsubscribeWorkspace) {
      this.app.workspace.offref(this.unsubscribeWorkspace);
    }
  }
  // ── Navigation ──────────────────────────────────────────────────────────────
  async showListView() {
    this.viewMode = "list";
    this.activeThread = null;
    this.isLoadingThreads = true;
    this.renderList();
    try {
      this.threads = await this.runtime.listThreads({ workspacePath: this.vaultPath });
    } catch (e) {
      this.threads = [];
    } finally {
      this.isLoadingThreads = false;
    }
    this.renderList();
    this.updateComposerState();
  }
  async showThreadView(threadId) {
    this.viewMode = "thread";
    this.mainContentEl.empty();
    this.mainContentEl.createDiv({ cls: "mohio-loading", text: "Loading\u2026" });
    try {
      const thread = await this.runtime.getThread({
        threadId,
        workspacePath: this.vaultPath
      });
      this.activeThread = thread;
    } catch (error) {
      new import_obsidian.Notice(`Could not open chat: ${getErrorMessage(error)}`);
      await this.showListView();
      return;
    }
    this.renderThread();
    this.updateComposerState();
  }
  // ── Rendering ────────────────────────────────────────────────────────────────
  renderList() {
    this.mainContentEl.empty();
    if (this.isLoadingThreads) {
      this.mainContentEl.createDiv({ cls: "mohio-loading", text: "Loading chats\u2026" });
      return;
    }
    if (this.threads.length === 0) {
      this.mainContentEl.createDiv({
        cls: "mohio-empty-state",
        text: "No chats yet. Send a message to start."
      });
      return;
    }
    const list = this.mainContentEl.createDiv({ cls: "mohio-thread-list" });
    for (const summary of this.threads) {
      const item = list.createDiv({ cls: "mohio-thread-item" });
      item.createDiv({ cls: "mohio-thread-item-title", text: summary.title });
      item.addEventListener("click", () => {
        void this.showThreadView(summary.id);
      });
    }
  }
  renderMessages(transcriptEl, thread) {
    transcriptEl.empty();
    for (const message of thread.messages) {
      const msgEl = transcriptEl.createDiv({
        cls: `mohio-message mohio-message--${message.role}`
      });
      const contentEl = msgEl.createDiv({ cls: "mohio-message-content" });
      contentEl.setText(message.content);
    }
    if (thread.status === "error" && thread.errorMessage) {
      transcriptEl.createDiv({ cls: "mohio-error-message", text: thread.errorMessage });
    }
    const lastMsg = thread.messages[thread.messages.length - 1];
    const isThinking = thread.status === "running" && (!lastMsg || lastMsg.role === "assistant" && lastMsg.content.trim() === "");
    if (isThinking) {
      transcriptEl.createDiv({ cls: "mohio-thinking", text: "Thinking\u2026" });
    }
  }
  renderThread() {
    const thread = this.activeThread;
    if (!thread || this.viewMode !== "thread")
      return;
    const existingTranscript = this.mainContentEl.querySelector(".mohio-transcript");
    if (existingTranscript) {
      this.renderMessages(existingTranscript, thread);
      existingTranscript.scrollTop = existingTranscript.scrollHeight;
      const titleEl = this.mainContentEl.querySelector(".mohio-thread-title");
      if (titleEl)
        titleEl.textContent = thread.title;
      this.updateComposerState();
      return;
    }
    this.mainContentEl.empty();
    const header = this.mainContentEl.createDiv({ cls: "mohio-thread-header" });
    const backBtn = header.createEl("button", { cls: "mohio-icon-btn" });
    (0, import_obsidian.setIcon)(backBtn, "arrow-left");
    backBtn.setAttribute("aria-label", "Back to chat list");
    backBtn.addEventListener("click", () => {
      void this.showListView();
    });
    header.createDiv({ cls: "mohio-thread-title", text: thread.title });
    const menuBtn = header.createEl("button", { cls: "mohio-icon-btn" });
    (0, import_obsidian.setIcon)(menuBtn, "more-horizontal");
    menuBtn.setAttribute("aria-label", "Chat actions");
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.openThreadMenu(menuBtn, thread);
    });
    const transcriptEl = this.mainContentEl.createDiv({ cls: "mohio-transcript" });
    this.renderMessages(transcriptEl, thread);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
    this.updateComposerState();
  }
  // ── Thread menu ──────────────────────────────────────────────────────────────
  openThreadMenu(anchor, thread) {
    const existing = document.querySelector(".mohio-thread-menu");
    if (existing) {
      existing.remove();
      return;
    }
    const menu = document.createElement("div");
    menu.className = "mohio-thread-menu";
    const addItem = (label, handler) => {
      const item = menu.createDiv({ cls: "mohio-thread-menu-item" });
      item.setText(label);
      item.addEventListener("click", () => {
        menu.remove();
        handler();
      });
    };
    addItem("New Chat", () => {
      void this.startNewChat();
    });
    addItem("Rename Chat", () => {
      void this.renameChat(thread);
    });
    addItem("Delete Chat", () => {
      void this.deleteChat(thread);
    });
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    const dismiss = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("mousedown", dismiss);
      }
    };
    document.addEventListener("mousedown", dismiss);
  }
  // ── Chat actions ─────────────────────────────────────────────────────────────
  async startNewChat(initialContent) {
    const thread = await this.runtime.createThread({ workspacePath: this.vaultPath });
    this.activeThread = thread;
    this.viewMode = "thread";
    this.renderThread();
    this.updateComposerState();
    if (initialContent) {
      await this.dispatchMessage(initialContent, thread.id);
    }
  }
  async renameChat(thread) {
    const modal = new PromptModal(this.app, "Rename chat", thread.title);
    const newTitle = await modal.open();
    if (!newTitle)
      return;
    try {
      await this.runtime.renameThread({
        threadId: thread.id,
        title: newTitle,
        workspacePath: this.vaultPath
      });
    } catch (error) {
      new import_obsidian.Notice(getErrorMessage(error));
    }
  }
  async deleteChat(thread) {
    try {
      await this.runtime.deleteThread({
        threadId: thread.id,
        workspacePath: this.vaultPath
      });
    } catch (error) {
      new import_obsidian.Notice(getErrorMessage(error));
      return;
    }
    await this.showListView();
  }
  // ── Footer ────────────────────────────────────────────────────────────────────
  buildFooter() {
    this.footerEl.empty();
    const quickActions = this.footerEl.createDiv({ cls: "mohio-quick-actions" });
    const summariseBtn = quickActions.createEl("button", {
      cls: "mohio-quick-action-pill",
      text: "Summarise document"
    });
    summariseBtn.addEventListener("click", () => {
      void this.sendQuickAction("Summarise document");
    });
    const improveBtn = quickActions.createEl("button", {
      cls: "mohio-quick-action-pill",
      text: "Improve document"
    });
    improveBtn.addEventListener("click", () => {
      void this.sendQuickAction("Improve document");
    });
    const composerWrapper = this.footerEl.createDiv({ cls: "mohio-composer" });
    this.composerTextarea = composerWrapper.createEl("textarea", {
      cls: "mohio-composer-textarea",
      attr: { rows: "1", placeholder: "Ask Codex\u2026" }
    });
    this.composerTextarea.addEventListener("input", () => {
      this.autoGrowTextarea();
    });
    this.composerTextarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void this.handleSend();
      }
    });
    this.sendBtn = composerWrapper.createEl("button", { cls: "mohio-send-btn" });
    (0, import_obsidian.setIcon)(this.sendBtn, "send");
    this.sendBtn.setAttribute("aria-label", "Send message");
    this.sendBtn.addEventListener("click", () => {
      void this.handleSend();
    });
    this.updateComposerState();
  }
  autoGrowTextarea() {
    const el = this.composerTextarea;
    el.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * 5 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }
  updateComposerState() {
    var _a;
    const activeFile = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const hasDocument = activeFile !== null;
    const isRunning = ((_a = this.activeThread) == null ? void 0 : _a.status) === "running";
    const disabled = !hasDocument || isRunning;
    this.composerTextarea.disabled = disabled;
    this.sendBtn.disabled = disabled;
    this.composerTextarea.placeholder = hasDocument ? "Ask Codex\u2026" : "Open a note to start chatting";
  }
  // ── Sending ──────────────────────────────────────────────────────────────────
  async handleSend() {
    const content = this.composerTextarea.value;
    if (!content.trim())
      return;
    this.composerTextarea.value = "";
    this.autoGrowTextarea();
    if (this.viewMode === "list") {
      await this.startNewChat(content);
      return;
    }
    if (!this.activeThread) {
      await this.startNewChat(content);
      return;
    }
    await this.dispatchMessage(content, this.activeThread.id);
  }
  async sendQuickAction(prompt) {
    if (this.viewMode === "list") {
      await this.startNewChat(prompt);
      return;
    }
    if (!this.activeThread) {
      await this.startNewChat(prompt);
      return;
    }
    await this.dispatchMessage(prompt, this.activeThread.id);
  }
  async dispatchMessage(content, threadId) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!activeView || !activeView.file) {
      new import_obsidian.Notice("Open a note first to provide document context.");
      return;
    }
    const file = activeView.file;
    const documentTitle = file.basename;
    const documentRelativePath = file.path;
    const documentMarkdown = await this.app.vault.cachedRead(file);
    this.updateComposerState();
    try {
      await this.runtime.sendMessage({
        content,
        documentMarkdown,
        documentRelativePath,
        documentTitle,
        threadId,
        workspaceName: this.vaultName,
        workspacePath: this.vaultPath
      });
    } catch (error) {
      new import_obsidian.Notice(getErrorMessage(error));
    }
  }
};
var MohioAIAssistancePlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.runtime = null;
  }
  async onload() {
    const vaultPath = this.getVaultPath();
    const vaultName = this.app.vault.getName();
    this.runtime = createAssistantRuntime();
    const runtime = this.runtime;
    this.registerView(VIEW_TYPE_ASSISTANT, (leaf) => {
      return new AssistantView(leaf, runtime, vaultPath, vaultName);
    });
    this.addRibbonIcon("bot", "Open AI Assistance", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-ai-assistance",
      name: "Open AI assistance panel",
      callback: () => {
        void this.activateView();
      }
    });
  }
  async onunload() {
    var _a;
    (_a = this.runtime) == null ? void 0 : _a.dispose();
    this.runtime = null;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_ASSISTANT);
  }
  async activateView() {
    var _a;
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_ASSISTANT)[0];
    if (!leaf) {
      leaf = (_a = workspace.getRightLeaf(false)) != null ? _a : workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_ASSISTANT, active: true });
    }
    workspace.revealLeaf(leaf);
  }
  getVaultPath() {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof import_obsidian.FileSystemAdapter) {
      return adapter.getBasePath();
    }
    return this.app.vault.getName();
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBGaWxlU3lzdGVtQWRhcHRlcixcbiAgSXRlbVZpZXcsXG4gIE1hcmtkb3duVmlldyxcbiAgTW9kYWwsXG4gIE5vdGljZSxcbiAgUGx1Z2luLFxuICBXb3Jrc3BhY2VMZWFmLFxuICBzZXRJY29uLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHNwYXduLCB0eXBlIENoaWxkUHJvY2Vzc1dpdGhvdXROdWxsU3RyZWFtcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBjcmVhdGVJbnRlcmZhY2UgfSBmcm9tIFwicmVhZGxpbmVcIjtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvbnN0YW50cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgVklFV19UWVBFX0FTU0lTVEFOVCA9IFwibW9oaW8tYWktYXNzaXN0YW5jZVwiO1xuXG5jb25zdCBERUZBVUxUX0FTU0lTVEFOVF9JTlNUUlVDVElPTlMgPSBbXG4gIFwiWW91IGFyZSBDb2RleCBlbWJlZGRlZCBpbnNpZGUgTW9oaW8sIGEgbG9jYWwtZmlyc3QgTWFya2Rvd24gd29ya3NwYWNlIGZvciBzbWFsbCB0ZWFtcy5cIixcbiAgXCJXb3JrIGFzIGEgY2hhdC1maXJzdCBhc3Npc3RhbnQgZm9yIGEgTWFya2Rvd24ga25vd2xlZGdlYmFzZS5cIixcbiAgXCJUcmVhdCB0aGUgYWN0aXZlIGRvY3VtZW50IGFzIHRoZSBwcmltYXJ5IGNvbnRleHQgYW5kIHRoZSB3aWRlciB3b3Jrc3BhY2UgYXMgc3VwcG9ydGluZyBjb250ZXh0LlwiLFxuICBcIllvdSBtYXkgaW5zcGVjdCB0aGUgcmVzdCBvZiB0aGUgd29ya3NwYWNlIHdoZW4gdXNlZnVsLlwiLFxuICBcIkRvIG5vdCBtYWtlIGZpbGUgZWRpdHMsIHByb3Bvc2UgcGF0Y2hlcywgb3IgY2xhaW0gdG8gaGF2ZSBjaGFuZ2VkIGZpbGVzIGluIHRoaXMgZW52aXJvbm1lbnQuXCIsXG4gIFwiUmV0dXJuIGNvbmNpc2UsIHByYWN0aWNhbCBhbnN3ZXJzIHRoYXQgZml0IGEgZG9jdW1lbnQtZmlyc3Qgd29ya2Zsb3cuXCIsXG5dLmpvaW4oXCJcXG5cIik7XG5cbmNvbnN0IE1PSElPX1BST01QVF9PUEVOID0gXCJbTU9ISU9fVVNFUl9SRVFVRVNUXVwiO1xuY29uc3QgTU9ISU9fUFJPTVBUX0NMT1NFID0gXCJbL01PSElPX1VTRVJfUkVRVUVTVF1cIjtcbmNvbnN0IFRVUk5fU1RBUlRfTUFYX1JPTExPVVRfUkVUUklFUyA9IDM7XG5jb25zdCBUVVJOX1NUQVJUX1JPTExPVVRfUkVUUllfREVMQVlfTVMgPSAxMjA7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBUeXBlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxudHlwZSBBc3Npc3RhbnRSdW5TdGF0dXMgPSBcImlkbGVcIiB8IFwicnVubmluZ1wiIHwgXCJlcnJvclwiO1xuXG5pbnRlcmZhY2UgQXNzaXN0YW50TWVzc2FnZSB7XG4gIGlkOiBzdHJpbmc7XG4gIHJvbGU6IFwidXNlclwiIHwgXCJhc3Npc3RhbnRcIjtcbiAgY29udGVudDogc3RyaW5nO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEFzc2lzdGFudFRocmVhZCB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgbWVzc2FnZXM6IEFzc2lzdGFudE1lc3NhZ2VbXTtcbiAgc3RhdHVzOiBBc3Npc3RhbnRSdW5TdGF0dXM7XG4gIHdvcmtzcGFjZVBhdGg6IHN0cmluZztcbiAgZXJyb3JNZXNzYWdlOiBzdHJpbmcgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgQXNzaXN0YW50VGhyZWFkU3VtbWFyeSB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgc3RhdHVzOiBBc3Npc3RhbnRSdW5TdGF0dXM7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICB1cGRhdGVkQXQ6IHN0cmluZztcbn1cblxudHlwZSBBc3Npc3RhbnRFdmVudCA9XG4gIHwgeyB0eXBlOiBcInRocmVhZFwiOyB3b3Jrc3BhY2VQYXRoOiBzdHJpbmc7IHRocmVhZDogQXNzaXN0YW50VGhyZWFkIH1cbiAgfCB7IHR5cGU6IFwidGhyZWFkLWxpc3RcIjsgd29ya3NwYWNlUGF0aDogc3RyaW5nOyB0aHJlYWRzOiBBc3Npc3RhbnRUaHJlYWRTdW1tYXJ5W10gfTtcblxuaW50ZXJmYWNlIFNlbmRBc3Npc3RhbnRNZXNzYWdlSW5wdXQge1xuICB0aHJlYWRJZDogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIGRvY3VtZW50VGl0bGU6IHN0cmluZztcbiAgZG9jdW1lbnRSZWxhdGl2ZVBhdGg6IHN0cmluZztcbiAgZG9jdW1lbnRNYXJrZG93bjogc3RyaW5nO1xuICB3b3Jrc3BhY2VOYW1lOiBzdHJpbmc7XG4gIHdvcmtzcGFjZVBhdGg6IHN0cmluZztcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENvZGV4IGludGVybmFsIHR5cGVzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5pbnRlcmZhY2UgSnNvblJwY1JlcXVlc3Qge1xuICBpZDogbnVtYmVyO1xuICBtZXRob2Q6IHN0cmluZztcbiAgcGFyYW1zPzogdW5rbm93bjtcbn1cblxuaW50ZXJmYWNlIEpzb25ScGNSZXNwb25zZSB7XG4gIGlkPzogbnVtYmVyO1xuICByZXN1bHQ/OiB1bmtub3duO1xuICBlcnJvcj86IHsgY29kZT86IG51bWJlcjsgbWVzc2FnZT86IHN0cmluZyB9O1xuICBtZXRob2Q/OiBzdHJpbmc7XG4gIHBhcmFtcz86IHVua25vd247XG59XG5cbmludGVyZmFjZSBDb2RleFRocmVhZCB7XG4gIGlkOiBzdHJpbmc7XG4gIHByZXZpZXc6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nIHwgbnVsbDtcbiAgY3dkOiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogbnVtYmVyO1xuICB1cGRhdGVkQXQ6IG51bWJlcjtcbiAgc3RhdHVzOiB1bmtub3duO1xuICB0dXJuczogQ29kZXhUdXJuW107XG59XG5cbmludGVyZmFjZSBDb2RleFR1cm4ge1xuICBpZDogc3RyaW5nO1xuICBpdGVtczogQ29kZXhUaHJlYWRJdGVtW107XG59XG5cbnR5cGUgQ29kZXhUaHJlYWRJdGVtID1cbiAgfCBDb2RleEFnZW50TWVzc2FnZUl0ZW1cbiAgfCBDb2RleFVzZXJNZXNzYWdlSXRlbVxuICB8IHsgdHlwZTogc3RyaW5nOyBpZDogc3RyaW5nIH07XG5cbmludGVyZmFjZSBDb2RleEFnZW50TWVzc2FnZUl0ZW0ge1xuICB0eXBlOiBcImFnZW50TWVzc2FnZVwiO1xuICBpZDogc3RyaW5nO1xuICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDb2RleFVzZXJNZXNzYWdlSXRlbSB7XG4gIHR5cGU6IFwidXNlck1lc3NhZ2VcIjtcbiAgaWQ6IHN0cmluZztcbiAgY29udGVudDogQ29kZXhVc2VySW5wdXRbXTtcbn1cblxudHlwZSBDb2RleFVzZXJJbnB1dCA9IHsgdHlwZTogXCJ0ZXh0XCI7IHRleHQ6IHN0cmluZyB9IHwgeyB0eXBlOiBzdHJpbmcgfTtcblxuaW50ZXJmYWNlIEFzc2lzdGFudFNlcnZlckNvbm5lY3Rpb24ge1xuICByZXF1ZXN0OiA8VD4obWV0aG9kOiBzdHJpbmcsIHBhcmFtcz86IHVua25vd24pID0+IFByb21pc2U8VD47XG59XG5cbmludGVyZmFjZSBBc3Npc3RhbnRUaHJlYWRTdGF0ZSB7XG4gIGFzc2lzdGFudE1lc3NhZ2VJZDogc3RyaW5nIHwgbnVsbDtcbiAgaXNUdXJuUmVhZHk6IGJvb2xlYW47XG4gIHRocmVhZDogQXNzaXN0YW50VGhyZWFkO1xuICB0dXJuSWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBBc3Npc3RhbnRSdW50aW1lIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5pbnRlcmZhY2UgQXNzaXN0YW50UnVudGltZSB7XG4gIGNhbmNlbFJ1bjogKGlucHV0OiB7IHRocmVhZElkOiBzdHJpbmc7IHdvcmtzcGFjZVBhdGg6IHN0cmluZyB9KSA9PiBQcm9taXNlPHZvaWQ+O1xuICBjcmVhdGVUaHJlYWQ6IChpbnB1dDogeyB3b3Jrc3BhY2VQYXRoOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTxBc3Npc3RhbnRUaHJlYWQ+O1xuICBkZWxldGVUaHJlYWQ6IChpbnB1dDogeyB0aHJlYWRJZDogc3RyaW5nOyB3b3Jrc3BhY2VQYXRoOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0VGhyZWFkOiAoaW5wdXQ6IHsgdGhyZWFkSWQ6IHN0cmluZzsgd29ya3NwYWNlUGF0aDogc3RyaW5nIH0pID0+IFByb21pc2U8QXNzaXN0YW50VGhyZWFkPjtcbiAgbGlzdFRocmVhZHM6IChpbnB1dDogeyB3b3Jrc3BhY2VQYXRoOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTxBc3Npc3RhbnRUaHJlYWRTdW1tYXJ5W10+O1xuICBvbkV2ZW50OiAobGlzdGVuZXI6IChldmVudDogQXNzaXN0YW50RXZlbnQpID0+IHZvaWQpID0+ICgpID0+IHZvaWQ7XG4gIHJlbmFtZVRocmVhZDogKGlucHV0OiB7IHRocmVhZElkOiBzdHJpbmc7IHRpdGxlOiBzdHJpbmc7IHdvcmtzcGFjZVBhdGg6IHN0cmluZyB9KSA9PiBQcm9taXNlPHZvaWQ+O1xuICBzZW5kTWVzc2FnZTogKGlucHV0OiBTZW5kQXNzaXN0YW50TWVzc2FnZUlucHV0KSA9PiBQcm9taXNlPEFzc2lzdGFudFRocmVhZD47XG4gIGRpc3Bvc2U6ICgpID0+IHZvaWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFzc2lzdGFudFJ1bnRpbWUoKTogQXNzaXN0YW50UnVudGltZSB7XG4gIGNvbnN0IGNyZWF0ZUlkID0gKCkgPT4gYCR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcbiAgY29uc3Qgbm93ID0gKCkgPT4gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBsaXN0ZW5lcnMgPSBuZXcgU2V0PChldmVudDogQXNzaXN0YW50RXZlbnQpID0+IHZvaWQ+KCk7XG4gIGNvbnN0IHRocmVhZFN0YXRlcyA9IG5ldyBNYXA8c3RyaW5nLCBBc3Npc3RhbnRUaHJlYWRTdGF0ZT4oKTtcbiAgbGV0IGNvbm5lY3Rpb25Qcm9taXNlOiBQcm9taXNlPEFzc2lzdGFudFNlcnZlckNvbm5lY3Rpb24+IHwgbnVsbCA9IG51bGw7XG4gIGxldCBjaGlsZFByb2Nlc3M6IENoaWxkUHJvY2Vzc1dpdGhvdXROdWxsU3RyZWFtcyB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IGVtaXQgPSAoZXZlbnQ6IEFzc2lzdGFudEV2ZW50KSA9PiB7XG4gICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgIGxpc3RlbmVyKGV2ZW50KTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgZW1pdFRocmVhZCA9ICh0aHJlYWRJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdGhyZWFkU3RhdGUgPSB0aHJlYWRTdGF0ZXMuZ2V0KHRocmVhZElkKTtcbiAgICBpZiAoIXRocmVhZFN0YXRlKSByZXR1cm47XG4gICAgZW1pdCh7XG4gICAgICB0eXBlOiBcInRocmVhZFwiLFxuICAgICAgd29ya3NwYWNlUGF0aDogdGhyZWFkU3RhdGUudGhyZWFkLndvcmtzcGFjZVBhdGgsXG4gICAgICB0aHJlYWQ6IGNsb25lVGhyZWFkKHRocmVhZFN0YXRlLnRocmVhZCksXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgZW1pdFRocmVhZExpc3QgPSBhc3luYyAod29ya3NwYWNlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRocmVhZHMgPSBhd2FpdCBsaXN0VGhyZWFkcyh7IHdvcmtzcGFjZVBhdGggfSk7XG4gICAgICBlbWl0KHsgdHlwZTogXCJ0aHJlYWQtbGlzdFwiLCB3b3Jrc3BhY2VQYXRoLCB0aHJlYWRzIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gS2VlcCBsaXN0IHJlZnJlc2ggZmFpbHVyZXMgbG9jYWwgdG8gZXhwbGljaXQgQVBJIGNhbGxzLlxuICAgIH1cbiAgfTtcblxuICBjb25zdCBnZXRDb25uZWN0aW9uID0gKCkgPT4ge1xuICAgIGlmICghY29ubmVjdGlvblByb21pc2UpIHtcbiAgICAgIGNvbm5lY3Rpb25Qcm9taXNlID0gY3JlYXRlU2VydmVyQ29ubmVjdGlvbih7XG4gICAgICAgIG9uQ2hpbGRQcm9jZXNzOiAoY2hpbGQpID0+IHsgY2hpbGRQcm9jZXNzID0gY2hpbGQ7IH0sXG4gICAgICAgIG9uRXhpdDogKGVycm9yTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgW3RocmVhZElkLCB0aHJlYWRTdGF0ZV0gb2YgdGhyZWFkU3RhdGVzLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRocmVhZFN0YXRlLnRocmVhZC5zdGF0dXMgIT09IFwicnVubmluZ1wiKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRocmVhZFN0YXRlLnR1cm5JZCA9IG51bGw7XG4gICAgICAgICAgICB0aHJlYWRTdGF0ZS5hc3Npc3RhbnRNZXNzYWdlSWQgPSBudWxsO1xuICAgICAgICAgICAgdGhyZWFkU3RhdGUudGhyZWFkLnN0YXR1cyA9IFwiZXJyb3JcIjtcbiAgICAgICAgICAgIHRocmVhZFN0YXRlLnRocmVhZC5lcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2U7XG4gICAgICAgICAgICBlbWl0VGhyZWFkKHRocmVhZElkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29ubmVjdGlvblByb21pc2UgPSBudWxsO1xuICAgICAgICAgIGNoaWxkUHJvY2VzcyA9IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9uTm90aWZpY2F0aW9uOiAobm90aWZpY2F0aW9uKSA9PiB7XG4gICAgICAgICAgaGFuZGxlU2VydmVyTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAgIGNyZWF0ZUlkLFxuICAgICAgICAgICAgZW1pdFRocmVhZCxcbiAgICAgICAgICAgIGVtaXRUaHJlYWRMaXN0LFxuICAgICAgICAgICAgbm93LFxuICAgICAgICAgICAgbm90aWZpY2F0aW9uLFxuICAgICAgICAgICAgdGhyZWFkU3RhdGVzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjb25uZWN0aW9uUHJvbWlzZTtcbiAgfTtcblxuICBjb25zdCBjYWNoZVRocmVhZCA9IChcbiAgICB0aHJlYWQ6IEFzc2lzdGFudFRocmVhZCxcbiAgICBvcHRpb25zOiB7IGlzVHVyblJlYWR5PzogYm9vbGVhbiB9ID0ge30sXG4gICkgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nU3RhdGUgPSB0aHJlYWRTdGF0ZXMuZ2V0KHRocmVhZC5pZCk7XG4gICAgdGhyZWFkU3RhdGVzLnNldCh0aHJlYWQuaWQsIHtcbiAgICAgIGFzc2lzdGFudE1lc3NhZ2VJZDogZXhpc3RpbmdTdGF0ZT8uYXNzaXN0YW50TWVzc2FnZUlkID8/IG51bGwsXG4gICAgICBpc1R1cm5SZWFkeTogb3B0aW9ucy5pc1R1cm5SZWFkeSA/PyBleGlzdGluZ1N0YXRlPy5pc1R1cm5SZWFkeSA/PyBmYWxzZSxcbiAgICAgIHRocmVhZCxcbiAgICAgIHR1cm5JZDogZXhpc3RpbmdTdGF0ZT8udHVybklkID8/IG51bGwsXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgZW5zdXJlTG9hZGVkVGhyZWFkID0gYXN5bmMgKHtcbiAgICB0aHJlYWRJZCxcbiAgICB3b3Jrc3BhY2VQYXRoLFxuICB9OiB7XG4gICAgdGhyZWFkSWQ6IHN0cmluZztcbiAgICB3b3Jrc3BhY2VQYXRoOiBzdHJpbmc7XG4gIH0pID0+IHtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgZ2V0Q29ubmVjdGlvbigpO1xuICAgIGNvbnN0IHRocmVhZFN0YXRlID0gdGhyZWFkU3RhdGVzLmdldCh0aHJlYWRJZCk7XG5cbiAgICBpZiAodGhyZWFkU3RhdGU/LnRocmVhZC53b3Jrc3BhY2VQYXRoID09PSB3b3Jrc3BhY2VQYXRoICYmIHRocmVhZFN0YXRlLmlzVHVyblJlYWR5KSB7XG4gICAgICByZXR1cm4gdGhyZWFkU3RhdGUudGhyZWFkO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29ubmVjdGlvbi5yZXF1ZXN0PHsgdGhyZWFkOiBDb2RleFRocmVhZCB9PihcInRocmVhZC9yZXN1bWVcIiwge1xuICAgICAgYXBwcm92YWxQb2xpY3k6IFwibmV2ZXJcIixcbiAgICAgIGN3ZDogd29ya3NwYWNlUGF0aCxcbiAgICAgIGRldmVsb3Blckluc3RydWN0aW9uczogREVGQVVMVF9BU1NJU1RBTlRfSU5TVFJVQ1RJT05TLFxuICAgICAgcGVyc2lzdEV4dGVuZGVkSGlzdG9yeTogdHJ1ZSxcbiAgICAgIHNhbmRib3g6IFwicmVhZC1vbmx5XCIsXG4gICAgICB0aHJlYWRJZCxcbiAgICB9KTtcbiAgICBjb25zdCBhc3Npc3RhbnRUaHJlYWQgPSBtYXBDb2RleFRocmVhZFRvQXNzaXN0YW50VGhyZWFkKHtcbiAgICAgIHRocmVhZDogcmVzcG9uc2UudGhyZWFkLFxuICAgICAgd29ya3NwYWNlUGF0aCxcbiAgICB9KTtcbiAgICBjYWNoZVRocmVhZChhc3Npc3RhbnRUaHJlYWQsIHsgaXNUdXJuUmVhZHk6IHRydWUgfSk7XG4gICAgcmV0dXJuIGFzc2lzdGFudFRocmVhZDtcbiAgfTtcblxuICBjb25zdCBsaXN0VGhyZWFkcyA9IGFzeW5jICh7XG4gICAgd29ya3NwYWNlUGF0aCxcbiAgfToge1xuICAgIHdvcmtzcGFjZVBhdGg6IHN0cmluZztcbiAgfSk6IFByb21pc2U8QXNzaXN0YW50VGhyZWFkU3VtbWFyeVtdPiA9PiB7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IGdldENvbm5lY3Rpb24oKTtcbiAgICBsZXQgbmV4dEN1cnNvcjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3QgdGhyZWFkczogQXNzaXN0YW50VGhyZWFkU3VtbWFyeVtdID0gW107XG5cbiAgICBkbyB7XG4gICAgICBjb25zdCByZXNwb25zZTogeyBkYXRhOiBDb2RleFRocmVhZFtdOyBuZXh0Q3Vyc29yOiBzdHJpbmcgfCBudWxsIH0gPVxuICAgICAgICBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3QoXCJ0aHJlYWQvbGlzdFwiLCB7XG4gICAgICAgICAgYXJjaGl2ZWQ6IGZhbHNlLFxuICAgICAgICAgIGN1cnNvcjogbmV4dEN1cnNvcixcbiAgICAgICAgICBjd2Q6IHdvcmtzcGFjZVBhdGgsXG4gICAgICAgICAgc29ydEtleTogXCJ1cGRhdGVkX2F0XCIsXG4gICAgICAgIH0pO1xuICAgICAgZm9yIChjb25zdCB0aHJlYWQgb2YgcmVzcG9uc2UuZGF0YSkge1xuICAgICAgICB0aHJlYWRzLnB1c2gobWFwQ29kZXhUaHJlYWRUb1N1bW1hcnkodGhyZWFkKSk7XG4gICAgICB9XG4gICAgICBuZXh0Q3Vyc29yID0gcmVzcG9uc2UubmV4dEN1cnNvcjtcbiAgICB9IHdoaWxlIChuZXh0Q3Vyc29yKTtcblxuICAgIHJldHVybiB0aHJlYWRzLnNvcnQoKGEsIGIpID0+IGIudXBkYXRlZEF0LmxvY2FsZUNvbXBhcmUoYS51cGRhdGVkQXQpKTtcbiAgfTtcblxuICBjb25zdCBjcmVhdGVUaHJlYWQgPSBhc3luYyAoe1xuICAgIHdvcmtzcGFjZVBhdGgsXG4gIH06IHtcbiAgICB3b3Jrc3BhY2VQYXRoOiBzdHJpbmc7XG4gIH0pOiBQcm9taXNlPEFzc2lzdGFudFRocmVhZD4gPT4ge1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRDb25uZWN0aW9uKCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3Q8eyB0aHJlYWQ6IENvZGV4VGhyZWFkIH0+KFwidGhyZWFkL3N0YXJ0XCIsIHtcbiAgICAgIGFwcHJvdmFsUG9saWN5OiBcIm5ldmVyXCIsXG4gICAgICBjd2Q6IHdvcmtzcGFjZVBhdGgsXG4gICAgICBkZXZlbG9wZXJJbnN0cnVjdGlvbnM6IERFRkFVTFRfQVNTSVNUQU5UX0lOU1RSVUNUSU9OUyxcbiAgICAgIGVwaGVtZXJhbDogZmFsc2UsXG4gICAgICBleHBlcmltZW50YWxSYXdFdmVudHM6IGZhbHNlLFxuICAgICAgcGVyc2lzdEV4dGVuZGVkSGlzdG9yeTogdHJ1ZSxcbiAgICAgIHNhbmRib3g6IFwicmVhZC1vbmx5XCIsXG4gICAgfSk7XG4gICAgY29uc3QgYXNzaXN0YW50VGhyZWFkID0gbWFwQ29kZXhUaHJlYWRUb0Fzc2lzdGFudFRocmVhZCh7XG4gICAgICB0aHJlYWQ6IHJlc3BvbnNlLnRocmVhZCxcbiAgICAgIHdvcmtzcGFjZVBhdGgsXG4gICAgfSk7XG4gICAgY2FjaGVUaHJlYWQoYXNzaXN0YW50VGhyZWFkLCB7IGlzVHVyblJlYWR5OiB0cnVlIH0pO1xuICAgIHZvaWQgZW1pdFRocmVhZExpc3Qod29ya3NwYWNlUGF0aCk7XG4gICAgZW1pdFRocmVhZChhc3Npc3RhbnRUaHJlYWQuaWQpO1xuICAgIHJldHVybiBjbG9uZVRocmVhZChhc3Npc3RhbnRUaHJlYWQpO1xuICB9O1xuXG4gIGNvbnN0IGdldFRocmVhZCA9IGFzeW5jICh7XG4gICAgdGhyZWFkSWQsXG4gICAgd29ya3NwYWNlUGF0aCxcbiAgfToge1xuICAgIHRocmVhZElkOiBzdHJpbmc7XG4gICAgd29ya3NwYWNlUGF0aDogc3RyaW5nO1xuICB9KTogUHJvbWlzZTxBc3Npc3RhbnRUaHJlYWQ+ID0+IHtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgZ2V0Q29ubmVjdGlvbigpO1xuICAgIGxldCByZXNwb25zZTogeyB0aHJlYWQ6IENvZGV4VGhyZWFkIH07XG5cbiAgICB0cnkge1xuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3Q8eyB0aHJlYWQ6IENvZGV4VGhyZWFkIH0+KFwidGhyZWFkL3JlYWRcIiwge1xuICAgICAgICBpbmNsdWRlVHVybnM6IHRydWUsXG4gICAgICAgIHRocmVhZElkLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmICghaXNVbm1hdGVyaWFsaXplZFRocmVhZFJlYWRFcnJvcihlcnJvcikpIHRocm93IGVycm9yO1xuICAgICAgcmVzcG9uc2UgPSBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3Q8eyB0aHJlYWQ6IENvZGV4VGhyZWFkIH0+KFwidGhyZWFkL3JlYWRcIiwge1xuICAgICAgICBpbmNsdWRlVHVybnM6IGZhbHNlLFxuICAgICAgICB0aHJlYWRJZCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFzc2lzdGFudFRocmVhZCA9IG1hcENvZGV4VGhyZWFkVG9Bc3Npc3RhbnRUaHJlYWQoe1xuICAgICAgdGhyZWFkOiByZXNwb25zZS50aHJlYWQsXG4gICAgICB3b3Jrc3BhY2VQYXRoLFxuICAgIH0pO1xuICAgIGNhY2hlVGhyZWFkKGFzc2lzdGFudFRocmVhZCwgeyBpc1R1cm5SZWFkeTogZmFsc2UgfSk7XG4gICAgcmV0dXJuIGNsb25lVGhyZWFkKGFzc2lzdGFudFRocmVhZCk7XG4gIH07XG5cbiAgY29uc3Qgc2VuZE1lc3NhZ2UgPSBhc3luYyAoe1xuICAgIGNvbnRlbnQsXG4gICAgZG9jdW1lbnRNYXJrZG93bixcbiAgICBkb2N1bWVudFRpdGxlLFxuICAgIGRvY3VtZW50UmVsYXRpdmVQYXRoLFxuICAgIHRocmVhZElkLFxuICAgIHdvcmtzcGFjZU5hbWUsXG4gICAgd29ya3NwYWNlUGF0aCxcbiAgfTogU2VuZEFzc2lzdGFudE1lc3NhZ2VJbnB1dCk6IFByb21pc2U8QXNzaXN0YW50VGhyZWFkPiA9PiB7XG4gICAgY29uc3QgdHJpbW1lZENvbnRlbnQgPSBjb250ZW50LnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWRDb250ZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbnRlciBhIG1lc3NhZ2UgYmVmb3JlIGFza2luZyBDb2RleCBmb3IgaGVscC5cIik7XG4gICAgfVxuXG4gICAgYXdhaXQgZW5zdXJlTG9hZGVkVGhyZWFkKHsgdGhyZWFkSWQsIHdvcmtzcGFjZVBhdGggfSk7XG5cbiAgICBjb25zdCB0aHJlYWRTdGF0ZSA9IHRocmVhZFN0YXRlcy5nZXQodGhyZWFkSWQpO1xuICAgIGlmICghdGhyZWFkU3RhdGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1vaGlvIGNvdWxkIG5vdCBsb2FkIHRoZSBzZWxlY3RlZCBDb2RleCBjb252ZXJzYXRpb24uXCIpO1xuICAgIH1cbiAgICBpZiAodGhyZWFkU3RhdGUudHVybklkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXYWl0IGZvciB0aGUgY3VycmVudCBDb2RleCBydW4gdG8gZmluaXNoLlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VyTWVzc2FnZTogQXNzaXN0YW50TWVzc2FnZSA9IHtcbiAgICAgIGlkOiBjcmVhdGVJZCgpLFxuICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICBjb250ZW50OiB0cmltbWVkQ29udGVudCxcbiAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgfTtcbiAgICBjb25zdCBhc3Npc3RhbnRNZXNzYWdlOiBBc3Npc3RhbnRNZXNzYWdlID0ge1xuICAgICAgaWQ6IGNyZWF0ZUlkKCksXG4gICAgICByb2xlOiBcImFzc2lzdGFudFwiLFxuICAgICAgY29udGVudDogXCJcIixcbiAgICAgIGNyZWF0ZWRBdDogbm93KCksXG4gICAgfTtcblxuICAgIHRocmVhZFN0YXRlLmFzc2lzdGFudE1lc3NhZ2VJZCA9IGFzc2lzdGFudE1lc3NhZ2UuaWQ7XG4gICAgdGhyZWFkU3RhdGUudGhyZWFkLmVycm9yTWVzc2FnZSA9IG51bGw7XG4gICAgdGhyZWFkU3RhdGUudGhyZWFkLm1lc3NhZ2VzID0gWy4uLnRocmVhZFN0YXRlLnRocmVhZC5tZXNzYWdlcywgdXNlck1lc3NhZ2UsIGFzc2lzdGFudE1lc3NhZ2VdO1xuICAgIHRocmVhZFN0YXRlLnRocmVhZC5wcmV2aWV3ID0gdGhyZWFkU3RhdGUudGhyZWFkLnByZXZpZXcgfHwgdHJpbW1lZENvbnRlbnQ7XG4gICAgdGhyZWFkU3RhdGUudGhyZWFkLnN0YXR1cyA9IFwicnVubmluZ1wiO1xuICAgIGVtaXRUaHJlYWQodGhyZWFkSWQpO1xuICAgIHZvaWQgZW1pdFRocmVhZExpc3Qod29ya3NwYWNlUGF0aCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IGdldENvbm5lY3Rpb24oKTtcbiAgICAgIGNvbnN0IHR1cm5TdGFydFBhcmFtcyA9IHtcbiAgICAgICAgY3dkOiB3b3Jrc3BhY2VQYXRoLFxuICAgICAgICBpbnB1dDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IGJ1aWxkQXNzaXN0YW50UHJvbXB0KHtcbiAgICAgICAgICAgICAgZG9jdW1lbnRNYXJrZG93bixcbiAgICAgICAgICAgICAgZG9jdW1lbnRUaXRsZSxcbiAgICAgICAgICAgICAgZG9jdW1lbnRSZWxhdGl2ZVBhdGgsXG4gICAgICAgICAgICAgIHVzZXJSZXF1ZXN0OiB0cmltbWVkQ29udGVudCxcbiAgICAgICAgICAgICAgd29ya3NwYWNlTmFtZSxcbiAgICAgICAgICAgICAgd29ya3NwYWNlUGF0aCxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGV4dF9lbGVtZW50czogW10sXG4gICAgICAgICAgICB0eXBlOiBcInRleHRcIiBhcyBjb25zdCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0aHJlYWRJZCxcbiAgICAgIH07XG5cbiAgICAgIGxldCByZXNwb25zZTogeyB0dXJuOiB7IGlkOiBzdHJpbmcgfSB9IHwgbnVsbCA9IG51bGw7XG4gICAgICBsZXQgcm9sbG91dFJldHJ5Q291bnQgPSAwO1xuXG4gICAgICB3aGlsZSAoIXJlc3BvbnNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3Q8eyB0dXJuOiB7IGlkOiBzdHJpbmcgfSB9PihcbiAgICAgICAgICAgIFwidHVybi9zdGFydFwiLFxuICAgICAgICAgICAgdHVyblN0YXJ0UGFyYW1zLFxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWlzTm9Sb2xsb3V0Rm91bmRFcnJvcihlcnJvcikgfHxcbiAgICAgICAgICAgIHJvbGxvdXRSZXRyeUNvdW50ID49IFRVUk5fU1RBUlRfTUFYX1JPTExPVVRfUkVUUklFU1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJvbGxvdXRSZXRyeUNvdW50ICs9IDE7XG4gICAgICAgICAgYXdhaXQgcmVzdW1lVGhyZWFkKHsgY29ubmVjdGlvbiwgdGhyZWFkSWQsIHRocmVhZFN0YXRlLCB3b3Jrc3BhY2VQYXRoIH0pO1xuICAgICAgICAgIGF3YWl0IHdhaXQoVFVSTl9TVEFSVF9ST0xMT1VUX1JFVFJZX0RFTEFZX01TKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aHJlYWRTdGF0ZS50dXJuSWQgPSByZXNwb25zZS50dXJuLmlkO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJlYWRTdGF0ZS5hc3Npc3RhbnRNZXNzYWdlSWQgPSBudWxsO1xuICAgICAgdGhyZWFkU3RhdGUudGhyZWFkLmVycm9yTWVzc2FnZSA9IGdldEVycm9yTWVzc2FnZShlcnJvcik7XG4gICAgICB0aHJlYWRTdGF0ZS50aHJlYWQuc3RhdHVzID0gXCJlcnJvclwiO1xuICAgICAgZW1pdFRocmVhZCh0aHJlYWRJZCk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVUaHJlYWQodGhyZWFkU3RhdGUudGhyZWFkKTtcbiAgfTtcblxuICBjb25zdCBjYW5jZWxSdW4gPSBhc3luYyAoe1xuICAgIHRocmVhZElkLFxuICB9OiB7XG4gICAgdGhyZWFkSWQ6IHN0cmluZztcbiAgICB3b3Jrc3BhY2VQYXRoOiBzdHJpbmc7XG4gIH0pID0+IHtcbiAgICBjb25zdCB0aHJlYWRTdGF0ZSA9IHRocmVhZFN0YXRlcy5nZXQodGhyZWFkSWQpO1xuICAgIGlmICghdGhyZWFkU3RhdGU/LnR1cm5JZCkgcmV0dXJuO1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRDb25uZWN0aW9uKCk7XG4gICAgY29uc3QgdHVybklkID0gdGhyZWFkU3RhdGUudHVybklkO1xuICAgIHRocmVhZFN0YXRlLnR1cm5JZCA9IG51bGw7XG4gICAgdGhyZWFkU3RhdGUuYXNzaXN0YW50TWVzc2FnZUlkID0gbnVsbDtcbiAgICB0aHJlYWRTdGF0ZS50aHJlYWQuZXJyb3JNZXNzYWdlID0gbnVsbDtcbiAgICB0aHJlYWRTdGF0ZS50aHJlYWQuc3RhdHVzID0gXCJpZGxlXCI7XG4gICAgZW1pdFRocmVhZCh0aHJlYWRJZCk7XG4gICAgdm9pZCBlbWl0VGhyZWFkTGlzdCh0aHJlYWRTdGF0ZS50aHJlYWQud29ya3NwYWNlUGF0aCk7XG4gICAgYXdhaXQgY29ubmVjdGlvbi5yZXF1ZXN0PFJlY29yZDxzdHJpbmcsIG5ldmVyPj4oXCJ0dXJuL2ludGVycnVwdFwiLCB7XG4gICAgICB0aHJlYWRJZCxcbiAgICAgIHR1cm5JZCxcbiAgICB9KTtcbiAgfTtcblxuICBjb25zdCByZW5hbWVUaHJlYWQgPSBhc3luYyAoe1xuICAgIHRocmVhZElkLFxuICAgIHRpdGxlLFxuICAgIHdvcmtzcGFjZVBhdGgsXG4gIH06IHtcbiAgICB0aHJlYWRJZDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgd29ya3NwYWNlUGF0aDogc3RyaW5nO1xuICB9KSA9PiB7XG4gICAgY29uc3QgbmV4dFRpdGxlID0gdGl0bGUudHJpbSgpO1xuICAgIGlmICghbmV4dFRpdGxlKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnRlciBhIHRpdGxlIGJlZm9yZSByZW5hbWluZyB0aGlzIGNoYXQuXCIpO1xuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRDb25uZWN0aW9uKCk7XG4gICAgYXdhaXQgY29ubmVjdGlvbi5yZXF1ZXN0PFJlY29yZDxzdHJpbmcsIG5ldmVyPj4oXCJ0aHJlYWQvbmFtZS9zZXRcIiwge1xuICAgICAgbmFtZTogbmV4dFRpdGxlLFxuICAgICAgdGhyZWFkSWQsXG4gICAgfSk7XG4gICAgY29uc3QgdGhyZWFkU3RhdGUgPSB0aHJlYWRTdGF0ZXMuZ2V0KHRocmVhZElkKTtcbiAgICBpZiAodGhyZWFkU3RhdGUpIHtcbiAgICAgIHRocmVhZFN0YXRlLnRocmVhZC50aXRsZSA9IG5leHRUaXRsZTtcbiAgICAgIGVtaXRUaHJlYWQodGhyZWFkSWQpO1xuICAgIH1cbiAgICB2b2lkIGVtaXRUaHJlYWRMaXN0KHdvcmtzcGFjZVBhdGgpO1xuICB9O1xuXG4gIGNvbnN0IGRlbGV0ZVRocmVhZCA9IGFzeW5jICh7XG4gICAgdGhyZWFkSWQsXG4gICAgd29ya3NwYWNlUGF0aCxcbiAgfToge1xuICAgIHRocmVhZElkOiBzdHJpbmc7XG4gICAgd29ya3NwYWNlUGF0aDogc3RyaW5nO1xuICB9KSA9PiB7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IGdldENvbm5lY3Rpb24oKTtcbiAgICBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3Q8UmVjb3JkPHN0cmluZywgbmV2ZXI+PihcInRocmVhZC9hcmNoaXZlXCIsIHsgdGhyZWFkSWQgfSk7XG4gICAgdGhyZWFkU3RhdGVzLmRlbGV0ZSh0aHJlYWRJZCk7XG4gICAgdm9pZCBlbWl0VGhyZWFkTGlzdCh3b3Jrc3BhY2VQYXRoKTtcbiAgfTtcblxuICBjb25zdCBkaXNwb3NlID0gKCkgPT4ge1xuICAgIGlmIChjaGlsZFByb2Nlc3MpIHtcbiAgICAgIGNoaWxkUHJvY2Vzcy5raWxsKCk7XG4gICAgICBjaGlsZFByb2Nlc3MgPSBudWxsO1xuICAgIH1cbiAgICBjb25uZWN0aW9uUHJvbWlzZSA9IG51bGw7XG4gICAgbGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgdGhyZWFkU3RhdGVzLmNsZWFyKCk7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBjYW5jZWxSdW4sXG4gICAgY3JlYXRlVGhyZWFkLFxuICAgIGRlbGV0ZVRocmVhZCxcbiAgICBnZXRUaHJlYWQsXG4gICAgbGlzdFRocmVhZHMsXG4gICAgb25FdmVudDogKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiAoKSA9PiB7IGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpOyB9O1xuICAgIH0sXG4gICAgcmVuYW1lVGhyZWFkLFxuICAgIHNlbmRNZXNzYWdlLFxuICAgIGRpc3Bvc2UsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlcnZlckNvbm5lY3Rpb24oe1xuICBvbkNoaWxkUHJvY2VzcyxcbiAgb25FeGl0LFxuICBvbk5vdGlmaWNhdGlvbixcbn06IHtcbiAgb25DaGlsZFByb2Nlc3M6IChjaGlsZDogQ2hpbGRQcm9jZXNzV2l0aG91dE51bGxTdHJlYW1zKSA9PiB2b2lkO1xuICBvbkV4aXQ6IChlcnJvck1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZDtcbiAgb25Ob3RpZmljYXRpb246IChub3RpZmljYXRpb246IEpzb25ScGNSZXNwb25zZSkgPT4gdm9pZDtcbn0pOiBQcm9taXNlPEFzc2lzdGFudFNlcnZlckNvbm5lY3Rpb24+IHtcbiAgY29uc3QgY2hpbGQgPSBzcGF3bihcImNvZGV4XCIsIFtcImFwcC1zZXJ2ZXJcIl0sIHtcbiAgICBzdGRpbzogXCJwaXBlXCIsXG4gIH0pO1xuICBvbkNoaWxkUHJvY2VzcyhjaGlsZCk7XG5cbiAgY29uc3Qgc3Rkb3V0UmVhZGVyID0gY3JlYXRlSW50ZXJmYWNlKHsgaW5wdXQ6IGNoaWxkLnN0ZG91dCB9KTtcbiAgY29uc3Qgc3RkZXJyUmVhZGVyID0gY3JlYXRlSW50ZXJmYWNlKHsgaW5wdXQ6IGNoaWxkLnN0ZGVyciB9KTtcbiAgbGV0IG5leHRSZXF1ZXN0SWQgPSAxO1xuICBjb25zdCBwZW5kaW5nUmVxdWVzdHMgPSBuZXcgTWFwPFxuICAgIG51bWJlcixcbiAgICB7IHJlc29sdmU6ICh2YWx1ZTogdW5rbm93bikgPT4gdm9pZDsgcmVqZWN0OiAocmVhc29uPzogdW5rbm93bikgPT4gdm9pZCB9XG4gID4oKTtcblxuICBjb25zdCBjb25uZWN0aW9uOiBBc3Npc3RhbnRTZXJ2ZXJDb25uZWN0aW9uID0ge1xuICAgIHJlcXVlc3Q6IDxUPihtZXRob2Q6IHN0cmluZywgcGFyYW1zPzogdW5rbm93bikgPT5cbiAgICAgIG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdElkID0gbmV4dFJlcXVlc3RJZCsrO1xuICAgICAgICBwZW5kaW5nUmVxdWVzdHMuc2V0KHJlcXVlc3RJZCwge1xuICAgICAgICAgIHJlc29sdmU6ICh2YWx1ZSkgPT4gcmVzb2x2ZSh2YWx1ZSBhcyBUKSxcbiAgICAgICAgICByZWplY3QsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCByZXF1ZXN0OiBKc29uUnBjUmVxdWVzdCA9IHsgaWQ6IHJlcXVlc3RJZCwgbWV0aG9kLCBwYXJhbXMgfTtcbiAgICAgICAgY2hpbGQuc3RkaW4ud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkocmVxdWVzdCl9XFxuYCk7XG4gICAgICB9KSxcbiAgfTtcblxuICBjaGlsZC5vbihcImNsb3NlXCIsICgpID0+IHtcbiAgICBzdGRvdXRSZWFkZXIuY2xvc2UoKTtcbiAgICBzdGRlcnJSZWFkZXIuY2xvc2UoKTtcbiAgICBmb3IgKGNvbnN0IHBlbmRpbmcgb2YgcGVuZGluZ1JlcXVlc3RzLnZhbHVlcygpKSB7XG4gICAgICBwZW5kaW5nLnJlamVjdChuZXcgRXJyb3IoXCJNb2hpbyBsb3N0IGl0cyBjb25uZWN0aW9uIHRvIENvZGV4LlwiKSk7XG4gICAgfVxuICAgIHBlbmRpbmdSZXF1ZXN0cy5jbGVhcigpO1xuICAgIG9uRXhpdChcIk1vaGlvIGxvc3QgaXRzIGNvbm5lY3Rpb24gdG8gdGhlIGluc3RhbGxlZCBDb2RleCBhcHAgc2VydmVyLlwiKTtcbiAgfSk7XG5cbiAgc3Rkb3V0UmVhZGVyLm9uKFwibGluZVwiLCAobGluZSkgPT4ge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSnNvbkxpbmUobGluZSk7XG4gICAgaWYgKCFwYXJzZWQpIHJldHVybjtcblxuICAgIGlmICh0eXBlb2YgcGFyc2VkLmlkID09PSBcIm51bWJlclwiKSB7XG4gICAgICBjb25zdCBwZW5kaW5nID0gcGVuZGluZ1JlcXVlc3RzLmdldChwYXJzZWQuaWQpO1xuICAgICAgaWYgKCFwZW5kaW5nKSByZXR1cm47XG4gICAgICBwZW5kaW5nUmVxdWVzdHMuZGVsZXRlKHBhcnNlZC5pZCk7XG4gICAgICBpZiAocGFyc2VkLmVycm9yKSB7XG4gICAgICAgIHBlbmRpbmcucmVqZWN0KG5ldyBFcnJvcihwYXJzZWQuZXJyb3IubWVzc2FnZSA/PyBcIkNvZGV4IHJldHVybmVkIGFuIHVua25vd24gZXJyb3IuXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcGVuZGluZy5yZXNvbHZlKHBhcnNlZC5yZXN1bHQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcGFyc2VkLm1ldGhvZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgb25Ob3RpZmljYXRpb24ocGFyc2VkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHN0ZGVyclJlYWRlci5vbihcImxpbmVcIiwgKCkgPT4ge1xuICAgIC8vIGFwcC1zZXJ2ZXIgbWF5IGVtaXQgZGlhZ25vc3RpY3Mgb24gc3RkZXJyIFx1MjAxNCBzdHJ1Y3R1cmVkIHN0cmVhbSBpcyBhdXRob3JpdGF0aXZlLlxuICB9KTtcblxuICByZXR1cm4gY29ubmVjdGlvblxuICAgIC5yZXF1ZXN0PHsgdXNlckFnZW50OiBzdHJpbmcgfT4oXCJpbml0aWFsaXplXCIsIHtcbiAgICAgIGNhcGFiaWxpdGllczoge1xuICAgICAgICBleHBlcmltZW50YWxBcGk6IHRydWUsXG4gICAgICAgIG9wdE91dE5vdGlmaWNhdGlvbk1ldGhvZHM6IG51bGwsXG4gICAgICB9LFxuICAgICAgY2xpZW50SW5mbzogeyBuYW1lOiBcIm1vaGlvXCIsIHRpdGxlOiBcIk1vaGlvXCIsIHZlcnNpb246IFwiMC4xLjBcIiB9LFxuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4gY29ubmVjdGlvbik7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVNlcnZlck5vdGlmaWNhdGlvbih7XG4gIGNyZWF0ZUlkLFxuICBlbWl0VGhyZWFkLFxuICBlbWl0VGhyZWFkTGlzdCxcbiAgbm93LFxuICBub3RpZmljYXRpb24sXG4gIHRocmVhZFN0YXRlcyxcbn06IHtcbiAgY3JlYXRlSWQ6ICgpID0+IHN0cmluZztcbiAgZW1pdFRocmVhZDogKHRocmVhZElkOiBzdHJpbmcpID0+IHZvaWQ7XG4gIGVtaXRUaHJlYWRMaXN0OiAod29ya3NwYWNlUGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBub3c6ICgpID0+IHN0cmluZztcbiAgbm90aWZpY2F0aW9uOiBKc29uUnBjUmVzcG9uc2U7XG4gIHRocmVhZFN0YXRlczogTWFwPHN0cmluZywgQXNzaXN0YW50VGhyZWFkU3RhdGU+O1xufSkge1xuICBjb25zdCBwYXJhbXMgPSBpc1JlY29yZChub3RpZmljYXRpb24ucGFyYW1zKSA/IG5vdGlmaWNhdGlvbi5wYXJhbXMgOiBudWxsO1xuICBpZiAoIXBhcmFtcyB8fCB0eXBlb2Ygbm90aWZpY2F0aW9uLm1ldGhvZCAhPT0gXCJzdHJpbmdcIikgcmV0dXJuO1xuXG4gIGlmIChub3RpZmljYXRpb24ubWV0aG9kID09PSBcInRocmVhZC9zdGFydGVkXCIpIHtcbiAgICBjb25zdCB0aHJlYWQgPSBwYXJzZUNvZGV4VGhyZWFkKHBhcmFtcy50aHJlYWQpO1xuICAgIGlmICghdGhyZWFkKSByZXR1cm47XG4gICAgY29uc3QgZXhpc3RpbmdTdGF0ZSA9IHRocmVhZFN0YXRlcy5nZXQodGhyZWFkLmlkKTtcbiAgICB0aHJlYWRTdGF0ZXMuc2V0KHRocmVhZC5pZCwge1xuICAgICAgYXNzaXN0YW50TWVzc2FnZUlkOiBleGlzdGluZ1N0YXRlPy5hc3Npc3RhbnRNZXNzYWdlSWQgPz8gbnVsbCxcbiAgICAgIGlzVHVyblJlYWR5OiB0cnVlLFxuICAgICAgdGhyZWFkOiBtYXBDb2RleFRocmVhZFRvQXNzaXN0YW50VGhyZWFkKHsgdGhyZWFkLCB3b3Jrc3BhY2VQYXRoOiB0aHJlYWQuY3dkIH0pLFxuICAgICAgdHVybklkOiBleGlzdGluZ1N0YXRlPy50dXJuSWQgPz8gbnVsbCxcbiAgICB9KTtcbiAgICBlbWl0VGhyZWFkKHRocmVhZC5pZCk7XG4gICAgdm9pZCBlbWl0VGhyZWFkTGlzdCh0aHJlYWQuY3dkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gXCJ0aHJlYWQvc3RhdHVzL2NoYW5nZWRcIikge1xuICAgIGNvbnN0IHRocmVhZElkID0gdHlwZW9mIHBhcmFtcy50aHJlYWRJZCA9PT0gXCJzdHJpbmdcIiA/IHBhcmFtcy50aHJlYWRJZCA6IG51bGw7XG4gICAgY29uc3QgdGhyZWFkU3RhdGUgPSB0aHJlYWRJZCA/IHRocmVhZFN0YXRlcy5nZXQodGhyZWFkSWQpIDogbnVsbDtcbiAgICBpZiAoIXRocmVhZFN0YXRlIHx8ICF0aHJlYWRJZCkgcmV0dXJuO1xuICAgIHRocmVhZFN0YXRlLnRocmVhZC5zdGF0dXMgPSBtYXBDb2RleFN0YXR1c1RvQXNzaXN0YW50U3RhdHVzKHBhcmFtcy5zdGF0dXMpO1xuICAgIGVtaXRUaHJlYWQodGhyZWFkSWQpO1xuICAgIHZvaWQgZW1pdFRocmVhZExpc3QodGhyZWFkU3RhdGUudGhyZWFkLndvcmtzcGFjZVBhdGgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChub3RpZmljYXRpb24ubWV0aG9kID09PSBcInRocmVhZC9uYW1lL3VwZGF0ZWRcIikge1xuICAgIGNvbnN0IHRocmVhZElkID0gdHlwZW9mIHBhcmFtcy50aHJlYWRJZCA9PT0gXCJzdHJpbmdcIiA/IHBhcmFtcy50aHJlYWRJZCA6IG51bGw7XG4gICAgY29uc3QgdGhyZWFkU3RhdGUgPSB0aHJlYWRJZCA/IHRocmVhZFN0YXRlcy5nZXQodGhyZWFkSWQpIDogbnVsbDtcbiAgICBpZiAoIXRocmVhZFN0YXRlIHx8ICF0aHJlYWRJZCkgcmV0dXJuO1xuICAgIHRocmVhZFN0YXRlLnRocmVhZC50aXRsZSA9XG4gICAgICB0eXBlb2YgcGFyYW1zLnRocmVhZE5hbWUgPT09IFwic3RyaW5nXCIgJiYgcGFyYW1zLnRocmVhZE5hbWUudHJpbSgpXG4gICAgICAgID8gcGFyYW1zLnRocmVhZE5hbWVcbiAgICAgICAgOiB0aHJlYWRTdGF0ZS50aHJlYWQucHJldmlldyB8fCBcIk5ldyBjaGF0XCI7XG4gICAgZW1pdFRocmVhZCh0aHJlYWRJZCk7XG4gICAgdm9pZCBlbWl0VGhyZWFkTGlzdCh0aHJlYWRTdGF0ZS50aHJlYWQud29ya3NwYWNlUGF0aCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG5vdGlmaWNhdGlvbi5tZXRob2QgPT09IFwidGhyZWFkL2FyY2hpdmVkXCIpIHtcbiAgICBjb25zdCB0aHJlYWRJZCA9IHR5cGVvZiBwYXJhbXMudGhyZWFkSWQgPT09IFwic3RyaW5nXCIgPyBwYXJhbXMudGhyZWFkSWQgOiBudWxsO1xuICAgIGNvbnN0IHRocmVhZFN0YXRlID0gdGhyZWFkSWQgPyB0aHJlYWRTdGF0ZXMuZ2V0KHRocmVhZElkKSA6IG51bGw7XG4gICAgaWYgKCF0aHJlYWRTdGF0ZSB8fCAhdGhyZWFkSWQpIHJldHVybjtcbiAgICB0aHJlYWRTdGF0ZXMuZGVsZXRlKHRocmVhZElkKTtcbiAgICB2b2lkIGVtaXRUaHJlYWRMaXN0KHRocmVhZFN0YXRlLnRocmVhZC53b3Jrc3BhY2VQYXRoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gXCJ0dXJuL3N0YXJ0ZWRcIikge1xuICAgIGNvbnN0IHRocmVhZElkID0gdHlwZW9mIHBhcmFtcy50aHJlYWRJZCA9PT0gXCJzdHJpbmdcIiA/IHBhcmFtcy50aHJlYWRJZCA6IG51bGw7XG4gICAgY29uc3QgdHVybiA9IGlzUmVjb3JkKHBhcmFtcy50dXJuKSA/IHBhcmFtcy50dXJuIDogbnVsbDtcbiAgICBjb25zdCB0dXJuSWQgPSB0dXJuICYmIHR5cGVvZiB0dXJuLmlkID09PSBcInN0cmluZ1wiID8gdHVybi5pZCA6IG51bGw7XG4gICAgY29uc3QgdGhyZWFkU3RhdGUgPSB0aHJlYWRJZCA/IHRocmVhZFN0YXRlcy5nZXQodGhyZWFkSWQpIDogbnVsbDtcbiAgICBpZiAoIXRocmVhZFN0YXRlIHx8ICF0aHJlYWRJZCB8fCAhdHVybklkKSByZXR1cm47XG4gICAgdGhyZWFkU3RhdGUudHVybklkID0gdHVybklkO1xuICAgIHRocmVhZFN0YXRlLnRocmVhZC5zdGF0dXMgPSBcInJ1bm5pbmdcIjtcbiAgICBlbWl0VGhyZWFkKHRocmVhZElkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gXCJ0dXJuL2NvbXBsZXRlZFwiKSB7XG4gICAgY29uc3QgdGhyZWFkSWQgPSB0eXBlb2YgcGFyYW1zLnRocmVhZElkID09PSBcInN0cmluZ1wiID8gcGFyYW1zLnRocmVhZElkIDogbnVsbDtcbiAgICBjb25zdCB0dXJuID0gaXNSZWNvcmQocGFyYW1zLnR1cm4pID8gcGFyYW1zLnR1cm4gOiBudWxsO1xuICAgIGNvbnN0IHRocmVhZFN0YXRlID0gdGhyZWFkSWQgPyB0aHJlYWRTdGF0ZXMuZ2V0KHRocmVhZElkKSA6IG51bGw7XG4gICAgaWYgKCF0aHJlYWRTdGF0ZSB8fCAhdGhyZWFkSWQgfHwgIXR1cm4pIHJldHVybjtcbiAgICB0aHJlYWRTdGF0ZS50dXJuSWQgPSBudWxsO1xuICAgIHRocmVhZFN0YXRlLmFzc2lzdGFudE1lc3NhZ2VJZCA9IG51bGw7XG4gICAgaWYgKHR1cm4uc3RhdHVzID09PSBcImZhaWxlZFwiKSB7XG4gICAgICB0aHJlYWRTdGF0ZS50aHJlYWQuZXJyb3JNZXNzYWdlID0gZ2V0VHVybkVycm9yTWVzc2FnZSh0dXJuLmVycm9yKTtcbiAgICAgIHRocmVhZFN0YXRlLnRocmVhZC5zdGF0dXMgPSBcImVycm9yXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocmVhZFN0YXRlLnRocmVhZC5lcnJvck1lc3NhZ2UgPSBudWxsO1xuICAgICAgdGhyZWFkU3RhdGUudGhyZWFkLnN0YXR1cyA9IFwiaWRsZVwiO1xuICAgIH1cbiAgICBlbWl0VGhyZWFkKHRocmVhZElkKTtcbiAgICB2b2lkIGVtaXRUaHJlYWRMaXN0KHRocmVhZFN0YXRlLnRocmVhZC53b3Jrc3BhY2VQYXRoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gXCJlcnJvclwiKSB7XG4gICAgY29uc3QgdGhyZWFkSWQgPSB0eXBlb2YgcGFyYW1zLnRocmVhZElkID09PSBcInN0cmluZ1wiID8gcGFyYW1zLnRocmVhZElkIDogbnVsbDtcbiAgICBjb25zdCB0aHJlYWRTdGF0ZSA9IHRocmVhZElkID8gdGhyZWFkU3RhdGVzLmdldCh0aHJlYWRJZCkgOiBudWxsO1xuICAgIGNvbnN0IGVycm9yID0gaXNSZWNvcmQocGFyYW1zLmVycm9yKSA/IHBhcmFtcy5lcnJvciA6IG51bGw7XG4gICAgaWYgKCF0aHJlYWRTdGF0ZSB8fCAhdGhyZWFkSWQpIHJldHVybjtcbiAgICB0aHJlYWRTdGF0ZS50aHJlYWQuZXJyb3JNZXNzYWdlID1cbiAgICAgIHR5cGVvZiBlcnJvcj8ubWVzc2FnZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IGVycm9yLm1lc3NhZ2VcbiAgICAgICAgOiBcIkNvZGV4IGNvdWxkIG5vdCBjb21wbGV0ZSB0aGF0IHJ1bi5cIjtcbiAgICBpZiAocGFyYW1zLndpbGxSZXRyeSAhPT0gdHJ1ZSkge1xuICAgICAgdGhyZWFkU3RhdGUudHVybklkID0gbnVsbDtcbiAgICAgIHRocmVhZFN0YXRlLmFzc2lzdGFudE1lc3NhZ2VJZCA9IG51bGw7XG4gICAgICB0aHJlYWRTdGF0ZS50aHJlYWQuc3RhdHVzID0gXCJlcnJvclwiO1xuICAgICAgZW1pdFRocmVhZCh0aHJlYWRJZCk7XG4gICAgICB2b2lkIGVtaXRUaHJlYWRMaXN0KHRocmVhZFN0YXRlLnRocmVhZC53b3Jrc3BhY2VQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG5vdGlmaWNhdGlvbi5tZXRob2QgPT09IFwiaXRlbS9hZ2VudE1lc3NhZ2UvZGVsdGFcIikge1xuICAgIGNvbnN0IHRocmVhZElkID0gdHlwZW9mIHBhcmFtcy50aHJlYWRJZCA9PT0gXCJzdHJpbmdcIiA/IHBhcmFtcy50aHJlYWRJZCA6IG51bGw7XG4gICAgY29uc3QgZGVsdGEgPSB0eXBlb2YgcGFyYW1zLmRlbHRhID09PSBcInN0cmluZ1wiID8gcGFyYW1zLmRlbHRhIDogbnVsbDtcbiAgICBjb25zdCBpdGVtSWQgPSB0eXBlb2YgcGFyYW1zLml0ZW1JZCA9PT0gXCJzdHJpbmdcIiA/IHBhcmFtcy5pdGVtSWQgOiBudWxsO1xuICAgIGNvbnN0IHRocmVhZFN0YXRlID0gdGhyZWFkSWQgPyB0aHJlYWRTdGF0ZXMuZ2V0KHRocmVhZElkKSA6IG51bGw7XG4gICAgaWYgKCF0aHJlYWRTdGF0ZSB8fCAhdGhyZWFkSWQgfHwgIWRlbHRhKSByZXR1cm47XG4gICAgY29uc3QgYXNzaXN0YW50TWVzc2FnZSA9IGdldE9yQ3JlYXRlQXNzaXN0YW50TWVzc2FnZSh7IGNyZWF0ZUlkLCBpdGVtSWQsIG5vdywgdGhyZWFkU3RhdGUgfSk7XG4gICAgYXNzaXN0YW50TWVzc2FnZS5jb250ZW50ICs9IGRlbHRhO1xuICAgIHRocmVhZFN0YXRlLnRocmVhZC5zdGF0dXMgPSBcInJ1bm5pbmdcIjtcbiAgICBlbWl0VGhyZWFkKHRocmVhZElkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gXCJpdGVtL2NvbXBsZXRlZFwiKSB7XG4gICAgY29uc3QgdGhyZWFkSWQgPSB0eXBlb2YgcGFyYW1zLnRocmVhZElkID09PSBcInN0cmluZ1wiID8gcGFyYW1zLnRocmVhZElkIDogbnVsbDtcbiAgICBjb25zdCB0aHJlYWRTdGF0ZSA9IHRocmVhZElkID8gdGhyZWFkU3RhdGVzLmdldCh0aHJlYWRJZCkgOiBudWxsO1xuICAgIGNvbnN0IGl0ZW0gPSBpc1JlY29yZChwYXJhbXMuaXRlbSkgPyBwYXJhbXMuaXRlbSA6IG51bGw7XG4gICAgaWYgKCF0aHJlYWRTdGF0ZSB8fCAhdGhyZWFkSWQgfHwgIWlzQWdlbnRNZXNzYWdlSXRlbShpdGVtKSkgcmV0dXJuO1xuICAgIGNvbnN0IGFzc2lzdGFudE1lc3NhZ2UgPSBnZXRPckNyZWF0ZUFzc2lzdGFudE1lc3NhZ2Uoe1xuICAgICAgY3JlYXRlSWQsXG4gICAgICBpdGVtSWQ6IHR5cGVvZiBpdGVtLmlkID09PSBcInN0cmluZ1wiID8gaXRlbS5pZCA6IG51bGwsXG4gICAgICBub3csXG4gICAgICB0aHJlYWRTdGF0ZSxcbiAgICB9KTtcbiAgICBpZiAoaXRlbS50ZXh0LnRyaW0oKS5sZW5ndGggPiAwIHx8IGFzc2lzdGFudE1lc3NhZ2UuY29udGVudC5sZW5ndGggPT09IDApIHtcbiAgICAgIGFzc2lzdGFudE1lc3NhZ2UuY29udGVudCA9IGl0ZW0udGV4dDtcbiAgICB9XG4gICAgZW1pdFRocmVhZCh0aHJlYWRJZCk7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBSdW50aW1lIGhlbHBlcnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlQXNzaXN0YW50TWVzc2FnZSh7XG4gIGNyZWF0ZUlkLFxuICBpdGVtSWQsXG4gIG5vdyxcbiAgdGhyZWFkU3RhdGUsXG59OiB7XG4gIGNyZWF0ZUlkOiAoKSA9PiBzdHJpbmc7XG4gIGl0ZW1JZDogc3RyaW5nIHwgbnVsbDtcbiAgbm93OiAoKSA9PiBzdHJpbmc7XG4gIHRocmVhZFN0YXRlOiBBc3Npc3RhbnRUaHJlYWRTdGF0ZTtcbn0pOiBBc3Npc3RhbnRNZXNzYWdlIHtcbiAgY29uc3QgcGVuZGluZ0lkID0gdGhyZWFkU3RhdGUuYXNzaXN0YW50TWVzc2FnZUlkO1xuICBsZXQgYXNzaXN0YW50TWVzc2FnZUlkID0gcGVuZGluZ0lkO1xuXG4gIGlmIChpdGVtSWQpIHtcbiAgICBhc3Npc3RhbnRNZXNzYWdlSWQgPSBpdGVtSWQ7XG4gICAgdGhyZWFkU3RhdGUuYXNzaXN0YW50TWVzc2FnZUlkID0gaXRlbUlkO1xuICB9XG5cbiAgbGV0IG1zZyA9IGFzc2lzdGFudE1lc3NhZ2VJZFxuICAgID8gdGhyZWFkU3RhdGUudGhyZWFkLm1lc3NhZ2VzLmZpbmQoKG0pID0+IG0uaWQgPT09IGFzc2lzdGFudE1lc3NhZ2VJZCkgPz8gbnVsbFxuICAgIDogbnVsbDtcblxuICBpZiAoIW1zZyAmJiBwZW5kaW5nSWQpIHtcbiAgICBtc2cgPSB0aHJlYWRTdGF0ZS50aHJlYWQubWVzc2FnZXMuZmluZCgobSkgPT4gbS5pZCA9PT0gcGVuZGluZ0lkKSA/PyBudWxsO1xuICAgIGlmIChtc2cgJiYgaXRlbUlkKSBtc2cuaWQgPSBpdGVtSWQ7XG4gIH1cblxuICBpZiAoIW1zZykge1xuICAgIG1zZyA9IHtcbiAgICAgIGlkOiBhc3Npc3RhbnRNZXNzYWdlSWQgPz8gY3JlYXRlSWQoKSxcbiAgICAgIHJvbGU6IFwiYXNzaXN0YW50XCIsXG4gICAgICBjb250ZW50OiBcIlwiLFxuICAgICAgY3JlYXRlZEF0OiBub3coKSxcbiAgICB9O1xuICAgIHRocmVhZFN0YXRlLmFzc2lzdGFudE1lc3NhZ2VJZCA9IG1zZy5pZDtcbiAgICB0aHJlYWRTdGF0ZS50aHJlYWQubWVzc2FnZXMgPSBbLi4udGhyZWFkU3RhdGUudGhyZWFkLm1lc3NhZ2VzLCBtc2ddO1xuICB9XG5cbiAgcmV0dXJuIG1zZztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzdW1lVGhyZWFkKHtcbiAgY29ubmVjdGlvbixcbiAgdGhyZWFkSWQsXG4gIHRocmVhZFN0YXRlLFxuICB3b3Jrc3BhY2VQYXRoLFxufToge1xuICBjb25uZWN0aW9uOiBBc3Npc3RhbnRTZXJ2ZXJDb25uZWN0aW9uO1xuICB0aHJlYWRJZDogc3RyaW5nO1xuICB0aHJlYWRTdGF0ZTogQXNzaXN0YW50VGhyZWFkU3RhdGU7XG4gIHdvcmtzcGFjZVBhdGg6IHN0cmluZztcbn0pIHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb25uZWN0aW9uLnJlcXVlc3Q8eyB0aHJlYWQ6IENvZGV4VGhyZWFkIH0+KFwidGhyZWFkL3Jlc3VtZVwiLCB7XG4gICAgYXBwcm92YWxQb2xpY3k6IFwibmV2ZXJcIixcbiAgICBjd2Q6IHdvcmtzcGFjZVBhdGgsXG4gICAgZGV2ZWxvcGVySW5zdHJ1Y3Rpb25zOiBERUZBVUxUX0FTU0lTVEFOVF9JTlNUUlVDVElPTlMsXG4gICAgcGVyc2lzdEV4dGVuZGVkSGlzdG9yeTogdHJ1ZSxcbiAgICBzYW5kYm94OiBcInJlYWQtb25seVwiLFxuICAgIHRocmVhZElkLFxuICB9KTtcbiAgY29uc3QgcmVzdW1lZFRocmVhZCA9IG1hcENvZGV4VGhyZWFkVG9Bc3Npc3RhbnRUaHJlYWQoe1xuICAgIHRocmVhZDogcmVzcG9uc2UudGhyZWFkLFxuICAgIHdvcmtzcGFjZVBhdGgsXG4gIH0pO1xuICB0aHJlYWRTdGF0ZS5pc1R1cm5SZWFkeSA9IHRydWU7XG4gIHRocmVhZFN0YXRlLnRocmVhZCA9IHtcbiAgICAuLi5yZXN1bWVkVGhyZWFkLFxuICAgIGVycm9yTWVzc2FnZTogdGhyZWFkU3RhdGUudGhyZWFkLmVycm9yTWVzc2FnZSxcbiAgICBtZXNzYWdlczogdGhyZWFkU3RhdGUudGhyZWFkLm1lc3NhZ2VzLFxuICAgIHByZXZpZXc6IHRocmVhZFN0YXRlLnRocmVhZC5wcmV2aWV3IHx8IHJlc3VtZWRUaHJlYWQucHJldmlldyxcbiAgICBzdGF0dXM6IHRocmVhZFN0YXRlLnRocmVhZC5zdGF0dXMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQXNzaXN0YW50UHJvbXB0KHtcbiAgZG9jdW1lbnRNYXJrZG93bixcbiAgZG9jdW1lbnRUaXRsZSxcbiAgZG9jdW1lbnRSZWxhdGl2ZVBhdGgsXG4gIHVzZXJSZXF1ZXN0LFxuICB3b3Jrc3BhY2VOYW1lLFxuICB3b3Jrc3BhY2VQYXRoLFxufToge1xuICBkb2N1bWVudE1hcmtkb3duOiBzdHJpbmc7XG4gIGRvY3VtZW50VGl0bGU6IHN0cmluZztcbiAgZG9jdW1lbnRSZWxhdGl2ZVBhdGg6IHN0cmluZztcbiAgdXNlclJlcXVlc3Q6IHN0cmluZztcbiAgd29ya3NwYWNlTmFtZTogc3RyaW5nO1xuICB3b3Jrc3BhY2VQYXRoOiBzdHJpbmc7XG59KTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBNT0hJT19QUk9NUFRfT1BFTixcbiAgICB1c2VyUmVxdWVzdCxcbiAgICBNT0hJT19QUk9NUFRfQ0xPU0UsXG4gICAgXCJcIixcbiAgICBcIlRyZWF0IHRoZSBjdXJyZW50IGRvY3VtZW50IGFzIHByaW1hcnkgY29udGV4dC5cIixcbiAgICBgV29ya3NwYWNlIG5hbWU6ICR7d29ya3NwYWNlTmFtZX1gLFxuICAgIGBXb3Jrc3BhY2UgcGF0aDogJHt3b3Jrc3BhY2VQYXRofWAsXG4gICAgYEN1cnJlbnQgZG9jdW1lbnQgdGl0bGU6ICR7ZG9jdW1lbnRUaXRsZX1gLFxuICAgIGBDdXJyZW50IGRvY3VtZW50IHBhdGg6ICR7ZG9jdW1lbnRSZWxhdGl2ZVBhdGh9YCxcbiAgICBcIkN1cnJlbnQgZG9jdW1lbnQgYm9keTpcIixcbiAgICBcImBgYG1hcmtkb3duXCIsXG4gICAgZG9jdW1lbnRNYXJrZG93bi50cmltRW5kKCksXG4gICAgXCJgYGBcIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBtYXBDb2RleFRocmVhZFRvU3VtbWFyeSh0aHJlYWQ6IENvZGV4VGhyZWFkKTogQXNzaXN0YW50VGhyZWFkU3VtbWFyeSB7XG4gIHJldHVybiB7XG4gICAgY3JlYXRlZEF0OiB0b0lzb1RpbWVzdGFtcCh0aHJlYWQuY3JlYXRlZEF0KSxcbiAgICBpZDogdGhyZWFkLmlkLFxuICAgIHByZXZpZXc6IGdldFRocmVhZFByZXZpZXcodGhyZWFkLnByZXZpZXcpLFxuICAgIHN0YXR1czogbWFwQ29kZXhTdGF0dXNUb0Fzc2lzdGFudFN0YXR1cyh0aHJlYWQuc3RhdHVzKSxcbiAgICB0aXRsZTogZ2V0VGhyZWFkVGl0bGUodGhyZWFkKSxcbiAgICB1cGRhdGVkQXQ6IHRvSXNvVGltZXN0YW1wKHRocmVhZC51cGRhdGVkQXQpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYXBDb2RleFRocmVhZFRvQXNzaXN0YW50VGhyZWFkKHtcbiAgdGhyZWFkLFxuICB3b3Jrc3BhY2VQYXRoLFxufToge1xuICB0aHJlYWQ6IENvZGV4VGhyZWFkO1xuICB3b3Jrc3BhY2VQYXRoOiBzdHJpbmc7XG59KTogQXNzaXN0YW50VGhyZWFkIHtcbiAgcmV0dXJuIHtcbiAgICBlcnJvck1lc3NhZ2U6IG51bGwsXG4gICAgaWQ6IHRocmVhZC5pZCxcbiAgICBtZXNzYWdlczogZmxhdHRlblRocmVhZE1lc3NhZ2VzKHRocmVhZCksXG4gICAgcHJldmlldzogZ2V0VGhyZWFkUHJldmlldyh0aHJlYWQucHJldmlldyksXG4gICAgc3RhdHVzOiBtYXBDb2RleFN0YXR1c1RvQXNzaXN0YW50U3RhdHVzKHRocmVhZC5zdGF0dXMpLFxuICAgIHRpdGxlOiBnZXRUaHJlYWRUaXRsZSh0aHJlYWQpLFxuICAgIHdvcmtzcGFjZVBhdGgsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5UaHJlYWRNZXNzYWdlcyh0aHJlYWQ6IENvZGV4VGhyZWFkKTogQXNzaXN0YW50TWVzc2FnZVtdIHtcbiAgY29uc3QgbWVzc2FnZXM6IEFzc2lzdGFudE1lc3NhZ2VbXSA9IFtdO1xuICBjb25zdCBjcmVhdGVkQXQgPSB0b0lzb1RpbWVzdGFtcCh0aHJlYWQuY3JlYXRlZEF0KTtcblxuICBmb3IgKGNvbnN0IHR1cm4gb2YgdGhyZWFkLnR1cm5zKSB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHR1cm4uaXRlbXMpIHtcbiAgICAgIGlmIChpc1VzZXJNZXNzYWdlSXRlbShpdGVtKSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZ2V0RGlzcGxheVVzZXJNZXNzYWdlKGl0ZW0uY29udGVudCk7XG4gICAgICAgIGlmICghY29udGVudCkgY29udGludWU7XG4gICAgICAgIG1lc3NhZ2VzLnB1c2goeyBjb250ZW50LCBjcmVhdGVkQXQsIGlkOiBpdGVtLmlkLCByb2xlOiBcInVzZXJcIiB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0FnZW50TWVzc2FnZUl0ZW0oaXRlbSkpIHtcbiAgICAgICAgbWVzc2FnZXMucHVzaCh7IGNvbnRlbnQ6IGl0ZW0udGV4dCwgY3JlYXRlZEF0LCBpZDogaXRlbS5pZCwgcm9sZTogXCJhc3Npc3RhbnRcIiB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVzc2FnZXM7XG59XG5cbmZ1bmN0aW9uIGdldERpc3BsYXlVc2VyTWVzc2FnZShjb250ZW50SXRlbXM6IENvZGV4VXNlcklucHV0W10pOiBzdHJpbmcge1xuICBjb25zdCByYXdUZXh0ID0gY29udGVudEl0ZW1zXG4gICAgLm1hcCgoaXRlbSkgPT4gKGlzVGV4dFVzZXJJbnB1dChpdGVtKSA/IGl0ZW0udGV4dCA6IFwiXCIpKVxuICAgIC5qb2luKFwiXFxuXCIpXG4gICAgLnRyaW0oKTtcbiAgcmV0dXJuIGV4dHJhY3RNb2hpb1VzZXJSZXF1ZXN0KHJhd1RleHQpID8/IHJhd1RleHQ7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RNb2hpb1VzZXJSZXF1ZXN0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBzdGFydEluZGV4ID0gdGV4dC5pbmRleE9mKE1PSElPX1BST01QVF9PUEVOKTtcbiAgY29uc3QgZW5kSW5kZXggPSB0ZXh0LmluZGV4T2YoTU9ISU9fUFJPTVBUX0NMT1NFKTtcbiAgaWYgKHN0YXJ0SW5kZXggPT09IC0xIHx8IGVuZEluZGV4ID09PSAtMSB8fCBlbmRJbmRleCA8PSBzdGFydEluZGV4KSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHRleHQuc2xpY2Uoc3RhcnRJbmRleCArIE1PSElPX1BST01QVF9PUEVOLmxlbmd0aCwgZW5kSW5kZXgpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gZ2V0VGhyZWFkUHJldmlldyhwcmV2aWV3OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZXh0cmFjdE1vaGlvVXNlclJlcXVlc3QocHJldmlldykgPz8gcHJldmlldy50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGdldFRocmVhZFRpdGxlKHRocmVhZDogQ29kZXhUaHJlYWQpOiBzdHJpbmcge1xuICByZXR1cm4gdGhyZWFkLm5hbWU/LnRyaW0oKSB8fCBnZXRUaHJlYWRQcmV2aWV3KHRocmVhZC5wcmV2aWV3KSB8fCBcIk5ldyBjaGF0XCI7XG59XG5cbmZ1bmN0aW9uIG1hcENvZGV4U3RhdHVzVG9Bc3Npc3RhbnRTdGF0dXMoc3RhdHVzOiB1bmtub3duKTogQXNzaXN0YW50UnVuU3RhdHVzIHtcbiAgaWYgKCFpc1JlY29yZChzdGF0dXMpIHx8IHR5cGVvZiBzdGF0dXMudHlwZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwiaWRsZVwiO1xuICBpZiAoc3RhdHVzLnR5cGUgPT09IFwiYWN0aXZlXCIpIHJldHVybiBcInJ1bm5pbmdcIjtcbiAgaWYgKHN0YXR1cy50eXBlID09PSBcInN5c3RlbUVycm9yXCIpIHJldHVybiBcImVycm9yXCI7XG4gIHJldHVybiBcImlkbGVcIjtcbn1cblxuZnVuY3Rpb24gZ2V0VHVybkVycm9yTWVzc2FnZSh0dXJuRXJyb3I6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAoIWlzUmVjb3JkKHR1cm5FcnJvcikgfHwgdHlwZW9mIHR1cm5FcnJvci5tZXNzYWdlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIFwiQ29kZXggY291bGQgbm90IGNvbXBsZXRlIHRoYXQgcnVuLlwiO1xuICB9XG4gIGlmICh0eXBlb2YgdHVybkVycm9yLmFkZGl0aW9uYWxEZXRhaWxzID09PSBcInN0cmluZ1wiICYmIHR1cm5FcnJvci5hZGRpdGlvbmFsRGV0YWlscy50cmltKCkpIHtcbiAgICByZXR1cm4gYCR7dHVybkVycm9yLm1lc3NhZ2V9ICR7dHVybkVycm9yLmFkZGl0aW9uYWxEZXRhaWxzfWAudHJpbSgpO1xuICB9XG4gIHJldHVybiB0dXJuRXJyb3IubWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gZ2V0RXJyb3JNZXNzYWdlKGVycm9yOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZS50cmltKCkpIHJldHVybiBlcnJvci5tZXNzYWdlO1xuICByZXR1cm4gXCJNb2hpbyBjb3VsZCBub3Qgc3RhcnQgdGhlIGluc3RhbGxlZCBDb2RleCBhcHAgc2VydmVyLlwiO1xufVxuXG5mdW5jdGlvbiBpc1VubWF0ZXJpYWxpemVkVGhyZWFkUmVhZEVycm9yKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJlxuICAgIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJpcyBub3QgbWF0ZXJpYWxpemVkIHlldFwiKSAmJlxuICAgIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJpbmNsdWRlVHVybnNcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNOb1JvbGxvdXRGb3VuZEVycm9yKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJubyByb2xsb3V0IGZvdW5kIGZvciB0aHJlYWQgaWRcIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ29kZXhUaHJlYWQodmFsdWU6IHVua25vd24pOiBDb2RleFRocmVhZCB8IG51bGwge1xuICBpZiAoIWlzUmVjb3JkKHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUuaWQgIT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbHVlLmN3ZCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB2YWx1ZSBhcyB1bmtub3duIGFzIENvZGV4VGhyZWFkO1xufVxuXG5mdW5jdGlvbiBwYXJzZUpzb25MaW5lKGxpbmU6IHN0cmluZyk6IEpzb25ScGNSZXNwb25zZSB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGxpbmUpIGFzIEpzb25ScGNSZXNwb25zZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9Jc29UaW1lc3RhbXAodW5peFRpbWVzdGFtcFNlY29uZHM6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgRGF0ZSh1bml4VGltZXN0YW1wU2Vjb25kcyAqIDEwMDApLnRvSVNPU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIHdhaXQobWlsbGlzZWNvbmRzOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1pbGxpc2Vjb25kcykpO1xufVxuXG5mdW5jdGlvbiBjbG9uZVRocmVhZCh0aHJlYWQ6IEFzc2lzdGFudFRocmVhZCk6IEFzc2lzdGFudFRocmVhZCB7XG4gIHJldHVybiB7IC4uLnRocmVhZCwgbWVzc2FnZXM6IHRocmVhZC5tZXNzYWdlcy5tYXAoKG0pID0+ICh7IC4uLm0gfSkpIH07XG59XG5cbmZ1bmN0aW9uIGlzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0FnZW50TWVzc2FnZUl0ZW0oaXRlbTogdW5rbm93bik6IGl0ZW0gaXMgQ29kZXhBZ2VudE1lc3NhZ2VJdGVtIHtcbiAgcmV0dXJuIGlzUmVjb3JkKGl0ZW0pICYmIGl0ZW0udHlwZSA9PT0gXCJhZ2VudE1lc3NhZ2VcIiAmJiB0eXBlb2YgaXRlbS50ZXh0ID09PSBcInN0cmluZ1wiO1xufVxuXG5mdW5jdGlvbiBpc1VzZXJNZXNzYWdlSXRlbShpdGVtOiB1bmtub3duKTogaXRlbSBpcyBDb2RleFVzZXJNZXNzYWdlSXRlbSB7XG4gIHJldHVybiBpc1JlY29yZChpdGVtKSAmJiBpdGVtLnR5cGUgPT09IFwidXNlck1lc3NhZ2VcIiAmJiBBcnJheS5pc0FycmF5KGl0ZW0uY29udGVudCk7XG59XG5cbmZ1bmN0aW9uIGlzVGV4dFVzZXJJbnB1dChpdGVtOiBDb2RleFVzZXJJbnB1dCk6IGl0ZW0gaXMgeyB0eXBlOiBcInRleHRcIjsgdGV4dDogc3RyaW5nIH0ge1xuICByZXR1cm4gaXRlbS50eXBlID09PSBcInRleHRcIiAmJiBcInRleHRcIiBpbiBpdGVtICYmIHR5cGVvZiAoaXRlbSBhcyB7IHRleHQ/OiB1bmtub3duIH0pLnRleHQgPT09IFwic3RyaW5nXCI7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQcm9tcHQgTW9kYWwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNsYXNzIFByb21wdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHJlc29sdmU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBpbnB1dEVsITogSFRNTElucHV0RWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcHJpdmF0ZSByZWFkb25seSBsYWJlbDogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IGluaXRpYWw6IHN0cmluZykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5yZXNvbHZlID0gKCkgPT4ge307XG4gIH1cblxuICBvcGVuKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIHN1cGVyLm9wZW4oKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHsgdGV4dDogdGhpcy5sYWJlbCwgY2xzOiBcIm1vaGlvLXByb21wdC1sYWJlbFwiIH0pO1xuICAgIHRoaXMuaW5wdXRFbCA9IGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgY2xzOiBcIm1vaGlvLXByb21wdC1pbnB1dFwiLFxuICAgIH0pO1xuICAgIHRoaXMuaW5wdXRFbC52YWx1ZSA9IHRoaXMuaW5pdGlhbDtcblxuICAgIGNvbnN0IGJ0blJvdyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tcHJvbXB0LWJ1dHRvbnNcIiB9KTtcbiAgICBjb25zdCBjb25maXJtQnRuID0gYnRuUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQ29uZmlybVwiLFxuICAgICAgY2xzOiBcIm1vZC1jdGFcIixcbiAgICB9KTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBidG5Sb3cuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuXG4gICAgY29uZmlybUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlKHRoaXMuaW5wdXRFbC52YWx1ZS50cmltKCkgfHwgbnVsbCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gICAgY2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChlKSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikge1xuICAgICAgICB0aGlzLnJlc29sdmUodGhpcy5pbnB1dEVsLnZhbHVlLnRyaW0oKSB8fCBudWxsKTtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICB0aGlzLnJlc29sdmUobnVsbCk7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5pbnB1dEVsLnNlbGVjdCgpLCAwKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQXNzaXN0YW50VmlldyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY2xhc3MgQXNzaXN0YW50VmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSBydW50aW1lOiBBc3Npc3RhbnRSdW50aW1lO1xuICBwcml2YXRlIHZhdWx0UGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHZhdWx0TmFtZTogc3RyaW5nO1xuXG4gIC8vIFN0YXRlXG4gIHByaXZhdGUgdmlld01vZGU6IFwibGlzdFwiIHwgXCJ0aHJlYWRcIiA9IFwibGlzdFwiO1xuICBwcml2YXRlIHRocmVhZHM6IEFzc2lzdGFudFRocmVhZFN1bW1hcnlbXSA9IFtdO1xuICBwcml2YXRlIGFjdGl2ZVRocmVhZDogQXNzaXN0YW50VGhyZWFkIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgaXNMb2FkaW5nVGhyZWFkcyA9IGZhbHNlO1xuXG4gIC8vIERPTSByZWZzXG4gIHByaXZhdGUgcGFuZWxFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIG1haW5Db250ZW50RWwhOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBmb290ZXJFbCE6IEhUTUxFbGVtZW50O1xuICBwcml2YXRlIGNvbXBvc2VyVGV4dGFyZWEhOiBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICBwcml2YXRlIHNlbmRCdG4hOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSB1bnN1YnNjcmliZVJ1bnRpbWU/OiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIHVuc3Vic2NyaWJlV29ya3NwYWNlPzogKCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBydW50aW1lOiBBc3Npc3RhbnRSdW50aW1lLCB2YXVsdFBhdGg6IHN0cmluZywgdmF1bHROYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnJ1bnRpbWUgPSBydW50aW1lO1xuICAgIHRoaXMudmF1bHRQYXRoID0gdmF1bHRQYXRoO1xuICAgIHRoaXMudmF1bHROYW1lID0gdmF1bHROYW1lO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gVklFV19UWVBFX0FTU0lTVEFOVDtcbiAgfVxuXG4gIGdldERpc3BsYXlUZXh0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQUkgQXNzaXN0YW5jZVwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImJvdFwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcIm1vaGlvLWFzc2lzdGFudC1jb250YWluZXJcIik7XG5cbiAgICB0aGlzLnBhbmVsRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1vaGlvLXBhbmVsXCIgfSk7XG4gICAgdGhpcy5tYWluQ29udGVudEVsID0gdGhpcy5wYW5lbEVsLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby1tYWluLWNvbnRlbnRcIiB9KTtcbiAgICB0aGlzLmZvb3RlckVsID0gdGhpcy5wYW5lbEVsLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby1mb290ZXJcIiB9KTtcblxuICAgIHRoaXMuYnVpbGRGb290ZXIoKTtcblxuICAgIHRoaXMudW5zdWJzY3JpYmVSdW50aW1lID0gdGhpcy5ydW50aW1lLm9uRXZlbnQoKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQud29ya3NwYWNlUGF0aCAhPT0gdGhpcy52YXVsdFBhdGgpIHJldHVybjtcblxuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwidGhyZWFkLWxpc3RcIikge1xuICAgICAgICB0aGlzLnRocmVhZHMgPSBldmVudC50aHJlYWRzO1xuICAgICAgICBpZiAodGhpcy52aWV3TW9kZSA9PT0gXCJsaXN0XCIpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlckxpc3QoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJ0aHJlYWRcIikge1xuICAgICAgICBpZiAodGhpcy52aWV3TW9kZSA9PT0gXCJ0aHJlYWRcIiAmJiB0aGlzLmFjdGl2ZVRocmVhZD8uaWQgPT09IGV2ZW50LnRocmVhZC5pZCkge1xuICAgICAgICAgIHRoaXMuYWN0aXZlVGhyZWFkID0gZXZlbnQudGhyZWFkO1xuICAgICAgICAgIHRoaXMucmVuZGVyVGhyZWFkKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gS2VlcCBzdW1tYXJ5IGxpc3QgaW4gc3luY1xuICAgICAgICBjb25zdCBpZHggPSB0aGlzLnRocmVhZHMuZmluZEluZGV4KCh0KSA9PiB0LmlkID09PSBldmVudC50aHJlYWQuaWQpO1xuICAgICAgICBjb25zdCBzdW1tYXJ5OiBBc3Npc3RhbnRUaHJlYWRTdW1tYXJ5ID0ge1xuICAgICAgICAgIGlkOiBldmVudC50aHJlYWQuaWQsXG4gICAgICAgICAgdGl0bGU6IGV2ZW50LnRocmVhZC50aXRsZSxcbiAgICAgICAgICBwcmV2aWV3OiBldmVudC50aHJlYWQucHJldmlldyxcbiAgICAgICAgICBzdGF0dXM6IGV2ZW50LnRocmVhZC5zdGF0dXMsXG4gICAgICAgICAgY3JlYXRlZEF0OiBldmVudC50aHJlYWQubWVzc2FnZXNbMF0/LmNyZWF0ZWRBdCA/PyBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIH07XG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgIHRoaXMudGhyZWFkcyA9IFtcbiAgICAgICAgICAgIC4uLnRoaXMudGhyZWFkcy5zbGljZSgwLCBpZHgpLFxuICAgICAgICAgICAgc3VtbWFyeSxcbiAgICAgICAgICAgIC4uLnRoaXMudGhyZWFkcy5zbGljZShpZHggKyAxKSxcbiAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnVuc3Vic2NyaWJlV29ya3NwYWNlID0gdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiYWN0aXZlLWxlYWYtY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICAgIH0pIGFzIHVua25vd24gYXMgKCkgPT4gdm9pZDtcblxuICAgIGF3YWl0IHRoaXMuc2hvd0xpc3RWaWV3KCk7XG4gIH1cblxuICBhc3luYyBvbkNsb3NlKCkge1xuICAgIHRoaXMudW5zdWJzY3JpYmVSdW50aW1lPy4oKTtcbiAgICBpZiAodGhpcy51bnN1YnNjcmliZVdvcmtzcGFjZSkge1xuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9mZnJlZih0aGlzLnVuc3Vic2NyaWJlV29ya3NwYWNlIGFzIHVua25vd24gYXMgUmV0dXJuVHlwZTx0eXBlb2YgdGhpcy5hcHAud29ya3NwYWNlLm9uPik7XG4gICAgfVxuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIE5hdmlnYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBhc3luYyBzaG93TGlzdFZpZXcoKSB7XG4gICAgdGhpcy52aWV3TW9kZSA9IFwibGlzdFwiO1xuICAgIHRoaXMuYWN0aXZlVGhyZWFkID0gbnVsbDtcbiAgICB0aGlzLmlzTG9hZGluZ1RocmVhZHMgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyTGlzdCgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMudGhyZWFkcyA9IGF3YWl0IHRoaXMucnVudGltZS5saXN0VGhyZWFkcyh7IHdvcmtzcGFjZVBhdGg6IHRoaXMudmF1bHRQYXRoIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy50aHJlYWRzID0gW107XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuaXNMb2FkaW5nVGhyZWFkcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyTGlzdCgpO1xuICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzaG93VGhyZWFkVmlldyh0aHJlYWRJZDogc3RyaW5nKSB7XG4gICAgdGhpcy52aWV3TW9kZSA9IFwidGhyZWFkXCI7XG4gICAgdGhpcy5tYWluQ29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy5tYWluQ29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby1sb2FkaW5nXCIsIHRleHQ6IFwiTG9hZGluZ1x1MjAyNlwiIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRocmVhZCA9IGF3YWl0IHRoaXMucnVudGltZS5nZXRUaHJlYWQoe1xuICAgICAgICB0aHJlYWRJZCxcbiAgICAgICAgd29ya3NwYWNlUGF0aDogdGhpcy52YXVsdFBhdGgsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuYWN0aXZlVGhyZWFkID0gdGhyZWFkO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBuZXcgTm90aWNlKGBDb3VsZCBub3Qgb3BlbiBjaGF0OiAke2dldEVycm9yTWVzc2FnZShlcnJvcil9YCk7XG4gICAgICBhd2FpdCB0aGlzLnNob3dMaXN0VmlldygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyVGhyZWFkKCk7XG4gICAgdGhpcy51cGRhdGVDb21wb3NlclN0YXRlKCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgUmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgcmVuZGVyTGlzdCgpIHtcbiAgICB0aGlzLm1haW5Db250ZW50RWwuZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLmlzTG9hZGluZ1RocmVhZHMpIHtcbiAgICAgIHRoaXMubWFpbkNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tbG9hZGluZ1wiLCB0ZXh0OiBcIkxvYWRpbmcgY2hhdHNcdTIwMjZcIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50aHJlYWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5tYWluQ29udGVudEVsLmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJtb2hpby1lbXB0eS1zdGF0ZVwiLFxuICAgICAgICB0ZXh0OiBcIk5vIGNoYXRzIHlldC4gU2VuZCBhIG1lc3NhZ2UgdG8gc3RhcnQuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gdGhpcy5tYWluQ29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby10aHJlYWQtbGlzdFwiIH0pO1xuXG4gICAgZm9yIChjb25zdCBzdW1tYXJ5IG9mIHRoaXMudGhyZWFkcykge1xuICAgICAgY29uc3QgaXRlbSA9IGxpc3QuY3JlYXRlRGl2KHsgY2xzOiBcIm1vaGlvLXRocmVhZC1pdGVtXCIgfSk7XG4gICAgICBpdGVtLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby10aHJlYWQtaXRlbS10aXRsZVwiLCB0ZXh0OiBzdW1tYXJ5LnRpdGxlIH0pO1xuICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuc2hvd1RocmVhZFZpZXcoc3VtbWFyeS5pZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck1lc3NhZ2VzKHRyYW5zY3JpcHRFbDogSFRNTEVsZW1lbnQsIHRocmVhZDogQXNzaXN0YW50VGhyZWFkKSB7XG4gICAgdHJhbnNjcmlwdEVsLmVtcHR5KCk7XG5cbiAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgdGhyZWFkLm1lc3NhZ2VzKSB7XG4gICAgICBjb25zdCBtc2dFbCA9IHRyYW5zY3JpcHRFbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IGBtb2hpby1tZXNzYWdlIG1vaGlvLW1lc3NhZ2UtLSR7bWVzc2FnZS5yb2xlfWAsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IG1zZ0VsLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby1tZXNzYWdlLWNvbnRlbnRcIiB9KTtcbiAgICAgIGNvbnRlbnRFbC5zZXRUZXh0KG1lc3NhZ2UuY29udGVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRocmVhZC5zdGF0dXMgPT09IFwiZXJyb3JcIiAmJiB0aHJlYWQuZXJyb3JNZXNzYWdlKSB7XG4gICAgICB0cmFuc2NyaXB0RWwuY3JlYXRlRGl2KHsgY2xzOiBcIm1vaGlvLWVycm9yLW1lc3NhZ2VcIiwgdGV4dDogdGhyZWFkLmVycm9yTWVzc2FnZSB9KTtcbiAgICB9XG5cbiAgICAvLyBUaGlua2luZyBpbmRpY2F0b3I6IHNob3cgd2hlbiBydW5uaW5nIGFuZCBsYXN0IGFzc2lzdGFudCBtZXNzYWdlIGhhcyBubyBjb250ZW50XG4gICAgY29uc3QgbGFzdE1zZyA9IHRocmVhZC5tZXNzYWdlc1t0aHJlYWQubWVzc2FnZXMubGVuZ3RoIC0gMV07XG4gICAgY29uc3QgaXNUaGlua2luZyA9XG4gICAgICB0aHJlYWQuc3RhdHVzID09PSBcInJ1bm5pbmdcIiAmJlxuICAgICAgKCFsYXN0TXNnIHx8IChsYXN0TXNnLnJvbGUgPT09IFwiYXNzaXN0YW50XCIgJiYgbGFzdE1zZy5jb250ZW50LnRyaW0oKSA9PT0gXCJcIikpO1xuXG4gICAgaWYgKGlzVGhpbmtpbmcpIHtcbiAgICAgIHRyYW5zY3JpcHRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tdGhpbmtpbmdcIiwgdGV4dDogXCJUaGlua2luZ1x1MjAyNlwiIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVGhyZWFkKCkge1xuICAgIGNvbnN0IHRocmVhZCA9IHRoaXMuYWN0aXZlVGhyZWFkO1xuICAgIGlmICghdGhyZWFkIHx8IHRoaXMudmlld01vZGUgIT09IFwidGhyZWFkXCIpIHJldHVybjtcblxuICAgIC8vIElmIHRoZSBoZWFkZXIgYWxyZWFkeSBleGlzdHMsIG9ubHkgcmUtcmVuZGVyIHRoZSB0cmFuc2NyaXB0XG4gICAgY29uc3QgZXhpc3RpbmdUcmFuc2NyaXB0ID0gdGhpcy5tYWluQ29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXCIubW9oaW8tdHJhbnNjcmlwdFwiKTtcbiAgICBpZiAoZXhpc3RpbmdUcmFuc2NyaXB0KSB7XG4gICAgICB0aGlzLnJlbmRlck1lc3NhZ2VzKGV4aXN0aW5nVHJhbnNjcmlwdCBhcyBIVE1MRWxlbWVudCwgdGhyZWFkKTtcbiAgICAgIChleGlzdGluZ1RyYW5zY3JpcHQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcCA9IChleGlzdGluZ1RyYW5zY3JpcHQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbEhlaWdodDtcblxuICAgICAgLy8gVXBkYXRlIGhlYWRlciB0aXRsZVxuICAgICAgY29uc3QgdGl0bGVFbCA9IHRoaXMubWFpbkNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiLm1vaGlvLXRocmVhZC10aXRsZVwiKTtcbiAgICAgIGlmICh0aXRsZUVsKSB0aXRsZUVsLnRleHRDb250ZW50ID0gdGhyZWFkLnRpdGxlO1xuXG4gICAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLm1haW5Db250ZW50RWwuZW1wdHkoKTtcblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMubWFpbkNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tdGhyZWFkLWhlYWRlclwiIH0pO1xuXG4gICAgY29uc3QgYmFja0J0biA9IGhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJtb2hpby1pY29uLWJ0blwiIH0pO1xuICAgIHNldEljb24oYmFja0J0biwgXCJhcnJvdy1sZWZ0XCIpO1xuICAgIGJhY2tCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBcIkJhY2sgdG8gY2hhdCBsaXN0XCIpO1xuICAgIGJhY2tCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdm9pZCB0aGlzLnNob3dMaXN0VmlldygpOyB9KTtcblxuICAgIGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tdGhyZWFkLXRpdGxlXCIsIHRleHQ6IHRocmVhZC50aXRsZSB9KTtcblxuICAgIGNvbnN0IG1lbnVCdG4gPSBoZWFkZXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwibW9oaW8taWNvbi1idG5cIiB9KTtcbiAgICBzZXRJY29uKG1lbnVCdG4sIFwibW9yZS1ob3Jpem9udGFsXCIpO1xuICAgIG1lbnVCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBcIkNoYXQgYWN0aW9uc1wiKTtcbiAgICBtZW51QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMub3BlblRocmVhZE1lbnUobWVudUJ0biwgdGhyZWFkKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRyYW5zY3JpcHRFbCA9IHRoaXMubWFpbkNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tdHJhbnNjcmlwdFwiIH0pO1xuICAgIHRoaXMucmVuZGVyTWVzc2FnZXModHJhbnNjcmlwdEVsLCB0aHJlYWQpO1xuICAgIHRyYW5zY3JpcHRFbC5zY3JvbGxUb3AgPSB0cmFuc2NyaXB0RWwuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgdGhpcy51cGRhdGVDb21wb3NlclN0YXRlKCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgVGhyZWFkIG1lbnUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBvcGVuVGhyZWFkTWVudShhbmNob3I6IEhUTUxFbGVtZW50LCB0aHJlYWQ6IEFzc2lzdGFudFRocmVhZCkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5tb2hpby10aHJlYWQtbWVudVwiKTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnJlbW92ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG1lbnUuY2xhc3NOYW1lID0gXCJtb2hpby10aHJlYWQtbWVudVwiO1xuXG4gICAgY29uc3QgYWRkSXRlbSA9IChsYWJlbDogc3RyaW5nLCBoYW5kbGVyOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gbWVudS5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tdGhyZWFkLW1lbnUtaXRlbVwiIH0pO1xuICAgICAgaXRlbS5zZXRUZXh0KGxhYmVsKTtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgbWVudS5yZW1vdmUoKTtcbiAgICAgICAgaGFuZGxlcigpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFkZEl0ZW0oXCJOZXcgQ2hhdFwiLCAoKSA9PiB7IHZvaWQgdGhpcy5zdGFydE5ld0NoYXQoKTsgfSk7XG4gICAgYWRkSXRlbShcIlJlbmFtZSBDaGF0XCIsICgpID0+IHsgdm9pZCB0aGlzLnJlbmFtZUNoYXQodGhyZWFkKTsgfSk7XG4gICAgYWRkSXRlbShcIkRlbGV0ZSBDaGF0XCIsICgpID0+IHsgdm9pZCB0aGlzLmRlbGV0ZUNoYXQodGhyZWFkKTsgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1lbnUpO1xuXG4gICAgLy8gUG9zaXRpb24gYmVsb3cgYW5jaG9yXG4gICAgY29uc3QgcmVjdCA9IGFuY2hvci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBtZW51LnN0eWxlLnRvcCA9IGAke3JlY3QuYm90dG9tICsgNH1weGA7XG4gICAgbWVudS5zdHlsZS5yaWdodCA9IGAke3dpbmRvdy5pbm5lcldpZHRoIC0gcmVjdC5yaWdodH1weGA7XG5cbiAgICBjb25zdCBkaXNtaXNzID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgIGlmICghbWVudS5jb250YWlucyhlLnRhcmdldCBhcyBOb2RlKSkge1xuICAgICAgICBtZW51LnJlbW92ZSgpO1xuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGRpc21pc3MpO1xuICAgICAgfVxuICAgIH07XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBkaXNtaXNzKTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBDaGF0IGFjdGlvbnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbiAgcHJpdmF0ZSBhc3luYyBzdGFydE5ld0NoYXQoaW5pdGlhbENvbnRlbnQ/OiBzdHJpbmcpIHtcbiAgICBjb25zdCB0aHJlYWQgPSBhd2FpdCB0aGlzLnJ1bnRpbWUuY3JlYXRlVGhyZWFkKHsgd29ya3NwYWNlUGF0aDogdGhpcy52YXVsdFBhdGggfSk7XG4gICAgdGhpcy5hY3RpdmVUaHJlYWQgPSB0aHJlYWQ7XG4gICAgdGhpcy52aWV3TW9kZSA9IFwidGhyZWFkXCI7XG4gICAgdGhpcy5yZW5kZXJUaHJlYWQoKTtcbiAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcblxuICAgIGlmIChpbml0aWFsQ29udGVudCkge1xuICAgICAgYXdhaXQgdGhpcy5kaXNwYXRjaE1lc3NhZ2UoaW5pdGlhbENvbnRlbnQsIHRocmVhZC5pZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZW5hbWVDaGF0KHRocmVhZDogQXNzaXN0YW50VGhyZWFkKSB7XG4gICAgY29uc3QgbW9kYWwgPSBuZXcgUHJvbXB0TW9kYWwodGhpcy5hcHAsIFwiUmVuYW1lIGNoYXRcIiwgdGhyZWFkLnRpdGxlKTtcbiAgICBjb25zdCBuZXdUaXRsZSA9IGF3YWl0IG1vZGFsLm9wZW4oKTtcbiAgICBpZiAoIW5ld1RpdGxlKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5ydW50aW1lLnJlbmFtZVRocmVhZCh7XG4gICAgICAgIHRocmVhZElkOiB0aHJlYWQuaWQsXG4gICAgICAgIHRpdGxlOiBuZXdUaXRsZSxcbiAgICAgICAgd29ya3NwYWNlUGF0aDogdGhpcy52YXVsdFBhdGgsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbmV3IE5vdGljZShnZXRFcnJvck1lc3NhZ2UoZXJyb3IpKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbGV0ZUNoYXQodGhyZWFkOiBBc3Npc3RhbnRUaHJlYWQpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5ydW50aW1lLmRlbGV0ZVRocmVhZCh7XG4gICAgICAgIHRocmVhZElkOiB0aHJlYWQuaWQsXG4gICAgICAgIHdvcmtzcGFjZVBhdGg6IHRoaXMudmF1bHRQYXRoLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIG5ldyBOb3RpY2UoZ2V0RXJyb3JNZXNzYWdlKGVycm9yKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMuc2hvd0xpc3RWaWV3KCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgRm9vdGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYnVpbGRGb290ZXIoKSB7XG4gICAgdGhpcy5mb290ZXJFbC5lbXB0eSgpO1xuXG4gICAgY29uc3QgcXVpY2tBY3Rpb25zID0gdGhpcy5mb290ZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwibW9oaW8tcXVpY2stYWN0aW9uc1wiIH0pO1xuXG4gICAgY29uc3Qgc3VtbWFyaXNlQnRuID0gcXVpY2tBY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJtb2hpby1xdWljay1hY3Rpb24tcGlsbFwiLFxuICAgICAgdGV4dDogXCJTdW1tYXJpc2UgZG9jdW1lbnRcIixcbiAgICB9KTtcbiAgICBzdW1tYXJpc2VCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5zZW5kUXVpY2tBY3Rpb24oXCJTdW1tYXJpc2UgZG9jdW1lbnRcIik7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpbXByb3ZlQnRuID0gcXVpY2tBY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogXCJtb2hpby1xdWljay1hY3Rpb24tcGlsbFwiLFxuICAgICAgdGV4dDogXCJJbXByb3ZlIGRvY3VtZW50XCIsXG4gICAgfSk7XG4gICAgaW1wcm92ZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgdm9pZCB0aGlzLnNlbmRRdWlja0FjdGlvbihcIkltcHJvdmUgZG9jdW1lbnRcIik7XG4gICAgfSk7XG5cbiAgICBjb25zdCBjb21wb3NlcldyYXBwZXIgPSB0aGlzLmZvb3RlckVsLmNyZWF0ZURpdih7IGNsczogXCJtb2hpby1jb21wb3NlclwiIH0pO1xuXG4gICAgdGhpcy5jb21wb3NlclRleHRhcmVhID0gY29tcG9zZXJXcmFwcGVyLmNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuICAgICAgY2xzOiBcIm1vaGlvLWNvbXBvc2VyLXRleHRhcmVhXCIsXG4gICAgICBhdHRyOiB7IHJvd3M6IFwiMVwiLCBwbGFjZWhvbGRlcjogXCJBc2sgQ29kZXhcdTIwMjZcIiB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5jb21wb3NlclRleHRhcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmF1dG9Hcm93VGV4dGFyZWEoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9zZXJUZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgICAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIHRoaXMuaGFuZGxlU2VuZCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5zZW5kQnRuID0gY29tcG9zZXJXcmFwcGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1vaGlvLXNlbmQtYnRuXCIgfSk7XG4gICAgc2V0SWNvbih0aGlzLnNlbmRCdG4sIFwic2VuZFwiKTtcbiAgICB0aGlzLnNlbmRCdG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBcIlNlbmQgbWVzc2FnZVwiKTtcbiAgICB0aGlzLnNlbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHsgdm9pZCB0aGlzLmhhbmRsZVNlbmQoKTsgfSk7XG5cbiAgICB0aGlzLnVwZGF0ZUNvbXBvc2VyU3RhdGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXV0b0dyb3dUZXh0YXJlYSgpIHtcbiAgICBjb25zdCBlbCA9IHRoaXMuY29tcG9zZXJUZXh0YXJlYTtcbiAgICBlbC5zdHlsZS5oZWlnaHQgPSBcImF1dG9cIjtcbiAgICBjb25zdCBsaW5lSGVpZ2h0ID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZShlbCkubGluZUhlaWdodCkgfHwgMjA7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gbGluZUhlaWdodCAqIDUgKyAxNjsgLy8gNSBsaW5lcyArIHBhZGRpbmdcbiAgICBlbC5zdHlsZS5oZWlnaHQgPSBgJHtNYXRoLm1pbihlbC5zY3JvbGxIZWlnaHQsIG1heEhlaWdodCl9cHhgO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDb21wb3NlclN0YXRlKCkge1xuICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgIGNvbnN0IGhhc0RvY3VtZW50ID0gYWN0aXZlRmlsZSAhPT0gbnVsbDtcbiAgICBjb25zdCBpc1J1bm5pbmcgPSB0aGlzLmFjdGl2ZVRocmVhZD8uc3RhdHVzID09PSBcInJ1bm5pbmdcIjtcbiAgICBjb25zdCBkaXNhYmxlZCA9ICFoYXNEb2N1bWVudCB8fCBpc1J1bm5pbmc7XG5cbiAgICB0aGlzLmNvbXBvc2VyVGV4dGFyZWEuZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICB0aGlzLnNlbmRCdG4uZGlzYWJsZWQgPSBkaXNhYmxlZDtcbiAgICB0aGlzLmNvbXBvc2VyVGV4dGFyZWEucGxhY2Vob2xkZXIgPSBoYXNEb2N1bWVudFxuICAgICAgPyBcIkFzayBDb2RleFx1MjAyNlwiXG4gICAgICA6IFwiT3BlbiBhIG5vdGUgdG8gc3RhcnQgY2hhdHRpbmdcIjtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTZW5kaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlU2VuZCgpIHtcbiAgICBjb25zdCBjb250ZW50ID0gdGhpcy5jb21wb3NlclRleHRhcmVhLnZhbHVlO1xuICAgIGlmICghY29udGVudC50cmltKCkpIHJldHVybjtcblxuICAgIHRoaXMuY29tcG9zZXJUZXh0YXJlYS52YWx1ZSA9IFwiXCI7XG4gICAgdGhpcy5hdXRvR3Jvd1RleHRhcmVhKCk7XG5cbiAgICBpZiAodGhpcy52aWV3TW9kZSA9PT0gXCJsaXN0XCIpIHtcbiAgICAgIGF3YWl0IHRoaXMuc3RhcnROZXdDaGF0KGNvbnRlbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5hY3RpdmVUaHJlYWQpIHtcbiAgICAgIGF3YWl0IHRoaXMuc3RhcnROZXdDaGF0KGNvbnRlbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuZGlzcGF0Y2hNZXNzYWdlKGNvbnRlbnQsIHRoaXMuYWN0aXZlVGhyZWFkLmlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZFF1aWNrQWN0aW9uKHByb21wdDogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMudmlld01vZGUgPT09IFwibGlzdFwiKSB7XG4gICAgICBhd2FpdCB0aGlzLnN0YXJ0TmV3Q2hhdChwcm9tcHQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5hY3RpdmVUaHJlYWQpIHtcbiAgICAgIGF3YWl0IHRoaXMuc3RhcnROZXdDaGF0KHByb21wdCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5kaXNwYXRjaE1lc3NhZ2UocHJvbXB0LCB0aGlzLmFjdGl2ZVRocmVhZC5pZCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRpc3BhdGNoTWVzc2FnZShjb250ZW50OiBzdHJpbmcsIHRocmVhZElkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhY3RpdmVWaWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICBpZiAoIWFjdGl2ZVZpZXcgfHwgIWFjdGl2ZVZpZXcuZmlsZSkge1xuICAgICAgbmV3IE5vdGljZShcIk9wZW4gYSBub3RlIGZpcnN0IHRvIHByb3ZpZGUgZG9jdW1lbnQgY29udGV4dC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGFjdGl2ZVZpZXcuZmlsZTtcbiAgICBjb25zdCBkb2N1bWVudFRpdGxlID0gZmlsZS5iYXNlbmFtZTtcbiAgICBjb25zdCBkb2N1bWVudFJlbGF0aXZlUGF0aCA9IGZpbGUucGF0aDtcbiAgICBjb25zdCBkb2N1bWVudE1hcmtkb3duID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcblxuICAgIHRoaXMudXBkYXRlQ29tcG9zZXJTdGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIGRvY3VtZW50TWFya2Rvd24sXG4gICAgICAgIGRvY3VtZW50UmVsYXRpdmVQYXRoLFxuICAgICAgICBkb2N1bWVudFRpdGxlLFxuICAgICAgICB0aHJlYWRJZCxcbiAgICAgICAgd29ya3NwYWNlTmFtZTogdGhpcy52YXVsdE5hbWUsXG4gICAgICAgIHdvcmtzcGFjZVBhdGg6IHRoaXMudmF1bHRQYXRoLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIG5ldyBOb3RpY2UoZ2V0RXJyb3JNZXNzYWdlKGVycm9yKSk7XG4gICAgfVxuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBQbHVnaW4gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vaGlvQUlBc3Npc3RhbmNlUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgcHJpdmF0ZSBydW50aW1lOiBBc3Npc3RhbnRSdW50aW1lIHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGNvbnN0IHZhdWx0UGF0aCA9IHRoaXMuZ2V0VmF1bHRQYXRoKCk7XG4gICAgY29uc3QgdmF1bHROYW1lID0gdGhpcy5hcHAudmF1bHQuZ2V0TmFtZSgpO1xuXG4gICAgdGhpcy5ydW50aW1lID0gY3JlYXRlQXNzaXN0YW50UnVudGltZSgpO1xuICAgIGNvbnN0IHJ1bnRpbWUgPSB0aGlzLnJ1bnRpbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfQVNTSVNUQU5ULCAobGVhZikgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBBc3Npc3RhbnRWaWV3KGxlYWYsIHJ1bnRpbWUsIHZhdWx0UGF0aCwgdmF1bHROYW1lKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImJvdFwiLCBcIk9wZW4gQUkgQXNzaXN0YW5jZVwiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1haS1hc3Npc3RhbmNlXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gQUkgYXNzaXN0YW5jZSBwYW5lbFwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHsgdm9pZCB0aGlzLmFjdGl2YXRlVmlldygpOyB9LFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgb251bmxvYWQoKSB7XG4gICAgdGhpcy5ydW50aW1lPy5kaXNwb3NlKCk7XG4gICAgdGhpcy5ydW50aW1lID0gbnVsbDtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9BU1NJU1RBTlQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfQVNTSVNUQU5UKVswXTtcblxuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpID8/IHdvcmtzcGFjZS5nZXRMZWFmKHRydWUpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBWSUVXX1RZUEVfQVNTSVNUQU5ULCBhY3RpdmU6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBwcml2YXRlIGdldFZhdWx0UGF0aCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSB0aGlzLmFwcC52YXVsdC5hZGFwdGVyO1xuICAgIGlmIChhZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXIpIHtcbiAgICAgIHJldHVybiBhZGFwdGVyLmdldEJhc2VQYXRoKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmFwcC52YXVsdC5nZXROYW1lKCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0JBVU87QUFDUCwyQkFBMkQ7QUFDM0Qsc0JBQWdDO0FBSWhDLElBQU0sc0JBQXNCO0FBRTVCLElBQU0saUNBQWlDO0FBQUEsRUFDckM7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLEVBQUUsS0FBSyxJQUFJO0FBRVgsSUFBTSxvQkFBb0I7QUFDMUIsSUFBTSxxQkFBcUI7QUFDM0IsSUFBTSxpQ0FBaUM7QUFDdkMsSUFBTSxvQ0FBb0M7QUEwSDFDLFNBQVMseUJBQTJDO0FBQ2xELFFBQU0sV0FBVyxNQUFNLEdB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
