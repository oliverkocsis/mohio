import {
  App,
  FileSystemAdapter,
  ItemView,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  WorkspaceLeaf,
  setIcon,
} from "obsidian";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { createInterface } from "readline";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEW_TYPE_ASSISTANT = "mohio-ai-assistance";

const DEFAULT_ASSISTANT_INSTRUCTIONS = [
  "You are Codex embedded inside Mohio, a local-first Markdown workspace for small teams.",
  "Work as a chat-first assistant for a Markdown knowledgebase.",
  "Treat the active document as the primary context and the wider workspace as supporting context.",
  "You may inspect the rest of the workspace when useful.",
  "Do not make file edits, propose patches, or claim to have changed files in this environment.",
  "Return concise, practical answers that fit a document-first workflow.",
].join("\n");

const MOHIO_PROMPT_OPEN = "[MOHIO_USER_REQUEST]";
const MOHIO_PROMPT_CLOSE = "[/MOHIO_USER_REQUEST]";
const TURN_START_MAX_ROLLOUT_RETRIES = 3;
const TURN_START_ROLLOUT_RETRY_DELAY_MS = 120;

// ─── Types ────────────────────────────────────────────────────────────────────

type AssistantRunStatus = "idle" | "running" | "error";

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface AssistantThread {
  id: string;
  title: string;
  preview: string;
  messages: AssistantMessage[];
  status: AssistantRunStatus;
  workspacePath: string;
  errorMessage: string | null;
}

interface AssistantThreadSummary {
  id: string;
  title: string;
  preview: string;
  status: AssistantRunStatus;
  createdAt: string;
  updatedAt: string;
}

type AssistantEvent =
  | { type: "thread"; workspacePath: string; thread: AssistantThread }
  | { type: "thread-list"; workspacePath: string; threads: AssistantThreadSummary[] };

interface SendAssistantMessageInput {
  threadId: string;
  content: string;
  documentTitle: string;
  documentRelativePath: string;
  documentMarkdown: string;
  workspaceName: string;
  workspacePath: string;
}

// ─── Codex internal types ─────────────────────────────────────────────────────

interface JsonRpcRequest {
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  id?: number;
  result?: unknown;
  error?: { code?: number; message?: string };
  method?: string;
  params?: unknown;
}

interface CodexThread {
  id: string;
  preview: string;
  name: string | null;
  cwd: string;
  createdAt: number;
  updatedAt: number;
  status: unknown;
  turns: CodexTurn[];
}

interface CodexTurn {
  id: string;
  items: CodexThreadItem[];
}

type CodexThreadItem =
  | CodexAgentMessageItem
  | CodexUserMessageItem
  | { type: string; id: string };

interface CodexAgentMessageItem {
  type: "agentMessage";
  id: string;
  text: string;
}

interface CodexUserMessageItem {
  type: "userMessage";
  id: string;
  content: CodexUserInput[];
}

type CodexUserInput = { type: "text"; text: string } | { type: string };

interface AssistantServerConnection {
  request: <T>(method: string, params?: unknown) => Promise<T>;
}

interface AssistantThreadState {
  assistantMessageId: string | null;
  isTurnReady: boolean;
  thread: AssistantThread;
  turnId: string | null;
}

// ─── AssistantRuntime ─────────────────────────────────────────────────────────

interface AssistantRuntime {
  cancelRun: (input: { threadId: string; workspacePath: string }) => Promise<void>;
  createThread: (input: { workspacePath: string }) => Promise<AssistantThread>;
  deleteThread: (input: { threadId: string; workspacePath: string }) => Promise<void>;
  getThread: (input: { threadId: string; workspacePath: string }) => Promise<AssistantThread>;
  listThreads: (input: { workspacePath: string }) => Promise<AssistantThreadSummary[]>;
  onEvent: (listener: (event: AssistantEvent) => void) => () => void;
  renameThread: (input: { threadId: string; title: string; workspacePath: string }) => Promise<void>;
  sendMessage: (input: SendAssistantMessageInput) => Promise<AssistantThread>;
  dispose: () => void;
}

