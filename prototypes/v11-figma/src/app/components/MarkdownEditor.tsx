import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Strikethrough, Code, Link } from 'lucide-react';

interface MarkdownEditorProps {
  title: string;
  content: string;
  onUpdate: (title: string, content: string) => void;
}

export function MarkdownEditor({ title, content, onUpdate }: MarkdownEditorProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalTitle(title);
    setLocalContent(content);
  }, [title, content]);

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    onUpdate(newTitle, localContent);
  };

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onUpdate(localTitle, newContent);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    const newContent =
      localContent.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      localContent.substring(end);

    handleContentChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderStyledContent = () => {
    const lines = localContent.split('\n');
    return lines.map((line, index) => {
      let className = 'min-h-[1.5em]';
      
      // Headings
      if (line.startsWith('# ')) {
        className = 'text-3xl font-semibold mt-6 mb-3';
      } else if (line.startsWith('## ')) {
        className = 'text-2xl font-semibold mt-5 mb-2';
      } else if (line.startsWith('### ')) {
        className = 'text-xl font-semibold mt-4 mb-2';
      } else if (line.startsWith('#### ')) {
        className = 'text-lg font-semibold mt-3 mb-1';
      }
      // Lists
      else if (line.match(/^(\s*)-\s/) || line.match(/^(\s*)\*\s/) || line.match(/^(\s*)\d+\.\s/)) {
        className = 'ml-4';
      }
      // Blockquotes
      else if (line.startsWith('> ')) {
        className = 'border-l-4 border-gray-300 pl-4 italic text-gray-700';
      }
      // Code blocks
      else if (line.startsWith('```')) {
        className = 'bg-gray-100 px-2 py-1 rounded font-mono text-sm';
      }

      return (
        <div key={index} className={className}>
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="border-b border-gray-200 px-8 py-4">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full text-3xl font-semibold focus:outline-none"
        />
      </div>

      <div className="border-b border-gray-200 px-8 py-2 flex items-center gap-1">
        <button
          onClick={() => insertMarkdown('**', '**')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => insertMarkdown('_', '_')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => insertMarkdown('~~', '~~')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => insertMarkdown('`', '`')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Inline code"
        >
          <Code className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => insertMarkdown('[', '](url)')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Link"
        >
          <Link className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing..."
              className="w-full min-h-[600px] resize-none focus:outline-none bg-transparent absolute inset-0 z-10 text-transparent caret-black selection:bg-blue-200 selection:text-transparent font-sans"
              style={{
                lineHeight: '1.5em',
                fontFamily: 'inherit',
                fontSize: 'inherit',
              }}
              spellCheck
            />
            <div
              className="w-full min-h-[600px] pointer-events-none relative z-0 whitespace-pre-wrap break-words"
              style={{
                lineHeight: '1.5em',
              }}
            >
              {renderStyledContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
