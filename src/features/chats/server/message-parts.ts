import { db, DbMutationOptions } from "@/db/db";
import {
  MessagePartInsertType,
  MessagePartTable,
} from "@/db/schemas/message-part";
import { findChatMessageDb } from "./chat-messages";
import { confirmChatOwnership } from "./chats";
import { revalidateChatCache } from "./cache/chats";

export const insertMessagePartDb = async (
  messagePart: MessagePartInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingMessage = await findChatMessageDb(messagePart.messageId, tx);
  if (!existingMessage) return null;

  const existingChat = await confirmChatOwnership(
    existingMessage.chatId,
    undefined,
    tx,
  );
  if (!existingChat) return null;

  const [insertedMessagePart] = await (tx ?? db)
    .insert(MessagePartTable)
    .values(messagePart)
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return insertedMessagePart;
};
