import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from "node:child_process";
import { createInterface } from "node:readline";
import type {
  AssistantEvent,
  AssistantMessage,
  AssistantRunStatus,
  AssistantThread,
  AssistantThreadSummary,
  SendAssistantMessageInput,
} from "@shared/mohio-types";

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

type AssistantProcess = Pick<
  ChildProcessWithoutNullStreams,
  "kill" | "on" | "stderr" | "stdin" | "stdout"
>;

type SpawnAssistantProcess = (
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) => AssistantProcess;

interface JsonRpcRequest {
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  id?: number;
  result?: unknown;
  error?: {
    code?: number;
    message?: string;
  };
  method?: string;
  params?: unknown;
}

interface AssistantThreadState {
  assistantMessageId: string | null;
  isTurnReady: boolean;
  thread: AssistantThread;
  turnId: string | null;
}

interface AssistantRuntimeOptions {
  createId?: () => string;
  now?: () => string;
  spawnProcess?: SpawnAssistantProcess;
}

interface SendAssistantRunInput extends SendAssistantMessageInput {
  workspaceName: string;
  workspacePath: string;
}

interface AssistantServerConnection {
  request: <T>(method: string, params?: unknown) => Promise<T>;
}

const TURN_START_MAX_ROLLOUT_RETRIES = 3;
const TURN_START_ROLLOUT_RETRY_DELAY_MS = 120;

export interface AssistantRuntime {
  cancelRun: (input: { threadId: string; workspacePath: string }) => Promise<void>;
  createThread: (input: { workspacePath: string }) => Promise<AssistantThread>;
  deleteThread: (input: { threadId: string; workspacePath: string }) => Promise<void>;
  getThread: (input: { threadId: string; workspacePath: string }) => Promise<AssistantThread>;
  listThreads: (input: { workspacePath: string }) => Promise<AssistantThreadSummary[]>;
  onEvent: (listener: (event: AssistantEvent) => void) => () => void;
  renameThread: (input: { threadId: string; title: string; workspacePath: string }) => Promise<void>;
  sendMessage: (input: SendAssistantRunInput) => Promise<AssistantThread>;
}

export function createAssistantRuntime({
  createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  now = () => new Date().toISOString(),
  spawnProcess = spawn,
}: AssistantRuntimeOptions = {}): AssistantRuntime {
  const listeners = new Set<(event: AssistantEvent) => void>();
  const threadStates = new Map<string, AssistantThreadState>();
  let connectionPromise: Promise<AssistantServerConnection> | null = null;

  const emit = (event: AssistantEvent) => {
    for (const listener of listeners) {
      listener(event);
    }
  };

  const emitThread = (threadId: string) => {
    const threadState = threadStates.get(threadId);

    if (!threadState) {
      return;
    }

    emit({
      type: "thread",
      workspacePath: threadState.thread.workspacePath,
      thread: cloneThread(threadState.thread),
    });
  };

  const emitThreadList = async (workspacePath: string) => {
    try {
      const threads = await listThreads({ workspacePath });
      emit({
        type: "thread-list",
        workspacePath,
        threads,
      });
    } catch {
      // Keep list refresh failures local to explicit API calls.
    }
  };

  const getConnection = () => {
    if (!connectionPromise) {
      connectionPromise = createServerConnection({
        onExit: (errorMessage) => {
          for (const [threadId, threadState] of threadStates.entries()) {
            if (threadState.thread.status !== "running") {
              continue;
            }

            threadState.turnId = null;
            threadState.assistantMessageId = null;
            threadState.thread.status = "error";
            threadState.thread.errorMessage = errorMessage;
            emitThread(threadId);
          }

          connectionPromise = null;
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
        spawnProcess,
      });
    }

    return connectionPromise;
  };

  const cacheThread = (
    thread: AssistantThread,
    options: {
      isTurnReady?: boolean;
    } = {},
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

    cacheThread(assistantThread, {
      isTurnReady: true,
    });

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
      const response: { data: CodexThread[]; nextCursor: string | null } = await connection.request("thread/list", {
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

    return threads.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
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

    cacheThread(assistantThread, {
      isTurnReady: true,
    });
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
      if (!isUnmaterializedThreadReadError(error)) {
        throw error;
      }

      response = await connection.request<{ thread: CodexThread }>("thread/read", {
        includeTurns: false,
        threadId,
      });
    }

    const assistantThread = mapCodexThreadToAssistantThread({
      thread: response.thread,
      workspacePath,
    });

    cacheThread(assistantThread, {
      isTurnReady: false,
    });

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
  }: SendAssistantRunInput): Promise<AssistantThread> => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error("Enter a message before asking Codex for help.");
    }

    await ensureLoadedThread({
      threadId,
      workspacePath,
    });

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
          response = await connection.request<{ turn: { id: string } }>("turn/start", turnStartParams);
        } catch (error) {
          if (
            !isNoRolloutFoundError(error) ||
            rolloutRetryCount >= TURN_START_MAX_ROLLOUT_RETRIES
          ) {
            throw error;
          }

          rolloutRetryCount += 1;
          await resumeThread({
            connection,
            threadId,
            threadState,
            workspacePath,
          });
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

    if (!threadState?.turnId) {
      return;
    }

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

    if (!nextTitle) {
      throw new Error("Enter a title before renaming this chat.");
    }

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
    await connection.request<Record<string, never>>("thread/archive", {
      threadId,
    });

    threadStates.delete(threadId);
    void emitThreadList(workspacePath);
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
  };
}

