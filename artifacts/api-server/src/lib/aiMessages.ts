export type ChatMessage = { role: "user" | "assistant"; content: string };

function isChatTurn(value: unknown): value is { role: string; content: unknown } {
  return Boolean(value) && typeof value === "object";
}

/**
 * Anthropic Messages API requires:
 * - first turn is `user`
 * - roles strictly alternate (consecutive same-role turns are merged)
 *
 * The Chef AI widget seeds history with an assistant greeting, which would
 * otherwise 400 every first send.
 */
export function buildChatMessages(history: unknown, message: string): ChatMessage[] {
  const raw = Array.isArray(history) ? history.slice(-10) : [];
  const turns: ChatMessage[] = [];

  for (const item of raw) {
    if (!isChatTurn(item)) continue;
    const role = item.role;
    const content = typeof item.content === "string" ? item.content.trim() : "";
    if ((role !== "user" && role !== "assistant") || !content) continue;
    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n\n${content}`;
      continue;
    }
    turns.push({ role, content });
  }

  while (turns.length > 0 && turns[0].role !== "user") turns.shift();

  const trimmed = message.trim();
  const last = turns[turns.length - 1];
  if (last?.role === "user") {
    last.content = `${last.content}\n\n${trimmed}`;
  } else {
    turns.push({ role: "user", content: trimmed });
  }

  return turns;
}
