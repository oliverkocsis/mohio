import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { RightSidebar } from './components/RightSidebar';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  isPinned?: boolean;
}

export interface Checkpoint {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to Mohio',
    content: `# Welcome to Mohio

Mohio is your local Markdown workspace for writing, organizing, and publishing notes with embedded AI assistance.

## Getting Started

- Create new notes from the sidebar or top bar
- Edit Markdown directly with live styling
- Use the AI agent for assistance
- Create checkpoints to save versions
- Publish when you're ready

## Features

- **Styled Markdown editing** - Write in Markdown with visual formatting
- **AI assistance** - Get help summarizing, rewriting, or expanding your notes
- **Version control** - Create named checkpoints to track changes
- **Publishing** - Publish your work when it's ready
- **Search** - Find notes quickly by name or content

Start writing!`,
    updatedAt: new Date('2026-03-14T10:00:00'),
    isPinned: true,
  },
  {
    id: '2',
    title: 'Project Ideas',
    content: `# Project Ideas

## Q1 Goals

- Launch new documentation site
- Improve onboarding flow
- Add mobile support

## Research Topics

- User feedback from beta testers
- Competitive analysis
- Feature prioritization

## Next Steps

1. Schedule team meeting
2. Review user interviews
3. Draft proposal`,
    updatedAt: new Date('2026-03-13T15:30:00'),
  },
  {
    id: '3',
    title: 'Meeting Notes - March 12',
    content: `# Team Meeting - March 12, 2026

**Attendees:** Sarah, Michael, Lisa, James

## Discussion Points

### Product Roadmap
- Reviewed Q1 milestones
- Discussed feature requests from users
- Prioritized bug fixes

### Action Items
- [ ] Sarah: Update design mockups
- [ ] Michael: Review backend performance
- [ ] Lisa: Conduct user interviews
- [ ] James: Write documentation

## Next Meeting
March 19, 2026 at 2:00 PM`,
    updatedAt: new Date('2026-03-12T16:45:00'),
  },
];

function App() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [currentNoteId, setCurrentNoteId] = useState<string>(initialNotes[0].id);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceName] = useState('My Workspace');
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  const currentNote = notes.find(n => n.id === currentNoteId) || notes[0];

  const handleNoteCreate = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '',
      updatedAt: new Date(),
    };
    setNotes([newNote, ...notes]);
    setCurrentNoteId(newNote.id);
  };

  const handleNoteSelect = (noteId: string) => {
    setCurrentNoteId(noteId);
    // Reset chat when switching notes
    setMessages([]);
  };

  const handleNoteUpdate = (title: string, content: string) => {
    setNotes(notes.map(note =>
      note.id === currentNoteId
        ? { ...note, title, content, updatedAt: new Date() }
        : note
    ));
  };

  const handleNoteRename = (noteId: string, newTitle: string) => {
    setNotes(notes.map(note =>
      note.id === noteId ? { ...note, title: newTitle } : note
    ));
  };

  const handleNoteDelete = (noteId: string) => {
    const filteredNotes = notes.filter(n => n.id !== noteId);
    setNotes(filteredNotes);
    if (currentNoteId === noteId && filteredNotes.length > 0) {
      setCurrentNoteId(filteredNotes[0].id);
    }
  };

  const handleNotePinToggle = (noteId: string) => {
    setNotes(notes.map(note =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const handleCheckpointCreate = (name: string) => {
    const checkpoint: Checkpoint = {
      id: Date.now().toString(),
      name,
      content: currentNote.content,
      createdAt: new Date(),
    };
    setCheckpoints([checkpoint, ...checkpoints]);
  };

  const handleCheckpointRestore = (checkpointId: string) => {
    const checkpoint = checkpoints.find(c => c.id === checkpointId);
    if (checkpoint) {
      handleNoteUpdate(currentNote.title, checkpoint.content);
    }
  };

  const handlePublish = () => {
    setPublishStatus('Published');
    setTimeout(() => setPublishStatus(null), 3000);
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: getAgentResponse(content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  const getAgentResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    if (lower.includes('summarize')) {
      return `I can help summarize your note. The main points in "${currentNote.title}" are:\n\n${getSummary(currentNote.content)}`;
    } else if (lower.includes('expand') || lower.includes('elaborate')) {
      return `I can help expand this section. Would you like me to:\n- Add more details and examples\n- Include related research\n- Expand on specific points`;
    } else if (lower.includes('rewrite') || lower.includes('improve')) {
      return `I can help improve your writing by:\n- Making it more concise\n- Improving clarity\n- Enhancing flow and structure`;
    } else {
      return `I'm here to help with your note "${currentNote.title}". I can:\n- Summarize content\n- Expand sections\n- Rewrite for clarity\n- Organize information\n- Suggest improvements\n\nWhat would you like me to do?`;
    }
  };

  const getSummary = (content: string): string => {
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    return lines.slice(0, 3).join('\n') || 'This note is ready for content.';
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      <TopBar
        workspaceName={workspaceName}
        currentNoteTitle={currentNote.title}
        onNewNote={handleNoteCreate}
        onCreateCheckpoint={() => handleCheckpointCreate(`Checkpoint ${checkpoints.length + 1}`)}
        onPublish={handlePublish}
        onSearch={setSearchQuery}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          notes={filteredNotes}
          currentNoteId={currentNoteId}
          onNoteSelect={handleNoteSelect}
          onNoteCreate={handleNoteCreate}
          onNoteRename={handleNoteRename}
          onNoteDelete={handleNoteDelete}
          onNotePinToggle={handleNotePinToggle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <MarkdownEditor
          title={currentNote.title}
          content={currentNote.content}
          onUpdate={handleNoteUpdate}
        />
        
        <RightSidebar
          messages={messages}
          checkpoints={checkpoints}
          publishStatus={publishStatus}
          onSendMessage={handleSendMessage}
          onRestoreCheckpoint={handleCheckpointRestore}
          onCreateCheckpoint={handleCheckpointCreate}
        />
      </div>
    </div>
  );
}

export default App;
