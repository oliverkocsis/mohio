// @vitest-environment node

import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import type { AssistantEvent, AssistantThread } from "@shared/mohio-types";
import { createAssistantRuntime } from "./assistant";

class FakeAssistantProcess extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  kill = vi.fn((signal?: NodeJS.Signals) => {
    this.emit("close", null, signal ?? "SIGTERM");
    return true;
  });

  private bufferedInput = "";
  private queuedRequests: Array<{ id: number; method: string; params?: unknown }> = [];
  private requestResolvers: Array<(request: { id: number; method: string; params?: unknown }) => void> = [];

  constructor() {
    super();

    this.stdin.on("data", (chunk) => {
      this.bufferedInput += chunk.toString();
      const requestLines = this.bufferedInput.split("\n");
      this.bufferedInput = requestLines.pop() ?? "";

      for (const requestLine of requestLines) {
        if (!requestLine.trim()) {
          continue;
        }

        const request = JSON.parse(requestLine) as { id: number; method: string; params?: unknown };
        const pendingResolver = this.requestResolvers.shift();

        if (pendingResolver) {
          pendingResolver(request);
        } else {
          this.queuedRequests.push(request);
        }
      }
    });
  }

  async nextRequest() {
    const queuedRequest = this.queuedRequests.shift();

    if (queuedRequest) {
      return queuedRequest;
    }

    return new Promise<{ id: number; method: string; params?: unknown }>((resolve) => {
      this.requestResolvers.push(resolve);
    });
  }

  drainRequests() {
    const queuedRequests = [...this.queuedRequests];
    this.queuedRequests = [];
    return queuedRequests;
  }

  notify(method: string, params: unknown) {
    this.stdout.write(`${JSON.stringify({ method, params })}\n`);
  }

  respondError(id: number, message: string) {
    this.stdout.write(`${JSON.stringify({ error: { message }, id })}\n`);
  }

  respondSuccess(id: number, result: unknown) {
    this.stdout.write(`${JSON.stringify({ id, result })}\n`);
  }
}

