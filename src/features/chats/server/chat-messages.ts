import { db, DbTransaction } from "@/db/db";
import { ChatMessageInsertType, ChatMessageTable } from "@/db/schema";

export const insertChatMessageDb = async (
  chatMessage: ChatMessageInsertType,
  tx?: DbTransaction,
) => {
  const [insertedChatMessage] = await (tx ?? db)
    .insert(ChatMessageTable)
    .values(chatMessage)
    .returning();

  return insertedChatMessage;
};