function createAssistantRuntime(): AssistantRuntime {
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const now = () => new Date().toISOString();
  const listeners = new Set<(event: AssistantEvent) => void>();
  const threadStates = new Map<string, AssistantThreadState>();
  let connectionPromise: Promise<AssistantServerConnection> | null = null;
  let childProcess: ChildProcessWithoutNullStreams | null = null;

  const emit = (event: AssistantEvent) => {
    for (const listener of listeners) {
      listener(event);
    }
  };

  const emitThread = (threadId: string) => {
    const threadState = threadStates.get(threadId);
    if (!threadState) return;
    emit({
      type: "thread",
      workspacePath: threadState.thread.workspacePath,
      thread: cloneThread(threadState.thread),
    });
  };

  const emitThreadList = async (workspacePath: string) => {
    try {
      const threads = await listThreads({ workspacePath });
      emit({ type: "thread-list", workspacePath, threads });
    } catch {
      // Keep list refresh failures local to explicit API calls.
    }
  };

  const getConnection = () => {
    if (!connectionPromise) {
      connectionPromise = createServerConnection({
        onChildProcess: (child) => { childProcess = child; },
        onExit: (errorMessage) => {
          for (const [threadId, threadState] of threadStates.entries()) {
            if (threadState.thread.status !== "running") continue;
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
            threadStates,
          });
        },
      });
    }
    return connectionPromise;
  };

  const cacheThread = (
    thread: AssistantThread,
    options: { isTurnReady?: boolean } = {},
  ) => {
    const existingState = threadStates.get(thread.id);
    threadStates.set(thread.id, {
      assistantMessageId: existingState?.assistantMessageId ?? null,
      isTurnReady: options.isTurnReady ?? existingState?.isTurnReady ?? false,
      thread,
      turnId: existingState?.turnId ?? null,
    });
  };

  const ensureLoadedThread = async ({
    threadId,
    workspacePath,
  }: {
    threadId: string;
    workspacePath: string;
  }) => {
    const connection = await getConnection();
    const threadState = threadStates.get(threadId);

    if (threadState?.thread.workspacePath === workspacePath && threadState.isTurnReady) {
      return threadState.thread;
    }

    const response = await connection.request<{ thread: CodexThread }>("thread/resume", {
      approvalPolicy: "never",
      cwd: workspacePath,
      developerInstructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
      persistExtendedHistory: true,
      sandbox: "read-only",
      threadId,
    });
    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath,
    });
    cacheThread(assistantThread, { isTurnReady: true });
    return assistantThread;
  };

  const listThreads = async ({
    workspacePath,
  }: {
    workspacePath: string;
  }): Promise<AssistantThreadSummary[]> => {
    const connection = await getConnection();
    let nextCursor: string | null = null;
    const threads: AssistantThreadSummary[] = [];

    do {
      const response: { data: CodexThread[]; nextCursor: string | null } =
        await connection.request("thread/list", {
          archived: false,
          cursor: nextCursor,
          cwd: workspacePath,
          sortKey: "updated_at",
        });
      for (const thread of response.data) {
        threads.push(mapCodexThreadToSummary(thread));
      }
      nextCursor = response.nextCursor;
    } while (nextCursor);

    return threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  };

  const createThread = async ({
    workspacePath,
  }: {
    workspacePath: string;
  }): Promise<AssistantThread> => {
    const connection = await getConnection();
    const response = await connection.request<{ thread: CodexThread }>("thread/start", {
      approvalPolicy: "never",
      cwd: workspacePath,
      developerInstructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
      ephemeral: false,
      experimentalRawEvents: false,
      persistExtendedHistory: true,
      sandbox: "read-only",
    });
    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath,
    });
    cacheThread(assistantThread, { isTurnReady: true });
    void emitThreadList(workspacePath);
    emitThread(assistantThread.id);
    return cloneThread(assistantThread);
  };

  const getThread = async ({
    threadId,
    workspacePath,
  }: {
    threadId: string;
    workspacePath: string;
  }): Promise<AssistantThread> => {
    const connection = await getConnection();
    let response: { thread: CodexThread };

    try {
      response = await connection.request<{ thread: CodexThread }>("thread/read", {
        includeTurns: true,
        threadId,
      });
    } catch (error) {
      if (!isUnmaterializedThreadReadError(error)) throw error;
      response = await connection.request<{ thread: CodexThread }>("thread/read", {
        includeTurns: false,
        threadId,
      });
    }

    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath,
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
    workspacePath,
  }: SendAssistantMessageInput): Promise<AssistantThread> => {
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

    const userMessage: AssistantMessage = {
      id: createId(),
      role: "user",
      content: trimmedContent,
      createdAt: now(),
    };
    const assistantMessage: AssistantMessage = {
      id: createId(),
      role: "assistant",
      content: "",
      createdAt: now(),
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
              workspacePath,
            }),
            text_elements: [],
            type: "text" as const,
          },
        ],
        threadId,
      };

      let response: { turn: { id: string } } | null = null;
      let rolloutRetryCount = 0;

      while (!response) {
        try {
          response = await connection.request<{ turn: { id: string } }>(
            "turn/start",
            turnStartParams,
          );
        } catch (error) {
          if (
            !isNoRolloutFoundError(error) ||
            rolloutRetryCount >= TURN_START_MAX_ROLLOUT_RETRIES
          ) {
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
    threadId,
  }: {
    threadId: string;
    workspacePath: string;
  }) => {
    const threadState = threadStates.get(threadId);
    if (!threadState?.turnId) return;
    const connection = await getConnection();
    const turnId = threadState.turnId;
    threadState.turnId = null;
    threadState.assistantMessageId = null;
    threadState.thread.errorMessage = null;
    threadState.thread.status = "idle";
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    await connection.request<Record<string, never>>("turn/interrupt", {
      threadId,
      turnId,
    });
  };

  const renameThread = async ({
    threadId,
    title,
    workspacePath,
  }: {
    threadId: string;
    title: string;
    workspacePath: string;
  }) => {
    const nextTitle = title.trim();
    if (!nextTitle) throw new Error("Enter a title before renaming this chat.");
    const connection = await getConnection();
    await connection.request<Record<string, never>>("thread/name/set", {
      name: nextTitle,
      threadId,
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
    workspacePath,
  }: {
    threadId: string;
    workspacePath: string;
  }) => {
    const connection = await getConnection();
    await connection.request<Record<string, never>>("thread/archive", { threadId });
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
      return () => { listeners.delete(listener); };
    },
    renameThread,
    sendMessage,
    dispose,
  };
}