describe("assistant runtime", () => {
  it("lists workspace-filtered Codex threads and strips Mohio prompt wrappers", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    const listPromise = runtime.listThreads({
      workspacePath: "/workspaces/alpha",
    });

    const initializeRequest = await process.nextRequest();
    process.respondSuccess(initializeRequest.id, {
      userAgent: "codex-test",
    });

    const listRequest = await process.nextRequest();
    expect(listRequest.method).toBe("thread/list");
    expect(listRequest.params).toMatchObject({
      archived: false,
      cwd: "/workspaces/alpha",
      sortKey: "updated_at",
    });
    process.respondSuccess(listRequest.id, {
      data: [
        {
          cliVersion: "0.0.0",
          createdAt: 1711152000,
          cwd: "/workspaces/alpha",
          ephemeral: false,
          id: "thread-2",
          modelProvider: "openai",
          name: null,
          path: "/Users/test/.codex/sessions/thread-2",
          preview: "[MOHIO_USER_REQUEST]\nSummarise document\n[/MOHIO_USER_REQUEST]\n\nCurrent document body",
          source: "vscode",
          status: { type: "idle" },
          turns: [],
          updatedAt: 1711155600,
          agentNickname: null,
          agentRole: null,
          gitInfo: null,
        },
      ],
      nextCursor: null,
    });

    await expect(listPromise).resolves.toEqual([
      {
        createdAt: "2024-03-23T00:00:00.000Z",
        id: "thread-2",
        preview: "Summarise document",
        status: "idle",
        title: "Summarise document",
        updatedAt: "2024-03-23T01:00:00.000Z",
      },
    ]);
  });

  it("creates a Codex thread, sends a document-aware message, and streams assistant text", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-23T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });
    let lastThreadEvent: AssistantThread | null = null;

    runtime.onEvent((event: AssistantEvent) => {
      if (event.type === "thread") {
        lastThreadEvent = event.thread;
      }
    });

    const createThreadPromise = runtime.createThread({
      workspacePath: "/workspaces/alpha",
    });

    process.respondSuccess((await process.nextRequest()).id, {
      userAgent: "codex-test",
    });

    const createThreadRequest = await process.nextRequest();
    expect(createThreadRequest.method).toBe("thread/start");
    expect(createThreadRequest.params).toMatchObject({
      approvalPolicy: "never",
      cwd: "/workspaces/alpha",
      persistExtendedHistory: true,
      sandbox: "read-only",
    });
    process.respondSuccess(createThreadRequest.id, {
      approvalPolicy: "never",
      cwd: "/workspaces/alpha",
      model: "gpt-5.4",
      modelProvider: "openai",
      reasoningEffort: null,
      sandbox: { type: "readOnly", access: {} },
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-1",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-1",
        preview: "",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    const createdThread = await createThreadPromise;
    expect(createdThread.id).toBe("thread-1");

    const sendPromise = runtime.sendMessage({
      threadId: "thread-1",
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      documentRelativePath: "docs/Plan.md",
      content: "Summarise document",
      documentTitle: "Plan",
      documentMarkdown: "Body.\n",
    });

    const turnStartRequest = await nextNonThreadListRequest(process, "Summarise document");

    expect(turnStartRequest.method).toBe("turn/start");
    expect(turnStartRequest.params).toMatchObject({
      cwd: "/workspaces/alpha",
      threadId: "thread-1",
    });
    expect(JSON.stringify(turnStartRequest.params)).toContain("docs/Plan.md");
    expect(JSON.stringify(turnStartRequest.params)).toContain("Summarise document");
    process.respondSuccess(turnStartRequest.id, {
      turn: {
        error: null,
        id: "turn-1",
        items: [],
        status: "inProgress",
      },
    });

    await expect(sendPromise).resolves.toMatchObject({
      id: "thread-1",
      messages: [
        {
          content: "Summarise document",
          id: "user-1",
          role: "user",
        },
        {
          content: "",
          id: "assistant-1",
          role: "assistant",
        },
      ],
      status: "running",
    });

    process.notify("item/agentMessage/delta", {
      delta: "First ",
      itemId: "assistant-item-1",
      threadId: "thread-1",
      turnId: "turn-1",
    });
    process.notify("item/completed", {
      item: {
        id: "assistant-item-1",
        phase: null,
        text: "First answer.",
        type: "agentMessage",
      },
      threadId: "thread-1",
      turnId: "turn-1",
    });
    process.notify("turn/completed", {
      threadId: "thread-1",
      turn: {
        error: null,
        id: "turn-1",
        items: [],
        status: "completed",
      },
    });
    await flushEvents();

    expect(lastThreadEvent).toMatchObject({
      id: "thread-1",
      messages: [
        expect.objectContaining({
          content: "Summarise document",
          role: "user",
        }),
        expect.objectContaining({
          content: "First answer.",
          role: "assistant",
        }),
      ],
      status: "idle",
    });
  });

  it("keeps streamed assistant text when the completed item arrives empty", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-23T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });
    let lastThreadEvent: AssistantThread | null = null;

    runtime.onEvent((event: AssistantEvent) => {
      if (event.type === "thread") {
        lastThreadEvent = event.thread;
      }
    });

    const createThreadPromise = runtime.createThread({
      workspacePath: "/workspaces/alpha",
    });

    process.respondSuccess((await process.nextRequest()).id, {
      userAgent: "codex-test",
    });

    const createThreadRequest = await process.nextRequest();
    process.respondSuccess(createThreadRequest.id, {
      approvalPolicy: "never",
      cwd: "/workspaces/alpha",
      model: "gpt-5.4",
      modelProvider: "openai",
      reasoningEffort: null,
      sandbox: { type: "readOnly", access: {} },
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-keep-stream",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-keep-stream",
        preview: "",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    await expect(createThreadPromise).resolves.toMatchObject({
      id: "thread-keep-stream",
    });

    const sendPromise = runtime.sendMessage({
      threadId: "thread-keep-stream",
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      documentRelativePath: "docs/Plan.md",
      content: "Summarise document",
      documentTitle: "Plan",
      documentMarkdown: "Body.\n",
    });

    const turnStartRequest = await nextNonThreadListRequest(process, "Summarise document");
    process.respondSuccess(turnStartRequest.id, {
      turn: {
        error: null,
        id: "turn-keep-stream",
        items: [],
        status: "inProgress",
      },
    });

    await expect(sendPromise).resolves.toMatchObject({
      id: "thread-keep-stream",
      status: "running",
    });

    process.notify("item/agentMessage/delta", {
      delta: "Streamed text that should stay.",
      itemId: "assistant-item-keep-stream",
      threadId: "thread-keep-stream",
      turnId: "turn-keep-stream",
    });
    process.notify("item/completed", {
      item: {
        id: "assistant-item-keep-stream",
        phase: null,
        text: "",
        type: "agentMessage",
      },
      threadId: "thread-keep-stream",
      turnId: "turn-keep-stream",
    });
    process.notify("turn/completed", {
      threadId: "thread-keep-stream",
      turn: {
        error: null,
        id: "turn-keep-stream",
        items: [],
        status: "completed",
      },
    });
    await flushEvents();

    expect(lastThreadEvent).toMatchObject({
      id: "thread-keep-stream",
      messages: [
        expect.objectContaining({
          content: "Summarise document",
          role: "user",
        }),
        expect.objectContaining({
          content: "Streamed text that should stay.",
          role: "assistant",
        }),
      ],
      status: "idle",
    });
  });

  it("falls back to thread/read without turns for a brand new unmaterialized thread", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    const getThreadPromise = runtime.getThread({
      threadId: "thread-empty",
      workspacePath: "/workspaces/alpha",
    });

    process.respondSuccess((await process.nextRequest()).id, {
      userAgent: "codex-test",
    });

    const firstReadRequest = await process.nextRequest();
    expect(firstReadRequest.method).toBe("thread/read");
    expect(firstReadRequest.params).toEqual({
      includeTurns: true,
      threadId: "thread-empty",
    });
    process.respondError(
      firstReadRequest.id,
      "thread thread-empty is not materialized yet; includeTurns is unavailable before first user message",
    );

    const fallbackReadRequest = await process.nextRequest();
    expect(fallbackReadRequest.method).toBe("thread/read");
    expect(fallbackReadRequest.params).toEqual({
      includeTurns: false,
      threadId: "thread-empty",
    });
    process.respondSuccess(fallbackReadRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-empty",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-empty",
        preview: "",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    await expect(getThreadPromise).resolves.toMatchObject({
      id: "thread-empty",
      messages: [],
      status: "idle",
    });
  });

  it("resumes an existing Codex thread before starting a new turn", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-23T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    const getThreadPromise = runtime.getThread({
      threadId: "thread-existing",
      workspacePath: "/workspaces/alpha",
    });

    process.respondSuccess((await process.nextRequest()).id, {
      userAgent: "codex-test",
    });

    const readRequest = await process.nextRequest();
    expect(readRequest.method).toBe("thread/read");
    process.respondSuccess(readRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-existing",
        modelProvider: "openai",
        name: "Existing chat",
        path: "/Users/test/.codex/sessions/thread-existing",
        preview: "Existing chat",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    await expect(getThreadPromise).resolves.toMatchObject({
      id: "thread-existing",
      title: "Existing chat",
    });

    const sendPromise = runtime.sendMessage({
      threadId: "thread-existing",
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      documentRelativePath: "docs/Plan.md",
      content: "Continue this chat",
      documentTitle: "Plan",
      documentMarkdown: "Body.\n",
    });

    const resumeRequest = await process.nextRequest();
    expect(resumeRequest.method).toBe("thread/resume");
    expect(resumeRequest.params).toMatchObject({
      cwd: "/workspaces/alpha",
      threadId: "thread-existing",
    });
    process.respondSuccess(resumeRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-existing",
        modelProvider: "openai",
        name: "Existing chat",
        path: "/Users/test/.codex/sessions/thread-existing",
        preview: "Existing chat",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    const turnStartRequest = await nextNonThreadListRequest(process, "Existing chat");
    expect(turnStartRequest.method).toBe("turn/start");
    expect(turnStartRequest.params).toMatchObject({
      cwd: "/workspaces/alpha",
      threadId: "thread-existing",
    });
    process.respondSuccess(turnStartRequest.id, {
      turn: {
        error: null,
        id: "turn-2",
        items: [],
        status: "inProgress",
      },
    });

    await expect(sendPromise).resolves.toMatchObject({
      id: "thread-existing",
      status: "running",
    });
  });

  it("retries a brand new thread after a no-rollout turn/start error", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-23T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    const createThreadPromise = runtime.createThread({
      workspacePath: "/workspaces/alpha",
    });

    process.respondSuccess((await process.nextRequest()).id, {
      userAgent: "codex-test",
    });

    const createThreadRequest = await process.nextRequest();
    expect(createThreadRequest.method).toBe("thread/start");
    process.respondSuccess(createThreadRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-fresh",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-fresh",
        preview: "",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    await expect(createThreadPromise).resolves.toMatchObject({
      id: "thread-fresh",
    });

    const sendPromise = runtime.sendMessage({
      threadId: "thread-fresh",
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      documentRelativePath: "docs/Plan.md",
      content: "Summarise document",
      documentTitle: "Plan",
      documentMarkdown: "Body.\n",
    });

    const firstTurnStartRequest = await nextNonThreadListRequest(process, "Summarise document");
    expect(firstTurnStartRequest.method).toBe("turn/start");
    process.respondError(firstTurnStartRequest.id, "no rollout found for thread id thread-fresh");

    const resumeRequest = await process.nextRequest();
    expect(resumeRequest.method).toBe("thread/resume");
    expect(resumeRequest.params).toMatchObject({
      cwd: "/workspaces/alpha",
      threadId: "thread-fresh",
    });
    process.respondSuccess(resumeRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-fresh",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-fresh",
        preview: "Summarise document",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    const retriedTurnStartRequest = await nextNonThreadListRequest(process, "Summarise document");
    expect(retriedTurnStartRequest.method).toBe("turn/start");
    process.respondSuccess(retriedTurnStartRequest.id, {
      turn: {
        error: null,
        id: "turn-fresh",
        items: [],
        status: "inProgress",
      },
    });

    await expect(sendPromise).resolves.toMatchObject({
      id: "thread-fresh",
      status: "running",
    });
  });

  it("keeps retrying no-rollout turn/start errors for a new thread before succeeding", async () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-23T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    const createThreadPromise = runtime.createThread({
      workspacePath: "/workspaces/alpha",
    });

    process.respondSuccess((await process.nextRequest()).id, {
      userAgent: "codex-test",
    });

    const createThreadRequest = await process.nextRequest();
    process.respondSuccess(createThreadRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-retry-many",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-retry-many",
        preview: "",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    await expect(createThreadPromise).resolves.toMatchObject({
      id: "thread-retry-many",
    });

    const sendPromise = runtime.sendMessage({
      threadId: "thread-retry-many",
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      documentRelativePath: "docs/Plan.md",
      content: "Summarise document",
      documentTitle: "Plan",
      documentMarkdown: "Body.\n",
    });

    const firstTurnStartRequest = await nextNonThreadListRequest(process, "Summarise document");
    expect(firstTurnStartRequest.method).toBe("turn/start");
    process.respondError(firstTurnStartRequest.id, "no rollout found for thread id thread-retry-many");

    const firstResumeRequest = await process.nextRequest();
    expect(firstResumeRequest.method).toBe("thread/resume");
    process.respondSuccess(firstResumeRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-retry-many",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-retry-many",
        preview: "Summarise document",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    const secondTurnStartRequest = await nextNonThreadListRequest(process, "Summarise document");
    expect(secondTurnStartRequest.method).toBe("turn/start");
    process.respondError(secondTurnStartRequest.id, "no rollout found for thread id thread-retry-many");

    const secondResumeRequest = await process.nextRequest();
    expect(secondResumeRequest.method).toBe("thread/resume");
    process.respondSuccess(secondResumeRequest.id, {
      thread: {
        cliVersion: "0.0.0",
        createdAt: 1774224000,
        cwd: "/workspaces/alpha",
        ephemeral: false,
        id: "thread-retry-many",
        modelProvider: "openai",
        name: null,
        path: "/Users/test/.codex/sessions/thread-retry-many",
        preview: "Summarise document",
        source: "app-server",
        status: { type: "idle" },
        turns: [],
        updatedAt: 1774224000,
        agentNickname: null,
        agentRole: null,
        gitInfo: null,
      },
    });

    const thirdTurnStartRequest = await nextNonThreadListRequest(process, "Summarise document");
    expect(thirdTurnStartRequest.method).toBe("turn/start");
    process.respondSuccess(thirdTurnStartRequest.id, {
      turn: {
        error: null,
        id: "turn-retry-many",
        items: [],
        status: "inProgress",
      },
    });

    await expect(sendPromise).resolves.toMatchObject({
      id: "thread-retry-many",
      status: "running",
    });
  });

});

async function flushEvents() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function nextNonThreadListRequest(process: FakeAssistantProcess, preview: string) {
  let request = await process.nextRequest();

  while (request.method === "thread/list") {
    process.respondSuccess(request.id, {
      data: [
        {
          cliVersion: "0.0.0",
          createdAt: 1774224000,
          cwd: "/workspaces/alpha",
          ephemeral: false,
          id: "thread-1",
          modelProvider: "openai",
          name: null,
          path: "/Users/test/.codex/sessions/thread-1",
          preview,
          source: "app-server",
          status: { type: "active", activeFlags: [] },
          turns: [],
          updatedAt: 1774224000,
          agentNickname: null,
          agentRole: null,
          gitInfo: null,
        },
      ],
      nextCursor: null,
    });
    request = await process.nextRequest();
  }

  return request;
}
