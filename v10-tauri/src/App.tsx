import { useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentSurface } from "./components/DocumentSurface";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar";
import { WORKSPACES } from "./data/workspaces";
import { createMockAssistantReply } from "./lib/mock-assistant";
import type { ChatMessage, WorkspaceData } from "./types";

function getWorkspaceById(workspaceId: string): WorkspaceData {
  return WORKSPACES.find((workspace) => workspace.id === workspaceId) ?? WORKSPACES[0];
}

function createTimestamp() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default function App() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(WORKSPACES[0].id);
  const workspace = useMemo(() => getWorkspaceById(activeWorkspaceId), [activeWorkspaceId]);

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(WORKSPACES[0].defaultExpandedFolderIds),
  );
  const [selectedFileId, setSelectedFileId] = useState(WORKSPACES[0].initialFileId);
  const [messages, setMessages] = useState<ChatMessage[]>(WORKSPACES[0].chatSeed);
  const [composerValue, setComposerValue] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const responseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setExpandedFolderIds(new Set(workspace.defaultExpandedFolderIds));
    setSelectedFileId(workspace.initialFileId);
    setMessages(workspace.chatSeed);
    setComposerValue("");
    setIsResponding(false);

    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, [workspace]);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current !== null) {
        window.clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const document = workspace.documents[selectedFileId] ?? workspace.documents[workspace.initialFileId];

  function handleToggleFolder(folderId: string) {
    setExpandedFolderIds((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  }

  function handleSubmitChat() {
    const value = composerValue.trim();
    if (!value || isResponding) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: value,
      timestamp: createTimestamp(),
    };

    setMessages((current) => [...current, nextUserMessage]);
    setComposerValue("");
    setIsResponding(true);

    responseTimeoutRef.current = window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: createMockAssistantReply(value),
        timestamp: createTimestamp(),
      };

      setMessages((current) => [...current, assistantMessage]);
      setIsResponding(false);
      responseTimeoutRef.current = null;
    }, 650);
  }

  return (
    <div className="app-frame">
      <div className="desktop-shell">
        <WorkspaceSidebar
          workspace={workspace}
          workspaces={WORKSPACES}
          expandedFolderIds={expandedFolderIds}
          selectedFileId={document.id}
          onToggleFolder={handleToggleFolder}
          onSelectFile={setSelectedFileId}
          onWorkspaceChange={setActiveWorkspaceId}
        />

        <DocumentSurface document={document} />

        <ChatPanel
          messages={messages}
          composerValue={composerValue}
          isResponding={isResponding}
          onComposerChange={setComposerValue}
          onSubmit={handleSubmitChat}
        />
      </div>
    </div>
  );
}
