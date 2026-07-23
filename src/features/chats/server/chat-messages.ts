import { db, DbTransaction } from "@/db/db";
import { ChatMessageInsertType, ChatMessageTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateChatCache } from "./cache/chats";
import { confirmChatOwnership } from "./chats";

export const findChatMessageDb = async (messageId: string) => {
  return (
    db.query.ChatMessageTable.findFirst({
      where: eq(ChatMessageTable.id, messageId),
    }) ?? null
  );
};

export const insertChatMessageDb = async (
  chatMessage: ChatMessageInsertType,
  tx?: DbTransaction,
) => {
  const existingChat = await confirmChatOwnership(chatMessage.chatId);
  if (!existingChat) return null;

  const [insertedChatMessage] = await (tx ?? db)
    .insert(ChatMessageTable)
    .values(chatMessage)
    .returning()
    .onConflictDoNothing({
      target: [ChatMessageTable.chatId, ChatMessageTable.clientMessageId],
    });

  revalidateChatCache(existingChat.userId, existingChat.id);

  return insertedChatMessage;
};

export const upsertChatMessageDb = async (
  chatMessage: ChatMessageInsertType,
  tx?: DbTransaction,
) => {
  const existingChat = await confirmChatOwnership(chatMessage.chatId);
  if (!existingChat) return null;

  const [upsertedChatMessage] = await (tx ?? db)
    .insert(ChatMessageTable)
    .values(chatMessage)
    .returning()
    .onConflictDoUpdate({
      target: [ChatMessageTable.chatId, ChatMessageTable.clientMessageId],
      set: chatMessage,
    });

  revalidateChatCache(existingChat.userId, existingChat.id);

  return upsertedChatMessage;
};
