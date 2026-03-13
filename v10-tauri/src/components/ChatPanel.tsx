import type { ChatMessage } from "../types";
import { MessageIcon, SendIcon } from "./Icons";

interface ChatPanelProps {
  messages: ChatMessage[];
  composerValue: string;
  isResponding: boolean;
  onComposerChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatPanel({
  messages,
  composerValue,
  isResponding,
  onComposerChange,
  onSubmit,
}: ChatPanelProps) {
  return (
    <aside className="pane pane-chat" aria-label="Assistant chat">
      <div className="chat-header">
        <div className="chat-title-row">
          <span className="chat-icon-wrap">
            <MessageIcon width={18} height={18} />
          </span>
          <div>
            <span className="pane-eyebrow">Assistant</span>
            <h2>Workspace chat</h2>
          </div>
        </div>
        <p>Mock responses only. This panel is structured so real AI or Tauri commands can be added later.</p>
      </div>

      <div className="chat-thread" aria-label="Chat history">
        {messages.map((message) => (
          <article key={message.id} className="chat-message" data-role={message.role}>
            <div className="chat-message-meta">
              <strong>{message.role === "assistant" ? "Assistant" : "You"}</strong>
              <span>{message.timestamp}</span>
            </div>
            <p>{message.content}</p>
          </article>
        ))}

        {isResponding ? (
          <article className="chat-message" data-role="assistant" aria-live="polite">
            <div className="chat-message-meta">
              <strong>Assistant</strong>
              <span>typing</span>
            </div>
            <p className="typing-indicator">
              <span />
              <span />
              <span />
            </p>
          </article>
        ) : null}
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="workspace-switcher-label" htmlFor="chat-composer-input">
          Message the assistant
        </label>
        <textarea
          id="chat-composer-input"
          className="chat-input"
          rows={4}
          value={composerValue}
          placeholder="Ask for a summary, rewrite, or next-step idea..."
          onChange={(event) => onComposerChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        <div className="chat-composer-footer">
          <span>Enter to send</span>
          <button className="send-button" type="submit" disabled={!composerValue.trim() || isResponding}>
            <SendIcon width={16} height={16} />
            <span>Send</span>
          </button>
        </div>
      </form>
    </aside>
  );
}
