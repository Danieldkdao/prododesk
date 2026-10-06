import { ModelMessage, pruneMessages } from "ai";
import { COMPACT_AFTER_TOKENS, estimateTokens } from "./helpers";

export const compactMessages = (messages: ModelMessage[]): ModelMessage[] => {
  if (estimateTokens(messages) <= COMPACT_AFTER_TOKENS) return messages;
  let compacted = pruneMessages({
    messages,
    reasoning: "all",
    toolCalls: "before-last-3-messages",
    emptyMessages: "remove",
  });
  const targetTokens = COMPACT_AFTER_TOKENS - 10_000;
  let omitted = false;
  while (estimateTokens(compacted) > targetTokens) {
    const nextTurn = compacted.findIndex(
      (message, index) => index > 0 && message.role === "user",
    );
    if (nextTurn < 0) break;
    compacted = compacted.slice(nextTurn);
    omitted = true;
  }
  if (estimateTokens(compacted) > COMPACT_AFTER_TOKENS) {
    throw new Error(
      "This exchange is too large to continue. Please shorten your message or start a new chat.",
    );
  }
  if (omitted) {
    const notice =
      "[Earlier exchanges were omitted to keep this conversation within its context limit. Ask the user for missing details when needed.]\n\n";
    const first = compacted[0];
    if (first?.role === "user") {
      compacted[0] = {
        ...first,
        content:
          typeof first.content === "string"
            ? notice + first.content
            : [{ type: "text", text: notice }, ...first.content],
      };
    }
  }
  return compacted;
};
