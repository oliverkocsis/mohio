import { Search, Plus, FileText, Clock, Star, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteFile {
  id: string;
  title: string;
  isPinned?: boolean;
  updatedAt: Date;
}

interface LeftSidebarProps {
  activeFileId?: string;
  onSelectFile: (id: string) => void;
  onNewNote: () => void;
}

// Sample data - would come from state management
const SAMPLE_FILES: NoteFile[] = [
  { id: "1", title: "Welcome to Mohio", updatedAt: new Date(), isPinned: true },
  { id: "2", title: "Getting Started Guide", updatedAt: new Date(Date.now() - 86400000) },
  { id: "3", title: "Project Ideas", updatedAt: new Date(Date.now() - 172800000) },
  { id: "4", title: "Notes on AI", updatedAt: new Date(Date.now() - 259200000) },
];

export function LeftSidebar({ activeFileId = "1", onSelectFile, onNewNote }: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const filteredFiles = SAMPLE_FILES.filter(
    (file) =>
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.id.includes(searchQuery)
  );

  const pinnedFiles = filteredFiles.filter((f) => f.isPinned);
  const recentFiles = filteredFiles.filter((f) => !f.isPinned);

  const handleRename = (id: string, currentTitle: string) => {
    setRenaming(id);
    setNewTitle(currentTitle);
  };

  const confirmRename = (id: string) => {
    // In a real app, this would update state/database
    setRenaming(null);
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {pinnedFiles.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Pinned
            </div>
            {pinnedFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                isActive={activeFileId === file.id}
                isRenaming={renaming === file.id}
                newTitle={newTitle}
                onSelect={() => onSelectFile(file.id)}
                onRename={() => handleRename(file.id, file.title)}
                onConfirmRename={() => confirmRename(file.id)}
                onTitleChange={setNewTitle}
              />
            ))}
          </div>
        )}

        {recentFiles.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Recent
            </div>
            {recentFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                isActive={activeFileId === file.id}
                isRenaming={renaming === file.id}
                newTitle={newTitle}
                onSelect={() => onSelectFile(file.id)}
                onRename={() => handleRename(file.id, file.title)}
                onConfirmRename={() => confirmRename(file.id)}
                onTitleChange={setNewTitle}
              />
            ))}
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-sidebar-foreground/30" />
            <p className="text-sm text-sidebar-foreground/50">No notes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface FileRowProps {
  file: NoteFile;
  isActive: boolean;
  isRenaming: boolean;
  newTitle: string;
  onSelect: () => void;
  onRename: () => void;
  onConfirmRename: () => void;
  onTitleChange: (title: string) => void;
}

function FileRow({
  file,
  isActive,
  isRenaming,
  newTitle,
  onSelect,
  onRename,
  onConfirmRename,
  onTitleChange,
}: FileRowProps) {
  const timeAgo = getTimeAgo(file.updatedAt);

  return (
    <div
      className={`px-4 py-3 flex items-center gap-2 cursor-pointer transition-colors ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
      }`}
      onClick={onSelect}
    >
      <FileText className="w-4 h-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirmRename();
              if (e.key === "Escape") onTitleChange(file.title);
            }}
            onBlur={onConfirmRename}
            className="w-full bg-background text-foreground rounded px-2 py-1 text-sm border border-border"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{file.title}</p>
            <p className="text-xs text-sidebar-foreground/60">{timeAgo}</p>
          </>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
