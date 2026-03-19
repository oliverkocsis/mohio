import { Search, Plus, Bookmark, Upload } from 'lucide-react';

interface TopBarProps {
  workspaceName: string;
  currentNoteTitle: string;
  onNewNote: () => void;
  onCreateCheckpoint: () => void;
  onPublish: () => void;
  onSearch: (query: string) => void;
}

export function TopBar({
  workspaceName,
  currentNoteTitle,
  onNewNote,
  onCreateCheckpoint,
  onPublish,
  onSearch,
}: TopBarProps) {
  return (
    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{workspaceName}</span>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{currentNoteTitle}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search</span>
        </button>
        
        <button
          onClick={onNewNote}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">New note</span>
        </button>
        
        <button
          onClick={onCreateCheckpoint}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden md:inline">Create checkpoint</span>
        </button>
        
        <button
          onClick={onPublish}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Publish</span>
        </button>
      </div>
    </div>
  );
}
