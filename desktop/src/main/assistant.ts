import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from "node:child_process";
import { createInterface } from "node:readline";
import type {
  AssistantEvent,
  AssistantMessage,
  AssistantThread,
  SendAssistantMessageInput,
} from "@shared/mohio-types";

const DEFAULT_ASSISTANT_INSTRUCTIONS = [
  "You are Codex embedded inside Mohio, a local-first Markdown workspace for small teams.",
  "Work as a chat-only workspace assistant.",
  "The active note is the primary context, but you may inspect the rest of the workspace when useful.",
  "Do not propose patches, diffs, or direct file edits in this environment.",
  "Do not claim to have changed files.",
  "Respond in concise, practical product language.",
].join("\n");

type AssistantProcess = Pick<
  ChildProcessWithoutNullStreams,
  "kill" | "on" | "stderr" | "stdin" | "stdout"
>;

type SpawnAssistantProcess = (
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) => AssistantProcess;

interface AssistantRuntimeOptions {
  createId?: () => string;
  now?: () => string;
  spawnProcess?: SpawnAssistantProcess;
}

interface AssistantRunState {
  child: AssistantProcess | null;
  lastErrorMessages: string[];
  thread: AssistantThread;
}

interface SendAssistantRunInput extends SendAssistantMessageInput {
  workspaceName: string;
  workspacePath: string;
}

export interface AssistantRuntime {
  cancelRun: (input: { noteRelativePath: string; workspacePath: string }) => void;
  getThread: (input: { noteRelativePath: string; workspacePath: string }) => AssistantThread;
  migrateThread: (input: {
    fromRelativePath: string;
    toRelativePath: string;
    workspacePath: string;
  }) => void;
  onThreadChanged: (listener: (event: AssistantEvent) => void) => () => void;
  sendMessage: (input: SendAssistantRunInput) => AssistantThread;
}

