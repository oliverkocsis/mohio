const OPENERS = [
  "Here is a lighter direction:",
  "A clean next step would be:",
  "I would frame it like this:",
  "For the next pass, consider:",
] as const;

const BODIES = [
  "Keep the document surface dominant and treat chat as a supporting workspace tool.",
  "Use clearer grouping in the left rail so nested folders stay readable without visual clutter.",
  "Preserve the calm spacing and rely on small status cues instead of adding more controls.",
  "If this becomes real later, the current mock structure is ready to swap to native Tauri commands.",
] as const;

const CLOSERS = [
  "This keeps the prototype believable without widening scope.",
  "That should maintain the Obsidian-inspired layout while staying simpler.",
  "It gives you a cleaner desktop rhythm and leaves room for future native features.",
  "That is enough for a convincing demo without introducing real integrations yet.",
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export function createMockAssistantReply(message: string): string {
  const topic = message.trim().split(/\s+/).slice(0, 6).join(" ");
  const quotedTopic = topic ? ` On "${topic}",` : "";

  return `${pick(OPENERS)}${quotedTopic} ${pick(BODIES)} ${pick(CLOSERS)}`;
}
