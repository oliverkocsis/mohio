import { useState, useRef, useEffect } from "react";
import { Bold, Italic, Code, Heading2, List, Quote, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export function Editor({ initialContent = "", onContentChange }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState("Untitled Note");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onContentChange?.(content);
  }, [content, onContentChange]);

  const insertMarkdown = (before: string, after: string = "") => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newContent);

    // Restore selection/cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const toolbarButtons = [
    { icon: Heading2, label: "Heading", action: () => insertMarkdown("## ") },
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ") },
    { icon: List, label: "List", action: () => insertMarkdown("- ") },
    { icon: LinkIcon, label: "Link", action: () => insertMarkdown("[", "](url)") },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="border-b border-border px-8 py-3 flex gap-1 items-center flex-wrap">
        {toolbarButtons.map((btn) => (
          <Button
            key={btn.label}
            variant="ghost"
            size="sm"
            title={btn.label}
            onClick={btn.action}
            className="gap-2 h-8 px-2"
          >
            <btn.icon className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">{btn.label}</span>
          </Button>
        ))}
      </div>

      {/* Title Input */}
      <div className="px-8 py-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-3xl font-bold text-foreground bg-transparent outline-none w-full placeholder-muted-foreground"
          placeholder="Note title"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          className="w-full h-full p-8 font-base text-base bg-background text-foreground outline-none resize-none"
          spellCheck="true"
        />
      </div>
    </div>
  );
}
