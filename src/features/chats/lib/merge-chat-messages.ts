import type { CustomUIMessage } from "@/services/ai/types";

export const mergeChatMessages = (
  current: CustomUIMessage[],
  incoming: CustomUIMessage[],
): CustomUIMessage[] => {
  if (!incoming.length) return current;

  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  const createdAt = (message: CustomUIMessage) => {
    if (!message.metadata?.createdAt) return Number.POSITIVE_INFINITY;
    const timestamp = new Date(message.metadata.createdAt).getTime();
    return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
  };

  return Array.from(byId.values()).sort((a, b) => createdAt(a) - createdAt(b));
};
