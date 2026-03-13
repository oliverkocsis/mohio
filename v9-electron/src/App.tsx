import { useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentSurface } from "./components/DocumentSurface";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar";
import { MOCK_ASSISTANT_REPLIES, seededWorkspaces } from "./data/workspaces";
import type { ChatMessage, Workspace } from "./types";

const desktopMeta = window.mohioDesktop ?? {
  appVersion: "0.1.0",
  electronVersion: "browser-preview",
  platform: "web",
};

let messageSequence = 0;

function createMessageId(prefix: string) {
  messageSequence += 1;
  return `${prefix}-${messageSequence}`;
}

function getTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findWorkspace(workspaceId: string) {
  return seededWorkspaces.find((workspace) => workspace.id === workspaceId) ?? seededWorkspaces[0];
}

function findDocument(workspace: Workspace, fileId: string) {
  return workspace.documents.find((document) => document.id === fileId) ?? workspace.documents[0];
}

export default function App() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(seededWorkspaces[0].id);
  const activeWorkspace = useMemo(() => findWorkspace(activeWorkspaceId), [activeWorkspaceId]);
  const [selectedFileId, setSelectedFileId] = useState(activeWorkspace.initialFileId);
  const [expandedFolderIds, setExpandedFolderIds] = useState(activeWorkspace.defaultExpandedFolderIds);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(activeWorkspace.chatMessages);
  const [composerValue, setComposerValue] = useState("");
  const messageTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    setSelectedFileId(activeWorkspace.initialFileId);
    setExpandedFolderIds(activeWorkspace.defaultExpandedFolderIds);
    setChatMessages(activeWorkspace.chatMessages);
    setComposerValue("");
  }, [activeWorkspace]);

  useEffect(
    () => () => {
      messageTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    },
    [],
  );

  const selectedDocument = useMemo(
    () => findDocument(activeWorkspace, selectedFileId),
    [activeWorkspace, selectedFileId],
  );

  function clearPendingReplies() {
    messageTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    messageTimeoutsRef.current = [];
  }

  function handleToggleFolder(folderId: string) {
    setExpandedFolderIds((current) =>
      current.includes(folderId) ? current.filter((id) => id !== folderId) : [...current, folderId],
    );
  }

  function handleSendMessage() {
    const trimmed = composerValue.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: trimmed,
      createdAt: getTimestamp(),
    };

    setChatMessages((current) => [...current, userMessage]);
    setComposerValue("");

    const reply = MOCK_ASSISTANT_REPLIES[Math.floor(Math.random() * MOCK_ASSISTANT_REPLIES.length)];
    const timeoutId = window.setTimeout(() => {
      setChatMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: reply,
          createdAt: getTimestamp(),
        },
      ]);
      messageTimeoutsRef.current = messageTimeoutsRef.current.filter((entry) => entry !== timeoutId);
    }, 480);

    messageTimeoutsRef.current.push(timeoutId);
  }

  return (
    <div className="app-shell">
      <WorkspaceSidebar
        workspaces={seededWorkspaces}
        activeWorkspaceId={activeWorkspace.id}
        activeWorkspaceName={activeWorkspace.name}
        activeWorkspaceDescription={activeWorkspace.description}
        selectedFileId={selectedDocument.id}
        expandedFolderIds={expandedFolderIds}
        tree={activeWorkspace.tree}
        desktopMeta={desktopMeta}
        onWorkspaceChange={(workspaceId) => {
          clearPendingReplies();
          setActiveWorkspaceId(workspaceId);
        }}
        onToggleFolder={handleToggleFolder}
        onSelectFile={setSelectedFileId}
      />

      <DocumentSurface
        workspaceName={activeWorkspace.name}
        document={selectedDocument}
      />

      <ChatPanel
        workspaceName={activeWorkspace.name}
        messages={chatMessages}
        value={composerValue}
        onValueChange={setComposerValue}
        onSend={handleSendMessage}
      />
    </div>
  );
}