function createServerConnection({
  onChildProcess,
  onExit,
  onNotification,
}: {
  onChildProcess: (child: ChildProcessWithoutNullStreams) => void;
  onExit: (errorMessage: string) => void;
  onNotification: (notification: JsonRpcResponse) => void;
}): Promise<AssistantServerConnection> {
  const child = spawn("codex", ["app-server"], {
    stdio: "pipe",
  });
  onChildProcess(child);

  const stdoutReader = createInterface({ input: child.stdout });
  const stderrReader = createInterface({ input: child.stderr });
  let nextRequestId = 1;
  const pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  >();

  const connection: AssistantServerConnection = {
    request: <T>(method: string, params?: unknown) =>
      new Promise<T>((resolve, reject) => {
        const requestId = nextRequestId++;
        pendingRequests.set(requestId, {
          resolve: (value) => resolve(value as T),
          reject,
        });
        const request: JsonRpcRequest = { id: requestId, method, params };
        child.stdin.write(`${JSON.stringify(request)}\n`);
      }),
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
    const parsed = parseJsonLine(line);
    if (!parsed) return;

    if (typeof parsed.id === "number") {
      const pending = pendingRequests.get(parsed.id);
      if (!pending) return;
      pendingRequests.delete(parsed.id);
      if (parsed.error) {
        pending.reject(new Error(parsed.error.message ?? "Codex returned an unknown error."));
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
    // app-server may emit diagnostics on stderr — structured stream is authoritative.
  });

  return connection
    .request<{ userAgent: string }>("initialize", {
      capabilities: {
        experimentalApi: true,
        optOutNotificationMethods: null,
      },
      clientInfo: { name: "mohio", title: "Mohio", version: "0.1.0" },
    })
    .then(() => connection);
}

function handleServerNotification({
  createId,
  emitThread,
  emitThreadList,
  now,
  notification,
  threadStates,
}: {
  createId: () => string;
  emitThread: (threadId: string) => void;
  emitThreadList: (workspacePath: string) => Promise<void>;
  now: () => string;
  notification: JsonRpcResponse;
  threadStates: Map<string, AssistantThreadState>;
}) {
  const params = isRecord(notification.params) ? notification.params : null;
  if (!params || typeof notification.method !== "string") return;

  if (notification.method === "thread/started") {
    const thread = parseCodexThread(params.thread);
    if (!thread) return;
    const existingState = threadStates.get(thread.id);
    threadStates.set(thread.id, {
      assistantMessageId: existingState?.assistantMessageId ?? null,
      isTurnReady: true,
      thread: mapCodexThreadToAssistantThread({ thread, workspacePath: thread.cwd }),
      turnId: existingState?.turnId ?? null,
    });
    emitThread(thread.id);
    void emitThreadList(thread.cwd);
    return;
  }

  if (notification.method === "thread/status/changed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId) return;
    threadState.thread.status = mapCodexStatusToAssistantStatus(params.status);
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }

  if (notification.method === "thread/name/updated") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId) return;
    threadState.thread.title =
      typeof params.threadName === "string" && params.threadName.trim()
        ? params.threadName
        : threadState.thread.preview || "New chat";
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }

  if (notification.method === "thread/archived") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId) return;
    threadStates.delete(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }

  if (notification.method === "turn/started") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const turn = isRecord(params.turn) ? params.turn : null;
    const turnId = turn && typeof turn.id === "string" ? turn.id : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId || !turnId) return;
    threadState.turnId = turnId;
    threadState.thread.status = "running";
    emitThread(threadId);
    return;
  }

  if (notification.method === "turn/completed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const turn = isRecord(params.turn) ? params.turn : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    if (!threadState || !threadId || !turn) return;
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
    if (!threadState || !threadId) return;
    threadState.thread.errorMessage =
      typeof error?.message === "string"
        ? error.message
        : "Codex could not complete that run.";
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
    if (!threadState || !threadId || !delta) return;
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
    if (!threadState || !threadId || !isAgentMessageItem(item)) return;
    const assistantMessage = getOrCreateAssistantMessage({
      createId,
      itemId: typeof item.id === "string" ? item.id : null,
      now,
      threadState,
    });
    if (item.text.trim().length > 0 || assistantMessage.content.length === 0) {
      assistantMessage.content = item.text;
    }
    emitThread(threadId);
    return;
  }
}