function createServerConnection({
  onExit,
  onNotification,
  spawnProcess,
}: {
  onExit: (errorMessage: string) => void;
  onNotification: (notification: JsonRpcResponse) => void;
  spawnProcess: SpawnAssistantProcess;
}): Promise<AssistantServerConnection> {
  const child = spawnProcess("codex", ["app-server"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
  });
  const stdoutReader = createInterface({ input: child.stdout });
  const stderrReader = createInterface({ input: child.stderr });
  let nextRequestId = 1;
  const pendingRequests = new Map<number, {
    reject: (reason?: unknown) => void;
    resolve: (value: unknown) => void;
  }>();

  const connection = {
    request: <T>(method: string, params?: unknown) =>
      new Promise<T>((resolve, reject) => {
        const requestId = nextRequestId;
        nextRequestId += 1;
        pendingRequests.set(requestId, {
          reject,
          resolve: (value) => {
            resolve(value as T);
          },
        });

        const request: JsonRpcRequest = {
          id: requestId,
          method,
          params,
        };

        child.stdin.write(`${JSON.stringify(request)}\n`);
      }),
  } satisfies AssistantServerConnection;

  child.on("close", () => {
    stdoutReader.close();
    stderrReader.close();

    for (const pendingRequest of pendingRequests.values()) {
      pendingRequest.reject(new Error("Mohio lost its connection to Codex."));
    }

    pendingRequests.clear();
    onExit("Mohio lost its connection to the installed Codex app server.");
  });

  stdoutReader.on("line", (line) => {
    const parsedLine = parseJsonLine(line);

    if (!parsedLine) {
      return;
    }

    if (typeof parsedLine.id === "number") {
      const pendingRequest = pendingRequests.get(parsedLine.id);

      if (!pendingRequest) {
        return;
      }

      pendingRequests.delete(parsedLine.id);

      if (parsedLine.error) {
        pendingRequest.reject(new Error(parsedLine.error.message ?? "Codex returned an unknown error."));
        return;
      }

      pendingRequest.resolve(parsedLine.result);
      return;
    }

    if (typeof parsedLine.method === "string") {
      onNotification(parsedLine);
    }
  });

  stderrReader.on("line", () => {
    // app-server may emit diagnostics on stderr. The structured stream remains authoritative.
  });

  return connection.request<{ userAgent: string }>("initialize", {
    capabilities: {
      experimentalApi: true,
      optOutNotificationMethods: null,
    },
    clientInfo: {
      name: "mohio",
      title: "Mohio",
      version: "0.1.0",
    },
  }).then(() => connection);
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

  if (!params || typeof notification.method !== "string") {
    return;
  }

  if (notification.method === "thread/started") {
    const thread = parseCodexThread(params.thread);

    if (!thread) {
      return;
    }

    const existingState = threadStates.get(thread.id);
    threadStates.set(thread.id, {
      assistantMessageId: existingState?.assistantMessageId ?? null,
      isTurnReady: true,
      thread: mapCodexThreadToAssistantThread({
        thread,
        workspacePath: thread.cwd,
      }),
      turnId: existingState?.turnId ?? null,
    });
    emitThread(thread.id);
    void emitThreadList(thread.cwd);
    return;
  }

  if (notification.method === "thread/status/changed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;

    if (!threadState || !threadId) {
      return;
    }

    threadState.thread.status = mapCodexStatusToAssistantStatus(params.status);
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }

  if (notification.method === "thread/name/updated") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;

    if (!threadState || !threadId) {
      return;
    }

    threadState.thread.title = typeof params.threadName === "string" && params.threadName.trim()
      ? params.threadName
      : threadState.thread.preview || "New chat";
    emitThread(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }

  if (notification.method === "thread/archived") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;

    if (!threadState || !threadId) {
      return;
    }

    threadStates.delete(threadId);
    void emitThreadList(threadState.thread.workspacePath);
    return;
  }

  if (notification.method === "turn/started") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const turn = isRecord(params.turn) ? params.turn : null;
    const turnId = turn && typeof turn.id === "string" ? turn.id : null;
    const threadState = threadId ? threadStates.get(threadId) : null;

    if (!threadState || !threadId || !turnId) {
      return;
    }

    threadState.turnId = turnId;
    threadState.thread.status = "running";
    emitThread(threadId);
    return;
  }

  if (notification.method === "turn/completed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const turn = isRecord(params.turn) ? params.turn : null;
    const threadState = threadId ? threadStates.get(threadId) : null;

    if (!threadState || !threadId || !turn) {
      return;
    }

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

    if (!threadState || !threadId) {
      return;
    }

    threadState.thread.errorMessage = typeof error?.message === "string"
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

    if (!threadState || !threadId || !delta) {
      return;
    }

    const assistantMessage = getOrCreateAssistantMessage({
      createId,
      itemId,
      now,
      threadState,
    });

    assistantMessage.content += delta;
    threadState.thread.status = "running";
    emitThread(threadId);
    return;
  }

  if (notification.method === "item/completed") {
    const threadId = typeof params.threadId === "string" ? params.threadId : null;
    const threadState = threadId ? threadStates.get(threadId) : null;
    const item = isRecord(params.item) ? params.item : null;

    if (!threadState || !threadId || !isAgentMessageItem(item)) {
      return;
    }

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
  }
}

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
}) {
  const pendingAssistantMessageId = threadState.assistantMessageId;
  let assistantMessageId = pendingAssistantMessageId;

  if (itemId) {
    assistantMessageId = itemId;
    threadState.assistantMessageId = itemId;
  }

  let assistantMessage = assistantMessageId
    ? threadState.thread.messages.find((message) => message.id === assistantMessageId)
    : null;

  if (!assistantMessage && pendingAssistantMessageId) {
    assistantMessage = threadState.thread.messages.find((message) => message.id === pendingAssistantMessageId) ?? null;

    if (assistantMessage && itemId) {
      assistantMessage.id = itemId;
    }
  }

  if (!assistantMessage) {
    assistantMessage = {
      id: assistantMessageId ?? createId(),
      role: "assistant",
      content: "",
      createdAt: now(),
    };
    threadState.assistantMessageId = assistantMessage.id;
    threadState.thread.messages = [...threadState.thread.messages, assistantMessage];
  }

  return assistantMessage;
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
    "```",
  ].join("\n");
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

        if (!content) {
          continue;
        }

        messages.push({
          content,
          createdAt,
          id: item.id,
          role: "user",
        });
      }

      if (isAgentMessageItem(item)) {
        messages.push({
          content: item.text,
          createdAt,
          id: item.id,
          role: "assistant",
        });
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

function extractMohioUserRequest(text: string) {
  const startIndex = text.indexOf(MOHIO_PROMPT_OPEN);
  const endIndex = text.indexOf(MOHIO_PROMPT_CLOSE);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  return text
    .slice(startIndex + MOHIO_PROMPT_OPEN.length, endIndex)
    .trim();
}

function getThreadPreview(preview: string) {
  return extractMohioUserRequest(preview) ?? preview.trim();
}

function getThreadTitle(thread: CodexThread) {
  return thread.name?.trim() || getThreadPreview(thread.preview) || "New chat";
}

function mapCodexStatusToAssistantStatus(status: unknown): AssistantRunStatus {
  if (!isRecord(status) || typeof status.type !== "string") {
    return "idle";
  }

  if (status.type === "active") {
    return "running";
  }

  if (status.type === "systemError") {
    return "error";
  }

  return "idle";
}

function getTurnErrorMessage(turnError: unknown) {
  if (!isRecord(turnError) || typeof turnError.message !== "string") {
    return "Codex could not complete that run.";
  }

  if (typeof turnError.additionalDetails === "string" && turnError.additionalDetails.trim()) {
    return `${turnError.message} ${turnError.additionalDetails}`.trim();
  }

  return turnError.message;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Mohio could not start the installed Codex app server.";
}

function isUnmaterializedThreadReadError(error: unknown) {
  return error instanceof Error &&
    error.message.includes("is not materialized yet") &&
    error.message.includes("includeTurns");
}

function isNoRolloutFoundError(error: unknown) {
  return error instanceof Error && error.message.includes("no rollout found for thread id");
}

function parseCodexThread(value: unknown): CodexThread | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.cwd !== "string") {
    return null;
  }

  return value as CodexThread;
}

function parseJsonLine(line: string): JsonRpcResponse | null {
  try {
    return JSON.parse(line) as JsonRpcResponse;
  } catch {
    return null;
  }
}

function toIsoTimestamp(unixTimestampSeconds: number) {
  return new Date(unixTimestampSeconds * 1000).toISOString();
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function cloneThread(thread: AssistantThread): AssistantThread {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function isAgentMessageItem(item: unknown): item is CodexAgentMessageItem {
  return isRecord(item) && item.type === "agentMessage" && typeof item.text === "string";
}

function isUserMessageItem(item: unknown): item is CodexUserMessageItem {
  return isRecord(item) && item.type === "userMessage" && Array.isArray(item.content);
}

function isTextUserInput(item: CodexUserInput): item is {
  type: "text";
  text: string;
} {
  return item.type === "text" && "text" in item && typeof item.text === "string";
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

type CodexThreadItem = CodexAgentMessageItem | CodexUserMessageItem | {
  type: string;
  id: string;
};

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

type CodexUserInput = {
  type: "text";
  text: string;
} | {
  type: string;
};
