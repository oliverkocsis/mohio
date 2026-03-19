import { Search, Plus, MoreVertical, Pin, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import type { Note } from '../App';

interface LeftSidebarProps {
  notes: Note[];
  currentNoteId: string;
  onNoteSelect: (noteId: string) => void;
  onNoteCreate: () => void;
  onNoteRename: (noteId: string, newTitle: string) => void;
  onNoteDelete: (noteId: string) => void;
  onNotePinToggle: (noteId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function LeftSidebar({
  notes,
  currentNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteRename,
  onNoteDelete,
  onNotePinToggle,
  searchQuery,
  onSearchChange,
}: LeftSidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const pinnedNotes = notes.filter(n => n.isPinned);
  const unpinnedNotes = notes.filter(n => !n.isPinned);

  const handleRenameStart = (note: Note) => {
    setRenamingId(note.id);
    setRenameValue(note.title);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = (noteId: string) => {
    if (renameValue.trim()) {
      onNoteRename(noteId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNoteItem = (note: Note) => {
    const isActive = note.id === currentNoteId;
    const isRenaming = renamingId === note.id;

    return (
      <div
        key={note.id}
        className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isActive ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'
        }`}
        onClick={() => !isRenaming && onNoteSelect(note.id)}
      >
        {note.isPinned && <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />}
        
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleRenameSubmit(note.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit(note.id);
              if (e.key === 'Escape') setRenamingId(null);
            }}
            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{note.title}</div>
              <div className="text-xs text-gray-500">{formatDate(note.updatedAt)}</div>
            </div>
            
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === note.id ? null : note.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
              
              {openMenuId === note.id && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameStart(note);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNotePinToggle(note.id);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pin className="w-4 h-4" />
                    {note.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNoteDelete(note.id);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={onNoteCreate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New note
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {pinnedNotes.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              Pinned
            </h3>
            <div className="space-y-1">
              {pinnedNotes.map(renderNoteItem)}
            </div>
          </div>
        )}
        
        {unpinnedNotes.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              {pinnedNotes.length > 0 ? 'All Notes' : 'Notes'}
            </h3>
            <div className="space-y-1">
              {unpinnedNotes.map(renderNoteItem)}
            </div>
          </div>
        )}
        
        {notes.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No notes yet. Create your first note to get started.
          </div>
        )}
      </div>
    </div>
  );
}