export function createAssistantRuntime({
  createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  now = () => new Date().toISOString(),
  spawnProcess = spawn,
}: AssistantRuntimeOptions = {}): AssistantRuntime {
  const listeners = new Set<(event: AssistantEvent) => void>();
  const threadStates = new Map<string, AssistantRunState>();

  const emitThreadChanged = (workspacePath: string, noteRelativePath: string) => {
    const thread = cloneThread(getOrCreateThreadState({ noteRelativePath, workspacePath }).thread);
    const event: AssistantEvent = {
      workspacePath,
      noteRelativePath,
      thread,
    };

    for (const listener of listeners) {
      listener(event);
    }
  };

  const finalizeRun = ({
    child,
    code,
    noteRelativePath,
    signal,
    workspacePath,
  }: {
    child: AssistantProcess;
    code: number | null;
    noteRelativePath: string;
    signal: NodeJS.Signals | null;
    workspacePath: string;
  }) => {
    const state = getOrCreateThreadState({ noteRelativePath, workspacePath });

    if (state.child !== child) {
      return;
    }

    state.child = null;

    if (code === 0) {
      state.thread.status = "idle";
      state.thread.errorMessage = null;
    } else {
      state.thread.status = "error";
      state.thread.errorMessage = getRunErrorMessage({
        noteRelativePath,
        signal,
        state,
      });
    }

    emitThreadChanged(workspacePath, noteRelativePath);
  };

  const handleAssistantEvent = ({
    event,
    noteRelativePath,
    workspacePath,
  }: {
    event: unknown;
    noteRelativePath: string;
    workspacePath: string;
  }) => {
    const state = getOrCreateThreadState({ noteRelativePath, workspacePath });
    const parsedEvent = isRecord(event) ? event : null;

    if (!parsedEvent) {
      return;
    }

    if (parsedEvent.type === "error" && typeof parsedEvent.message === "string") {
      state.lastErrorMessages.push(parsedEvent.message);
      return;
    }

    const delta = extractAssistantText(parsedEvent);

    if (!delta) {
      return;
    }

    const assistantMessage = state.thread.messages[state.thread.messages.length - 1];

    if (!assistantMessage || assistantMessage.role !== "assistant") {
      return;
    }

    assistantMessage.content = delta.mode === "append"
      ? `${assistantMessage.content}${delta.text}`
      : delta.text;

    emitThreadChanged(workspacePath, noteRelativePath);
  };

  const sendMessage = ({
    content,
    documentMarkdown,
    documentTitle,
    noteRelativePath,
    workspaceName,
    workspacePath,
  }: SendAssistantRunInput): AssistantThread => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error("Enter a message before asking Codex for help.");
    }

    const state = getOrCreateThreadState({ noteRelativePath, workspacePath });

    if (state.child) {
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
    const prompt = buildAssistantPrompt({
      documentMarkdown,
      documentTitle,
      noteRelativePath,
      userMessage,
      workspaceName,
      workspacePath,
      historyMessages: [...state.thread.messages, userMessage],
    });

    state.lastErrorMessages = [];
    state.thread.messages = [...state.thread.messages, userMessage, assistantMessage];
    state.thread.status = "running";
    state.thread.errorMessage = null;

    let child: AssistantProcess;

    try {
      child = spawnProcess("codex", getCodexExecArgs(workspacePath), {
        cwd: workspacePath,
        env: process.env,
        stdio: "pipe",
      });
    } catch {
      state.thread.status = "error";
      state.thread.errorMessage = "Mohio could not start the installed Codex CLI.";
      emitThreadChanged(workspacePath, noteRelativePath);
      return cloneThread(state.thread);
    }

    state.child = child;
    emitThreadChanged(workspacePath, noteRelativePath);

    const stdoutReader = createInterface({ input: child.stdout });

    stdoutReader.on("line", (line) => {
      const parsedLine = parseJsonLine(line);

      if (!parsedLine) {
        return;
      }

      handleAssistantEvent({
        event: parsedLine,
        noteRelativePath,
        workspacePath,
      });
    });

    const stderrReader = createInterface({ input: child.stderr });
    stderrReader.on("line", (line) => {
      if (line.trim().length > 0) {
        state.lastErrorMessages.push(line.trim());
      }
    });

    child.on("close", (code, signal) => {
      stdoutReader.close();
      stderrReader.close();
      finalizeRun({
        child,
        code,
        noteRelativePath,
        signal,
        workspacePath,
      });
    });

    child.stdin.write(prompt);
    child.stdin.end();

    return cloneThread(state.thread);
  };

  const cancelRun = ({
    noteRelativePath,
    workspacePath,
  }: {
    noteRelativePath: string;
    workspacePath: string;
  }) => {
    const state = getOrCreateThreadState({ noteRelativePath, workspacePath });

    if (!state.child) {
      return;
    }

    const activeChild = state.child;
    state.child = null;
    state.lastErrorMessages = [];
    state.thread.status = "idle";
    state.thread.errorMessage = null;
    emitThreadChanged(workspacePath, noteRelativePath);

    try {
      activeChild.kill("SIGTERM");
    } catch {
      // Ignore best-effort shutdown failures.
    }
  };

  const migrateThread = ({
    fromRelativePath,
    toRelativePath,
    workspacePath,
  }: {
    fromRelativePath: string;
    toRelativePath: string;
    workspacePath: string;
  }) => {
    if (fromRelativePath === toRelativePath) {
      return;
    }

    const previousKey = getThreadKey(workspacePath, fromRelativePath);
    const nextKey = getThreadKey(workspacePath, toRelativePath);
    const previousState = threadStates.get(previousKey);

    if (!previousState) {
      return;
    }

    previousState.thread.noteRelativePath = toRelativePath;
    threadStates.set(nextKey, previousState);
    threadStates.delete(previousKey);
    emitThreadChanged(workspacePath, toRelativePath);
  };

  const getThread = ({
    noteRelativePath,
    workspacePath,
  }: {
    noteRelativePath: string;
    workspacePath: string;
  }) => cloneThread(getOrCreateThreadState({ noteRelativePath, workspacePath }).thread);

  const onThreadChanged = (listener: (event: AssistantEvent) => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const getOrCreateThreadState = ({
    noteRelativePath,
    workspacePath,
  }: {
    noteRelativePath: string;
    workspacePath: string;
  }): AssistantRunState => {
    const key = getThreadKey(workspacePath, noteRelativePath);
    const existingState = threadStates.get(key);

    if (existingState) {
      return existingState;
    }

    const nextState: AssistantRunState = {
      child: null,
      lastErrorMessages: [],
      thread: {
        noteRelativePath,
        messages: [],
        status: "idle",
        errorMessage: null,
      },
    };

    threadStates.set(key, nextState);
    return nextState;
  };

  return {
    cancelRun,
    getThread,
    migrateThread,
    onThreadChanged,
    sendMessage,
  };
}