// ─── Runtime helpers ──────────────────────────────────────────────────────────

function getOrCreateAssistantMessage({
  createId,
  itemId,
  now,
  threadState,
}: {
  createId: () => string;
  itemId: string | null;
  now: () => string;
  threadState: AssistantThreadState;
}): AssistantMessage {
  const pendingId = threadState.assistantMessageId;
  let assistantMessageId = pendingId;

  if (itemId) {
    assistantMessageId = itemId;
    threadState.assistantMessageId = itemId;
  }

  let msg = assistantMessageId
    ? threadState.thread.messages.find((m) => m.id === assistantMessageId) ?? null
    : null;

  if (!msg && pendingId) {
    msg = threadState.thread.messages.find((m) => m.id === pendingId) ?? null;
    if (msg && itemId) msg.id = itemId;
  }

  if (!msg) {
    msg = {
      id: assistantMessageId ?? createId(),
      role: "assistant",
      content: "",
      createdAt: now(),
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
  workspacePath,
}: {
  connection: AssistantServerConnection;
  threadId: string;
  threadState: AssistantThreadState;
  workspacePath: string;
}) {
  const response = await connection.request<{ thread: CodexThread }>("thread/resume", {
    approvalPolicy: "never",
    cwd: workspacePath,
    developerInstructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
    persistExtendedHistory: true,
    sandbox: "read-only",
    threadId,
  });
  const resumedThread = mapCodexThreadToAssistantThread({
    thread: response.thread,
    workspacePath,
  });
  threadState.isTurnReady = true;
  threadState.thread = {
    ...resumedThread,
    errorMessage: threadState.thread.errorMessage,
    messages: threadState.thread.messages,
    preview: threadState.thread.preview || resumedThread.preview,
    status: threadState.thread.status,
  };
}

function buildAssistantPrompt({
  documentMarkdown,
  documentTitle,
  documentRelativePath,
  userRequest,
  workspaceName,
  workspacePath,
}: {
  documentMarkdown: string;
  documentTitle: string;
  documentRelativePath: string;
  userRequest: string;
  workspaceName: string;
  workspacePath: string;
}): string {
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
    "```",
  ].join("\n");
}

