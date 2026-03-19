import { useState } from 'react';
import { Send, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { Message, Checkpoint } from '../App';

interface RightSidebarProps {
  messages: Message[];
  checkpoints: Checkpoint[];
  publishStatus: string | null;
  onSendMessage: (content: string) => void;
  onRestoreCheckpoint: (checkpointId: string) => void;
  onCreateCheckpoint: (name: string) => void;
}

export function RightSidebar({
  messages,
  checkpoints,
  publishStatus,
  onSendMessage,
  onRestoreCheckpoint,
  onCreateCheckpoint,
}: RightSidebarProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'agent' | 'checkpoints'>('agent');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  const handleCreateCheckpoint = () => {
    if (newCheckpointName.trim()) {
      onCreateCheckpoint(newCheckpointName.trim());
      setNewCheckpointName('');
      setIsCreatingCheckpoint(false);
    }
  };

  const suggestions = [
    'Summarize this note',
    'Improve the introduction',
    'Expand the key points section',
    'Rewrite for clarity',
    'Add more examples',
    'Create an outline',
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatCheckpointDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today at ${formatTime(date)}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'agent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Agent
          </div>
        </button>
        <button
          onClick={() => setActiveTab('checkpoints')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'checkpoints'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Checkpoints
          </div>
        </button>
      </div>

      {/* Agent Tab */}
      {activeTab === 'agent' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Ask the AI agent for help with your note.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 py-2"
                >
                  Suggested actions
                  {showSuggestions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showSuggestions && (
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask the agent..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Checkpoints Tab */}
      {activeTab === 'checkpoints' && (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {publishStatus && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">{publishStatus}</span>
              </div>
            )}

            <div className="mb-4">
              {isCreatingCheckpoint ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCheckpointName}
                    onChange={(e) => setNewCheckpointName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCheckpoint();
                      if (e.key === 'Escape') setIsCreatingCheckpoint(false);
                    }}
                    placeholder="Checkpoint name..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCheckpoint}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setIsCreatingCheckpoint(false)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingCheckpoint(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create Checkpoint
                </button>
              )}
            </div>

            <div className="space-y-2">
              {checkpoints.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No checkpoints yet. Create one to save a version of this note.</p>
                </div>
              ) : (
                checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {checkpoint.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCheckpointDate(checkpoint.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => onRestoreCheckpoint(checkpoint.id)}
                        className="px-2 py-1 text-xs bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
