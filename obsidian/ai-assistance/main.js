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
  console.log("[Mohio] AssistantRuntime: Creating...");
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = () => (/* @__PURE__ */ new Date()).toISOString();
  const listeners = /* @__PURE__ */ new Set();
  const threadStates = /* @__PURE__ */ new Map();
  let connectionPromise = null;
  let childProcess = null;
  const emit = (event) => {
    console.log("[Mohio] Emitting event:", event.type);
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
      console.log("[Mohio] GetConnection: Creating new connection...");
      connectionPromise = createServerConnection({
        onChildProcess: (child) => {
          childProcess = child;
        },
        onExit: (errorMessage) => {
          console.error("[Mohio] Server connection closed:", errorMessage);
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
          console.log("[Mohio] Received notification:", notification.method);
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
    console.log("[Mohio] ListThreads: Fetching from", workspacePath);
    try {
      const connection = await getConnection();
      let nextCursor = null;
      const threads = [];
      do {
        console.log("[Mohio] ListThreads: Requesting page, cursor:", nextCursor);
        const response = await connection.request("thread/list", {
          archived: false,
          cursor: nextCursor,
          cwd: workspacePath,
          sortKey: "updated_at"
        });
        console.log("[Mohio] ListThreads: Got", response.data.length, "threads");
        for (const thread of response.data) {
          threads.push(mapCodexThreadToSummary(thread));
        }
        nextCursor = response.nextCursor;
      } while (nextCursor);
      console.log("[Mohio] ListThreads: Total threads:", threads.length);
      return threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (error) {
      console.error("[Mohio] ListThreads error:", error);
      throw error;
    }
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
  console.log("[Mohio] CreateServerConnection: Spawning codex app-server...");
  const child = (0, import_child_process.spawn)("codex", ["app-server"], {
    stdio: "pipe"
  });
  console.log("[Mohio] CreateServerConnection: Child process spawned, pid:", child.pid);
  onChildProcess(child);
  const stdoutReader = (0, import_readline.createInterface)({ input: child.stdout });
  const stderrReader = (0, import_readline.createInterface)({ input: child.stderr });
  let nextRequestId = 1;
  const pendingRequests = /* @__PURE__ */ new Map();
  const connection = {
    request: (method, params) => new Promise((resolve, reject) => {
      const requestId = nextRequestId++;
      console.log("[Mohio] Sending RPC:", method, "id:", requestId);
      pendingRequests.set(requestId, {
        resolve: (value) => resolve(value),
        reject
      });
      const request = { id: requestId, method, params };
      child.stdin.write(`${JSON.stringify(request)}
`);
    })
  };
  child.on("close", (code) => {
    console.error("[Mohio] Child process closed with code:", code);
    stdoutReader.close();
    stderrReader.close();
    for (const pending of pendingRequests.values()) {
      pending.reject(new Error("Mohio lost its connection to Codex."));
    }
    pendingRequests.clear();
    onExit("Mohio lost its connection to the installed Codex app server.");
  });
  child.on("error", (err) => {
    console.error("[Mohio] Child process error:", err.message);
    onExit(`Failed to start Codex: ${err.message}`);
  });
  stdoutReader.on("line", (line) => {
    var _a;
    const parsed = parseJsonLine(line);
    if (!parsed) {
      console.log("[Mohio] Unparseable line:", line.substring(0, 80));
      return;
    }
    if (typeof parsed.id === "number") {
      console.log("[Mohio] RPC response received, id:", parsed.id);
      const pending = pendingRequests.get(parsed.id);
      if (!pending) {
        console.warn("[Mohio] No pending request for id:", parsed.id);
        return;
      }
      pendingRequests.delete(parsed.id);
      if (parsed.error) {
        console.error("[Mohio] RPC error:", parsed.error.message);
        pending.reject(new Error((_a = parsed.error.message) != null ? _a : "Codex returned an unknown error."));
        return;
      }
      pending.resolve(parsed.result);
      return;
    }
    if (typeof parsed.method === "string") {
      console.log("[Mohio] RPC notification:", parsed.method);
      onNotification(parsed);
    }
  });
  stderrReader.on("line", (line) => {
    console.log("[Mohio] Codex stderr:", line);
  });
  return connection.request("initialize", {
    capabilities: {
      experimentalApi: true,
      optOutNotificationMethods: null
    },
    clientInfo: { name: "mohio", title: "Mohio", version: "0.1.0" }
  }).then(() => {
    console.log("[Mohio] CreateServerConnection: Initialized successfully");
    return connection;
  }).catch((err) => {
    console.error("[Mohio] CreateServerConnection: Initialize failed:", err);
    child.kill();
    throw err;
  });
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
    console.log("[Mohio] AssistantView.onOpen: Starting...");
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mohio-assistant-container");
    this.panelEl = contentEl.createDiv({ cls: "mohio-panel" });
    this.mainContentEl = this.panelEl.createDiv({ cls: "mohio-main-content" });
    this.footerEl = this.panelEl.createDiv({ cls: "mohio-footer" });
    this.buildFooter();
    this.unsubscribeRuntime = this.runtime.onEvent((event) => {
      var _a, _b, _c;
      console.log("[Mohio] Runtime event received:", event.type);
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
    console.log("[Mohio] AssistantView.onOpen: Showing list view...");
    await this.showListView();
    console.log("[Mohio] AssistantView.onOpen: Complete");
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
    console.log("[Mohio] ShowListView: Starting...");
    this.viewMode = "list";
    this.activeThread = null;
    this.isLoadingThreads = true;
    this.renderList();
    try {
      console.log("[Mohio] ShowListView: Calling listThreads...");
      this.threads = await this.runtime.listThreads({ workspacePath: this.vaultPath });
      console.log("[Mohio] ShowListView: Got", this.threads.length, "threads");
    } catch (error) {
      console.error("[Mohio] ShowListView: Error listing threads:", error);
      this.threads = [];
    } finally {
      this.isLoadingThreads = false;
    }
    this.renderList();
    this.updateComposerState();
    console.log("[Mohio] ShowListView: Complete");
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
    console.log("[Mohio] Plugin.onload: Starting...");
    const vaultPath = this.getVaultPath();
    const vaultName = this.app.vault.getName();
    console.log("[Mohio] Vault path:", vaultPath);
    console.log("[Mohio] Vault name:", vaultName);
    this.runtime = createAssistantRuntime();
    const runtime = this.runtime;
    this.registerView(VIEW_TYPE_ASSISTANT, (leaf) => {
      console.log("[Mohio] Creating AssistantView...");
      return new AssistantView(leaf, runtime, vaultPath, vaultName);
    });
    this.addRibbonIcon("bot", "Open AI Assistance", () => {
      console.log("[Mohio] Ribbon icon clicked");
      void this.activateView();
    });
    this.addCommand({
      id: "open-ai-assistance",
      name: "Open AI assistance panel",
      callback: () => {
        console.log("[Mohio] Command executed");
        void this.activateView();
      }
    });
    console.log("[Mohio] Plugin.onload: Complete");
  }
  async onunload() {
    var _a;
    console.log("[Mohio] Plugin.onunload: Cleaning up...");
    (_a = this.runtime) == null ? void 0 : _a.dispose();
    this.runtime = null;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_ASSISTANT);
    console.log("[Mohio] Plugin.onunload: Complete");
  }
  async activateView() {
    var _a;
    console.log("[Mohio] ActivateView: Starting...");
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_ASSISTANT)[0];
    if (!leaf) {
      console.log("[Mohio] Creating new leaf...");
      leaf = (_a = workspace.getRightLeaf(false)) != null ? _a : workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_ASSISTANT, active: true });
    }
    workspace.revealLeaf(leaf);
    console.log("[Mohio] ActivateView: Complete");
  }
  getVaultPath() {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof import_obsidian.FileSystemAdapter) {
      return adapter.getBasePath();
    }
    return this.app.vault.getName();
  }
};
