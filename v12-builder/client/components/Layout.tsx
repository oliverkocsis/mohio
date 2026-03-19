import { useState } from "react";
import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { Editor } from "./Editor";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  workspaceName?: string;
  children?: React.ReactNode;
}

export function Layout({ workspaceName: initialWorkspace = "My Workspace" }: LayoutProps) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [activeFileId, setActiveFileId] = useState("1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [editorContent, setEditorContent] = useState(
    `# Welcome to Mohio

Mohio is a local Markdown workspace for writing, organizing, and publishing notes with embedded AI assistance.

## Getting Started

Write your notes in Markdown. You'll see a live preview on the right side as you type.

- Create new notes from the sidebar
- Use the agent for help with writing
- Create checkpoints to track versions
- Publish when you're ready

## Features

### Writing
- Clean, focused editor
- Live Markdown preview
- Built-in formatting toolbar

### Organization
- File navigation sidebar
- Search and filter
- Pin important notes

### AI Assistance
- Ask the agent for help
- Summarize, rewrite, expand
- Get suggestions and feedback

Happy writing!`
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <TopBar
        workspaceName={workspace}
        currentFileTitle="Welcome to Mohio"
        onWorkspaceChange={setWorkspace}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Mobile toggle */}
        <div className="hidden md:flex">
          <LeftSidebar
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onNewNote={() => console.log("New note")}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-14 bottom-0 w-72 z-50">
              <LeftSidebar
                activeFileId={activeFileId}
                onSelectFile={(id) => {
                  setActiveFileId(id);
                  setSidebarOpen(false);
                }}
                onNewNote={() => console.log("New note")}
              />
            </div>
          </div>
        )}

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Header Controls */}
          <div className="md:hidden flex gap-2 p-2 border-b border-border bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="ml-auto"
            >
              {rightSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          {/* Editor */}
          <Editor
            initialContent={editorContent}
            onContentChange={setEditorContent}
          />
        </div>

        {/* Right Sidebar - Desktop only, or mobile overlay */}
        <div className="hidden md:flex">
          <RightSidebar />
        </div>

        {/* Mobile overlay for right sidebar */}
        {rightSidebarOpen && (
          <div className="fixed right-0 top-14 bottom-0 w-72 z-40 md:hidden bg-sidebar border-l border-sidebar-border overflow-y-auto">
            <RightSidebar />
          </div>
        )}
      </div>
    </div>
  );
}