function mapCodexThreadToSummary(thread: CodexThread): AssistantThreadSummary {
  return {
    createdAt: toIsoTimestamp(thread.createdAt),
    id: thread.id,
    preview: getThreadPreview(thread.preview),
    status: mapCodexStatusToAssistantStatus(thread.status),
    title: getThreadTitle(thread),
    updatedAt: toIsoTimestamp(thread.updatedAt),
  };
}

function mapCodexThreadToAssistantThread({
  thread,
  workspacePath,
}: {
  thread: CodexThread;
  workspacePath: string;
}): AssistantThread {
  return {
    errorMessage: null,
    id: thread.id,
    messages: flattenThreadMessages(thread),
    preview: getThreadPreview(thread.preview),
    status: mapCodexStatusToAssistantStatus(thread.status),
    title: getThreadTitle(thread),
    workspacePath,
  };
}

function flattenThreadMessages(thread: CodexThread): AssistantMessage[] {
  const messages: AssistantMessage[] = [];
  const createdAt = toIsoTimestamp(thread.createdAt);

  for (const turn of thread.turns) {
    for (const item of turn.items) {
      if (isUserMessageItem(item)) {
        const content = getDisplayUserMessage(item.content);
        if (!content) continue;
        messages.push({ content, createdAt, id: item.id, role: "user" });
      }
      if (isAgentMessageItem(item)) {
        messages.push({ content: item.text, createdAt, id: item.id, role: "assistant" });
      }
    }
  }

  return messages;
}

function getDisplayUserMessage(contentItems: CodexUserInput[]): string {
  const rawText = contentItems
    .map((item) => (isTextUserInput(item) ? item.text : ""))
    .join("\n")
    .trim();
  return extractMohioUserRequest(rawText) ?? rawText;
}

function extractMohioUserRequest(text: string): string | null {
  const startIndex = text.indexOf(MOHIO_PROMPT_OPEN);
  const endIndex = text.indexOf(MOHIO_PROMPT_CLOSE);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null;
  return text.slice(startIndex + MOHIO_PROMPT_OPEN.length, endIndex).trim();
}

function getThreadPreview(preview: string): string {
  return extractMohioUserRequest(preview) ?? preview.trim();
}

function getThreadTitle(thread: CodexThread): string {
  return thread.name?.trim() || getThreadPreview(thread.preview) || "New chat";
}

function mapCodexStatusToAssistantStatus(status: unknown): AssistantRunStatus {
  if (!isRecord(status) || typeof status.type !== "string") return "idle";
  if (status.type === "active") return "running";
  if (status.type === "systemError") return "error";
  return "idle";
}

function getTurnErrorMessage(turnError: unknown): string {
  if (!isRecord(turnError) || typeof turnError.message !== "string") {
    return "Codex could not complete that run.";
  }
  if (typeof turnError.additionalDetails === "string" && turnError.additionalDetails.trim()) {
    return `${turnError.message} ${turnError.additionalDetails}`.trim();
  }
  return turnError.message;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Mohio could not start the installed Codex app server.";
}

function isUnmaterializedThreadReadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("is not materialized yet") &&
    error.message.includes("includeTurns")
  );
}

function isNoRolloutFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("no rollout found for thread id");
}

function parseCodexThread(value: unknown): CodexThread | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.cwd !== "string") {
    return null;
  }
  return value as unknown as CodexThread;
}

