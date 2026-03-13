import type { FormEvent } from "react";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  workspaceName: string;
  messages: ChatMessage[];
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
}

export function ChatPanel({
  workspaceName,
  messages,
  value,
  onValueChange,
  onSend,
}: ChatPanelProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }

  return (
    <aside
      aria-label="Assistant chat"
      className="sidebar sidebar-right"
    >
      <div className="chat-panel-header">
        <div>
          <p className="sidebar-kicker">Workspace assistant</p>
          <h2>Chat</h2>
        </div>
        <span className="assistant-status">Mock replies</span>
      </div>

      <p className="chat-panel-copy">
        Ask for a summary, a tighter draft, or a clearer structure for{" "}
        <strong>{workspaceName}</strong>.
      </p>

      <div
        aria-label="Chat thread"
        className="chat-thread"
      >
        {messages.map((message) => (
          <article className={`chat-message ${message.role}`} key={message.id}>
            <div className="chat-message-header">
              <span>{message.role === "assistant" ? "Assistant" : "You"}</span>
              <span>{message.createdAt}</span>
            </div>
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <label className="sidebar-select-label" htmlFor="message-input">
          Message input
        </label>
        <textarea
          className="chat-input"
          id="message-input"
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Ask for a summary, rewrite, or next draft."
          rows={4}
          value={value}
        />
        <button className="primary-button" type="submit">
          Send
        </button>
      </form>
    </aside>
  );
}
