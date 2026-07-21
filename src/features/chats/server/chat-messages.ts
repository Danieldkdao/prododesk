import { db, DbTransaction } from "@/db/db";
import { ChatMessageInsertType, ChatMessageTable } from "@/db/schema";
import { eq } from "drizzle-orm";

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
  const [insertedChatMessage] = await (tx ?? db)
    .insert(ChatMessageTable)
    .values(chatMessage)
    .returning()
    .onConflictDoNothing({
      target: [ChatMessageTable.chatId, ChatMessageTable.clientMessageId],
    });

  return insertedChatMessage;
};

export const upsertChatMessageDb = async (
  chatMessage: ChatMessageInsertType,
  tx?: DbTransaction,
) => {
  const [upsertedChatMessage] = await (tx ?? db)
    .insert(ChatMessageTable)
    .values(chatMessage)
    .returning()
    .onConflictDoUpdate({
      target: [ChatMessageTable.chatId, ChatMessageTable.clientMessageId],
      set: chatMessage,
    });

  return upsertedChatMessage;
};