function buildAssistantPrompt({
  documentMarkdown,
  documentTitle,
  historyMessages,
  noteRelativePath,
  userMessage,
  workspaceName,
  workspacePath,
}: {
  documentMarkdown: string;
  documentTitle: string;
  historyMessages: AssistantMessage[];
  noteRelativePath: string;
  userMessage: AssistantMessage;
  workspaceName: string;
  workspacePath: string;
}) {
  const renderedHistory = historyMessages.length === 0
    ? "No previous conversation in this note thread."
    : historyMessages
      .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
      .join("\n\n");

  return [
    DEFAULT_ASSISTANT_INSTRUCTIONS,
    "",
    "Workspace context:",
    `- Name: ${workspaceName}`,
    `- Path: ${workspacePath}`,
    `- Active note path: ${noteRelativePath}`,
    `- Active note title: ${documentTitle.trim() || "Untitled"}`,
    "",
    "Active note Markdown:",
    "```md",
    documentMarkdown,
    "```",
    "",
    "Conversation history for this note:",
    renderedHistory,
    "",
    "Latest user request:",
    userMessage.content,
  ].join("\n");
}

function extractAssistantText(event: Record<string, unknown>) {
  if (typeof event.delta === "string" && includesAssistantMessage(event.type)) {
    return {
      mode: "append" as const,
      text: event.delta,
    };
  }

  const assistantPayload = getAssistantPayload(event);
  const extractedText = extractTextValue(assistantPayload);

  if (!extractedText) {
    return null;
  }

  return {
    mode: "replace" as const,
    text: extractedText,
  };
}

function getAssistantPayload(event: Record<string, unknown>) {
  if (event.role === "assistant") {
    return event.content ?? event.message ?? event.item;
  }

  if (isRecord(event.message) && event.message.role === "assistant") {
    return event.message.content ?? event.message;
  }

  if (isRecord(event.item) && event.item.role === "assistant") {
    return event.item.content ?? event.item;
  }

  if (isRecord(event.item) && isAssistantItemType(event.item.type)) {
    return event.item;
  }

  if (typeof event.type === "string" && includesAssistantMessage(event.type)) {
    return event.content ?? event.message ?? event.item;
  }

  return null;
}

function extractTextValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const collectedParts = value
      .map((entry) => extractTextValue(entry))
      .filter((entry): entry is string => Boolean(entry));

    return collectedParts.length > 0 ? collectedParts.join("") : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.text === "string") {
    return value.text;
  }

  if (typeof value.content === "string") {
    return value.content;
  }

  if (Array.isArray(value.content)) {
    return extractTextValue(value.content);
  }

  if (isRecord(value.output_text) && typeof value.output_text.text === "string") {
    return value.output_text.text;
  }

  return null;
}

function includesAssistantMessage(type: unknown) {
  return typeof type === "string" && type.includes("message");
}

function isAssistantItemType(type: unknown) {
  return type === "agent_message" || type === "assistant_message";
}

function getCodexExecArgs(workspacePath: string) {
  return [
    "--ask-for-approval",
    "never",
    "exec",
    "--json",
    "--ephemeral",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "-C",
    workspacePath,
    "-",
  ];
}

function getRunErrorMessage({
  noteRelativePath,
  signal,
  state,
}: {
  noteRelativePath: string;
  signal: NodeJS.Signals | null;
  state: AssistantRunState;
}) {
  if (signal === "SIGTERM") {
    return null;
  }

  let lastErrorMessage: string | null = null;

  for (let index = state.lastErrorMessages.length - 1; index >= 0; index -= 1) {
    const message = state.lastErrorMessages[index];

    if (message && message.length > 0) {
      lastErrorMessage = message;
      break;
    }
  }

  if (lastErrorMessage) {
    return lastErrorMessage;
  }

  return `Codex could not finish responding for ${noteRelativePath}.`;
}

function cloneThread(thread: AssistantThread): AssistantThread {
  return {
    noteRelativePath: thread.noteRelativePath,
    messages: thread.messages.map((message) => ({ ...message })),
    status: thread.status,
    errorMessage: thread.errorMessage,
  };
}

function getThreadKey(workspacePath: string, noteRelativePath: string) {
  return `${workspacePath}::${noteRelativePath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonLine(line: string) {
  const trimmedLine = line.trim();

  if (!trimmedLine.startsWith("{")) {
    return null;
  }

  try {
    return JSON.parse(trimmedLine) as unknown;
  } catch {
    return null;
  }
}
