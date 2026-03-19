import { Search, Plus, BookOpen, GitBranch, Share2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  workspaceName: string;
  currentFileTitle: string;
  onWorkspaceChange?: (workspace: string) => void;
}

const SAMPLE_WORKSPACES = [
  "My Workspace",
  "Project Notes",
  "Research",
  "Personal",
  "Work",
];

export function TopBar({ workspaceName, currentFileTitle, onWorkspaceChange }: TopBarProps) {
  return (
    <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 gap-4">
      {/* Left - Workspace and file info */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            {/* Workspace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {workspaceName}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {SAMPLE_WORKSPACES.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace}
                    onClick={() => onWorkspaceChange?.(workspace)}
                    className={workspaceName === workspace ? "bg-accent" : ""}
                  >
                    {workspace}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm font-medium text-foreground truncate">{currentFileTitle}</p>
          </div>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex items-center flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search notes..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title="Create checkpoint"
        >
          <GitBranch className="w-4 h-4" />
          <span className="hidden md:inline text-sm">Checkpoint</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title="Create new note"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline text-sm">New note</span>
        </Button>
        <Button
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
          title="Publish note"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden md:inline text-sm">Publish</span>
        </Button>
      </div>
    </div>
  );
}
