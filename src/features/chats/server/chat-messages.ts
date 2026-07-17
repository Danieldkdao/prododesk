import { db, DbTransaction } from "@/db/db";
import { ChatMessageTable } from "@/db/schema";

export const insertChatMessageDb = async (
  chatMessage: typeof ChatMessageTable.$inferInsert,
  tx?: DbTransaction,
) => {
  const [insertedChatMessage] = await (tx ?? db)
    .insert(ChatMessageTable)
    .values(chatMessage)
    .returning();

  return insertedChatMessage;
};
