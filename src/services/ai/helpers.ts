import { ReadChatActionReturnType } from "@/features/chats/actions/actions";
import { generateFileUrl } from "@/lib/utils";
import { ModelMessage } from "ai";
import { CustomUIMessage } from "./types";

export const COMPACT_AFTER_TOKENS = 55_000;

export const estimateTokens = (messages: ModelMessage[]) => {
  return JSON.stringify(messages).length / 4;
};

export const convertPersistedMessage = (
  msg: ReadChatActionReturnType["messages"][number],
): CustomUIMessage =>
  ({
    id: msg.clientMessageId,
    role: msg.role,
    parts: [
      ...msg.parts.map(({ part }) => part),
      ...(msg.attachments ?? []).map((attachment) => ({
        type: "file" as const,
        filename: attachment.fileName,
        mediaType: attachment.fileType ?? "application/octet-stream",
        url: generateFileUrl(attachment.storageKey),
        providerMetadata: {
          prododesk: {
            uploadId: attachment.id,
          },
        },
      })),
    ],
    metadata: {
      createdAt: msg.createdAt,
      modelId: msg.modelId,
      chatId: msg.chatId,
      runError: msg.chatRun?.error,
      responseTimeMs: msg.chatRun?.responseTimeMs,
      runStatus: msg.chatRun?.status,
      responseToClientId: msg.responseToClientId,
      artifacts: msg.chatRun?.artifacts,
      attachments: msg.attachments ?? [],
    },
  }) as unknown as CustomUIMessage;
