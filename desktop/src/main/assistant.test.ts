// @vitest-environment node

import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createAssistantRuntime } from "./assistant";

class FakeAssistantProcess extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  kill = vi.fn((signal?: NodeJS.Signals) => {
    this.emit("close", null, signal ?? "SIGTERM");
    return true;
  });
}

describe("assistant runtime", () => {
  it("runs Codex from the active workspace root and streams assistant deltas", () => {
    const process = new FakeAssistantProcess();
    const spawnProcess = vi.fn().mockReturnValue(process);
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-22T00:00:00.000Z",
      spawnProcess,
    });
    const threadEvents: string[] = [];

    runtime.onThreadChanged((event) => {
      if (event.thread.messages.length > 0) {
        threadEvents.push(event.thread.messages[event.thread.messages.length - 1]?.content ?? "");
      }
    });

    const thread = runtime.sendMessage({
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      noteRelativePath: "docs/Plan.md",
      content: "Summarize this note",
      documentTitle: "Plan",
      documentMarkdown: "Body.\n",
    });

    expect(spawnProcess).toHaveBeenCalledWith(
      "codex",
      expect.arrayContaining([
        "--ask-for-approval",
        "never",
        "exec",
        "--json",
        "--ephemeral",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "-C",
        "/workspaces/alpha",
      ]),
      expect.objectContaining({
        cwd: "/workspaces/alpha",
      }),
    );
    expect(spawnProcess.mock.calls[0]?.[1]).not.toContain("docs/Plan.md");
    expect(thread.status).toBe("running");
    expect(thread.messages).toEqual([
      {
        id: "user-1",
        role: "user",
        content: "Summarize this note",
        createdAt: "2026-03-22T00:00:00.000Z",
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "",
        createdAt: "2026-03-22T00:00:00.000Z",
      },
    ]);

    process.stderr.write("WARN noisy stderr line\n");
    process.stdout.write('{"type":"thread.started","thread_id":"123"}\n');
    process.stdout.write('{"type":"agent_message_delta","delta":"First "}\n');
    process.stdout.write('{"type":"agent_message_delta","delta":"answer."}\n');
    process.stdout.write('{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"First answer."}}\n');
    process.emit("close", 0, null);

    expect(runtime.getThread({
      workspacePath: "/workspaces/alpha",
      noteRelativePath: "docs/Plan.md",
    })).toEqual({
      noteRelativePath: "docs/Plan.md",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "Summarize this note",
          createdAt: "2026-03-22T00:00:00.000Z",
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "First answer.",
          createdAt: "2026-03-22T00:00:00.000Z",
        },
      ],
      status: "idle",
      errorMessage: null,
    });
    expect(threadEvents).toContain("First answer.");
  });

  it("surfaces assistant failures as a thread-local error", () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-22T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    runtime.sendMessage({
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      noteRelativePath: "README.md",
      content: "Help",
      documentTitle: "README",
      documentMarkdown: "Body.\n",
    });

    process.stdout.write('{"type":"error","message":"Network unavailable"}\n');
    process.emit("close", 1, null);

    expect(runtime.getThread({
      workspacePath: "/workspaces/alpha",
      noteRelativePath: "README.md",
    })).toEqual({
      noteRelativePath: "README.md",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "Help",
          createdAt: "2026-03-22T00:00:00.000Z",
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "",
          createdAt: "2026-03-22T00:00:00.000Z",
        },
      ],
      status: "error",
      errorMessage: "Network unavailable",
    });
  });

  it("cancels the active run and resets the thread state", () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-22T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    runtime.sendMessage({
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      noteRelativePath: "README.md",
      content: "Help",
      documentTitle: "README",
      documentMarkdown: "Body.\n",
    });

    runtime.cancelRun({
      workspacePath: "/workspaces/alpha",
      noteRelativePath: "README.md",
    });

    expect(process.kill).toHaveBeenCalledWith("SIGTERM");
    expect(runtime.getThread({
      workspacePath: "/workspaces/alpha",
      noteRelativePath: "README.md",
    })).toMatchObject({
      noteRelativePath: "README.md",
      status: "idle",
      errorMessage: null,
    });
  });

  it("migrates note conversation state after a rename", () => {
    const process = new FakeAssistantProcess();
    const runtime = createAssistantRuntime({
      createId: vi.fn()
        .mockReturnValueOnce("user-1")
        .mockReturnValueOnce("assistant-1"),
      now: () => "2026-03-22T00:00:00.000Z",
      spawnProcess: vi.fn().mockReturnValue(process),
    });

    runtime.sendMessage({
      workspacePath: "/workspaces/alpha",
      workspaceName: "alpha",
      noteRelativePath: "Draft.md",
      content: "Help",
      documentTitle: "Draft",
      documentMarkdown: "Body.\n",
    });
    process.emit("close", 0, null);

    runtime.migrateThread({
      workspacePath: "/workspaces/alpha",
      fromRelativePath: "Draft.md",
      toRelativePath: "Final.md",
    });

    expect(runtime.getThread({
      workspacePath: "/workspaces/alpha",
      noteRelativePath: "Final.md",
    })).toMatchObject({
      noteRelativePath: "Final.md",
      messages: [
        expect.objectContaining({
          role: "user",
          content: "Help",
        }),
        expect.objectContaining({
          role: "assistant",
        }),
      ],
    });
    expect(runtime.getThread({
      workspacePath: "/workspaces/alpha",
      noteRelativePath: "Draft.md",
    })).toMatchObject({
      noteRelativePath: "Draft.md",
      messages: [],
    });
  });
});