function parseJsonLine(line: string): JsonRpcResponse | null {
  try {
    return JSON.parse(line) as JsonRpcResponse;
  } catch {
    return null;
  }
}

function toIsoTimestamp(unixTimestampSeconds: number): string {
  return new Date(unixTimestampSeconds * 1000).toISOString();
}

function wait(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function cloneThread(thread: AssistantThread): AssistantThread {
  return { ...thread, messages: thread.messages.map((m) => ({ ...m })) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAgentMessageItem(item: unknown): item is CodexAgentMessageItem {
  return isRecord(item) && item.type === "agentMessage" && typeof item.text === "string";
}

function isUserMessageItem(item: unknown): item is CodexUserMessageItem {
  return isRecord(item) && item.type === "userMessage" && Array.isArray(item.content);
}

function isTextUserInput(item: CodexUserInput): item is { type: "text"; text: string } {
  return item.type === "text" && "text" in item && typeof (item as { text?: unknown }).text === "string";
}

// ─── Prompt Modal ─────────────────────────────────────────────────────────────

class PromptModal extends Modal {
  private resolve: (value: string | null) => void;
  private inputEl!: HTMLInputElement;

  constructor(app: App, private readonly label: string, private readonly initial: string) {
    super(app);
    this.resolve = () => {};
  }

  open(): Promise<string | null> {
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
      cls: "mohio-prompt-input",
    });
    this.inputEl.value = this.initial;

    const btnRow = contentEl.createDiv({ cls: "mohio-prompt-buttons" });
    const confirmBtn = btnRow.createEl("button", {
      text: "Confirm",
      cls: "mod-cta",
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
}

// ─── AssistantView ────────────────────────────────────────────────────────────

class AssistantView extends ItemView {
  private runtime: AssistantRuntime;
  private vaultPath: string;
  private vaultName: string;

  // State
  private viewMode: "list" | "thread" = "list";
  private threads: AssistantThreadSummary[] = [];
  private activeThread: AssistantThread | null = null;
  private isLoadingThreads = false;

  // DOM refs
  private panelEl!: HTMLElement;
  private mainContentEl!: HTMLElement;
  private footerEl!: HTMLElement;
  private composerTextarea!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private unsubscribeRuntime?: () => void;
  private unsubscribeWorkspace?: () => void;

  constructor(leaf: WorkspaceLeaf, runtime: AssistantRuntime, vaultPath: string, vaultName: string) {
    super(leaf);
    this.runtime = runtime;
    this.vaultPath = vaultPath;
    this.vaultName = vaultName;
  }

  getViewType(): string {
    return VIEW_TYPE_ASSISTANT;
  }

  getDisplayText(): string {
    return "AI Assistance";
  }

  getIcon(): string {
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
      if (event.workspacePath !== this.vaultPath) return;

      if (event.type === "thread-list") {
        this.threads = event.threads;
        if (this.viewMode === "list") {
          this.renderList();
        }
      }

      if (event.type === "thread") {
        if (this.viewMode === "thread" && this.activeThread?.id === event.thread.id) {
          this.activeThread = event.thread;
          this.renderThread();
        }
        // Keep summary list in sync
        const idx = this.threads.findIndex((t) => t.id === event.thread.id);
        const summary: AssistantThreadSummary = {
          id: event.thread.id,
          title: event.thread.title,
          preview: event.thread.preview,
          status: event.thread.status,
          createdAt: event.thread.messages[0]?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (idx >= 0) {
          this.threads = [
            ...this.threads.slice(0, idx),
            summary,
            ...this.threads.slice(idx + 1),
          ];
        }
      }
    });

    this.unsubscribeWorkspace = this.app.workspace.on("active-leaf-change", () => {
      this.updateComposerState();
    }) as unknown as () => void;

    await this.showListView();
  }

  async onClose() {
    this.unsubscribeRuntime?.();
    if (this.unsubscribeWorkspace) {
      this.app.workspace.offref(this.unsubscribeWorkspace as unknown as ReturnType<typeof this.app.workspace.on>);
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  private async showListView() {
    this.viewMode = "list";
    this.activeThread = null;
    this.isLoadingThreads = true;
    this.renderList();

    try {
      this.threads = await this.runtime.listThreads({ workspacePath: this.vaultPath });
    } catch {
      this.threads = [];
    } finally {
      this.isLoadingThreads = false;
    }

    this.renderList();
    this.updateComposerState();
  }

  private async showThreadView(threadId: string) {
    this.viewMode = "thread";
    this.mainContentEl.empty();
    this.mainContentEl.createDiv({ cls: "mohio-loading", text: "Loading…" });

    try {
      const thread = await this.runtime.getThread({
        threadId,
        workspacePath: this.vaultPath,
      });
      this.activeThread = thread;
    } catch (error) {
      new Notice(`Could not open chat: ${getErrorMessage(error)}`);
      await this.showListView();
      return;
    }

    this.renderThread();
    this.updateComposerState();
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  private renderList() {
    this.mainContentEl.empty();

    if (this.isLoadingThreads) {
      this.mainContentEl.createDiv({ cls: "mohio-loading", text: "Loading chats…" });
      return;
    }

    if (this.threads.length === 0) {
      this.mainContentEl.createDiv({
        cls: "mohio-empty-state",
        text: "No chats yet. Send a message to start.",
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

  private renderMessages(transcriptEl: HTMLElement, thread: AssistantThread) {
    transcriptEl.empty();

    for (const message of thread.messages) {
      const msgEl = transcriptEl.createDiv({
        cls: `mohio-message mohio-message--${message.role}`,
      });
      const contentEl = msgEl.createDiv({ cls: "mohio-message-content" });
      contentEl.setText(message.content);
    }

    if (thread.status === "error" && thread.errorMessage) {
      transcriptEl.createDiv({ cls: "mohio-error-message", text: thread.errorMessage });
    }

    // Thinking indicator: show when running and last assistant message has no content
    const lastMsg = thread.messages[thread.messages.length - 1];
    const isThinking =
      thread.status === "running" &&
      (!lastMsg || (lastMsg.role === "assistant" && lastMsg.content.trim() === ""));

    if (isThinking) {
      transcriptEl.createDiv({ cls: "mohio-thinking", text: "Thinking…" });
    }
  }

  private renderThread() {
    const thread = this.activeThread;
    if (!thread || this.viewMode !== "thread") return;

    // If the header already exists, only re-render the transcript
    const existingTranscript = this.mainContentEl.querySelector(".mohio-transcript");
    if (existingTranscript) {
      this.renderMessages(existingTranscript as HTMLElement, thread);
      (existingTranscript as HTMLElement).scrollTop = (existingTranscript as HTMLElement).scrollHeight;

      // Update header title
      const titleEl = this.mainContentEl.querySelector(".mohio-thread-title");
      if (titleEl) titleEl.textContent = thread.title;

      this.updateComposerState();
      return;
    }

    this.mainContentEl.empty();

    const header = this.mainContentEl.createDiv({ cls: "mohio-thread-header" });

    const backBtn = header.createEl("button", { cls: "mohio-icon-btn" });
    setIcon(backBtn, "arrow-left");
    backBtn.setAttribute("aria-label", "Back to chat list");
    backBtn.addEventListener("click", () => { void this.showListView(); });

    header.createDiv({ cls: "mohio-thread-title", text: thread.title });

    const menuBtn = header.createEl("button", { cls: "mohio-icon-btn" });
    setIcon(menuBtn, "more-horizontal");
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

  private openThreadMenu(anchor: HTMLElement, thread: AssistantThread) {
    const existing = document.querySelector(".mohio-thread-menu");
    if (existing) {
      existing.remove();
      return;
    }

    const menu = document.createElement("div");
    menu.className = "mohio-thread-menu";

    const addItem = (label: string, handler: () => void) => {
      const item = menu.createDiv({ cls: "mohio-thread-menu-item" });
      item.setText(label);
      item.addEventListener("click", () => {
        menu.remove();
        handler();
      });
    };

    addItem("New Chat", () => { void this.startNewChat(); });
    addItem("Rename Chat", () => { void this.renameChat(thread); });
    addItem("Delete Chat", () => { void this.deleteChat(thread); });

    document.body.appendChild(menu);

    // Position below anchor
    const rect = anchor.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;

    const dismiss = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("mousedown", dismiss);
      }
    };
    document.addEventListener("mousedown", dismiss);
  }

  // ── Chat actions ─────────────────────────────────────────────────────────────

  private async startNewChat(initialContent?: string) {
    const thread = await this.runtime.createThread({ workspacePath: this.vaultPath });
    this.activeThread = thread;
    this.viewMode = "thread";
    this.renderThread();
    this.updateComposerState();

    if (initialContent) {
      await this.dispatchMessage(initialContent, thread.id);
    }
  }

  private async renameChat(thread: AssistantThread) {
    const modal = new PromptModal(this.app, "Rename chat", thread.title);
    const newTitle = await modal.open();
    if (!newTitle) return;

    try {
      await this.runtime.renameThread({
        threadId: thread.id,
        title: newTitle,
        workspacePath: this.vaultPath,
      });
    } catch (error) {
      new Notice(getErrorMessage(error));
    }
  }

  private async deleteChat(thread: AssistantThread) {
    try {
      await this.runtime.deleteThread({
        threadId: thread.id,
        workspacePath: this.vaultPath,
      });
    } catch (error) {
      new Notice(getErrorMessage(error));
      return;
    }
    await this.showListView();
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  private buildFooter() {
    this.footerEl.empty();

    const quickActions = this.footerEl.createDiv({ cls: "mohio-quick-actions" });

    const summariseBtn = quickActions.createEl("button", {
      cls: "mohio-quick-action-pill",
      text: "Summarise document",
    });
    summariseBtn.addEventListener("click", () => {
      void this.sendQuickAction("Summarise document");
    });

    const improveBtn = quickActions.createEl("button", {
      cls: "mohio-quick-action-pill",
      text: "Improve document",
    });
    improveBtn.addEventListener("click", () => {
      void this.sendQuickAction("Improve document");
    });

    const composerWrapper = this.footerEl.createDiv({ cls: "mohio-composer" });

    this.composerTextarea = composerWrapper.createEl("textarea", {
      cls: "mohio-composer-textarea",
      attr: { rows: "1", placeholder: "Ask Codex…" },
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
    setIcon(this.sendBtn, "send");
    this.sendBtn.setAttribute("aria-label", "Send message");
    this.sendBtn.addEventListener("click", () => { void this.handleSend(); });

    this.updateComposerState();
  }

  private autoGrowTextarea() {
    const el = this.composerTextarea;
    el.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * 5 + 16; // 5 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }

  private updateComposerState() {
    const activeFile = this.app.workspace.getActiveViewOfType(MarkdownView);
    const hasDocument = activeFile !== null;
    const isRunning = this.activeThread?.status === "running";
    const disabled = !hasDocument || isRunning;

    this.composerTextarea.disabled = disabled;
    this.sendBtn.disabled = disabled;
    this.composerTextarea.placeholder = hasDocument
      ? "Ask Codex…"
      : "Open a note to start chatting";
  }

  // ── Sending ──────────────────────────────────────────────────────────────────

  private async handleSend() {
    const content = this.composerTextarea.value;
    if (!content.trim()) return;

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

  private async sendQuickAction(prompt: string) {
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

  private async dispatchMessage(content: string, threadId: string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.file) {
      new Notice("Open a note first to provide document context.");
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
        workspacePath: this.vaultPath,
      });
    } catch (error) {
      new Notice(getErrorMessage(error));
    }
  }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default class MohioAIAssistancePlugin extends Plugin {
  private runtime: AssistantRuntime | null = null;

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
      callback: () => { void this.activateView(); },
    });
  }

  async onunload() {
    this.runtime?.dispose();
    this.runtime = null;
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_ASSISTANT);
  }

  private async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_ASSISTANT)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_ASSISTANT, active: true });
    }

    workspace.revealLeaf(leaf);
  }

  private getVaultPath(): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    return this.app.vault.getName();
  }
}
