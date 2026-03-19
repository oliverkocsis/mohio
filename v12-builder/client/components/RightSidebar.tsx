import { MessageCircle, BookmarkCheck, Zap, Send, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface Checkpoint {
  id: string;
  name: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_CHECKPOINTS: Checkpoint[] = [
  { id: "1", name: "Initial draft", createdAt: new Date(Date.now() - 3600000) },
  { id: "2", name: "Added introduction", createdAt: new Date(Date.now() - 7200000) },
  { id: "3", name: "Restructured sections", createdAt: new Date(Date.now() - 86400000) },
];

const AGENT_SUGGESTIONS = [
  { icon: Zap, label: "Summarize", action: "summarize" },
  { icon: Zap, label: "Expand", action: "expand" },
  { icon: Zap, label: "Rewrite", action: "rewrite" },
  { icon: Zap, label: "Fix grammar", action: "fix" },
];

export function RightSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Hi! I can help you improve your writing. What would you like help with?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("assistant");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: String(messages.length + 1),
      role: "user",
      content: inputValue,
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate agent response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          role: "assistant",
          content: "I'm processing your request. In a real app, this would be powered by an AI agent.",
        },
      ]);
    }, 500);
  };

  const handleSuggestion = (label: string) => {
    setInputValue(`Can you ${label.toLowerCase()} this?`);
  };

  return (
    <div className="w-96 bg-sidebar border-l border-sidebar-border flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 h-full">
        <TabsList className="w-full bg-sidebar border-b border-sidebar-border rounded-none justify-start px-4 h-auto py-0 gap-0">
          <TabsTrigger
            value="assistant"
            className="gap-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground px-4 py-3 hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Assistant
          </TabsTrigger>
          <TabsTrigger
            value="explore"
            className="gap-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground px-4 py-3 hover:text-foreground transition-colors"
          >
            <Zap className="w-4 h-4" />
            Explore
          </TabsTrigger>
          <TabsTrigger
            value="checkpoints"
            className="gap-2 text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground px-4 py-3 hover:text-foreground transition-colors"
          >
            <BookmarkCheck className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Assistant Chat Tab */}
        <TabsContent value="assistant" className="flex-1 flex flex-col overflow-hidden pb-0">
          {/* Suggestions */}
          <div className="p-4 border-b border-sidebar-border">
            <p className="text-xs font-semibold text-sidebar-foreground/60 mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {AGENT_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion.action}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-2"
                  onClick={() => handleSuggestion(suggestion.label)}
                >
                  <suggestion.icon className="w-3 h-3" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-sidebar-accent text-sidebar-accent-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Explore Tab */}
        <TabsContent value="explore" className="flex-1 flex flex-col overflow-hidden pb-0">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-sidebar-foreground">Browse Related Notes</p>
                <p className="text-xs text-sidebar-foreground/60 mt-1">Find connected ideas and references</p>
              </div>
              <div className="p-3 rounded-lg border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-sidebar-foreground">Writing Statistics</p>
                <p className="text-xs text-sidebar-foreground/60 mt-1">Word count, reading time, topics</p>
              </div>
              <div className="p-3 rounded-lg border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-sidebar-foreground">Outline View</p>
                <p className="text-xs text-sidebar-foreground/60 mt-1">Navigate your document structure</p>
              </div>
              <div className="p-3 rounded-lg border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
                <p className="text-sm font-medium text-sidebar-foreground">Referenced By</p>
                <p className="text-xs text-sidebar-foreground/60 mt-1">Notes that link to this one</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Checkpoints Tab */}
        <TabsContent value="checkpoints" className="flex-1 flex flex-col overflow-hidden pb-0">
          <div className="flex-1 overflow-y-auto">
            {SAMPLE_CHECKPOINTS.length > 0 ? (
              <div className="p-4 space-y-2">
                {SAMPLE_CHECKPOINTS.map((checkpoint, index) => (
                  <button
                    key={checkpoint.id}
                    className="w-full text-left p-3 rounded-lg border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {index === 0 ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Clock className="w-4 h-4 text-sidebar-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-sidebar-foreground">{checkpoint.name}</p>
                        <p className="text-xs text-sidebar-foreground/60">
                          {checkpoint.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <BookmarkCheck className="w-8 h-8 mx-auto mb-2 text-sidebar-foreground/30" />
                <p className="text-sm text-sidebar-foreground/50">No checkpoints yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Input - Sticky at bottom for Assistant tab only */}
        {activeTab === "assistant" && (
          <div className="border-t border-sidebar-border bg-sidebar p-4 flex gap-2 flex-shrink-0">
            <Input
              placeholder="Ask the assistant..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="text-sm h-9 bg-background border-border"
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Tabs>
    </div>
  );
}
