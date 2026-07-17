import { db, DbTransaction } from "@/db/db";
import { ChatTable } from "@/db/schema";
import { revalidateChatCache } from "./cache/chats";

export const insertChatDb = async (
  chat: typeof ChatTable.$inferInsert,
  tx?: DbTransaction,
) => {
  const [insertedChat] = await (tx ?? db)
    .insert(ChatTable)
    .values(chat)
    .returning();

  revalidateChatCache(insertedChat.userId, insertedChat.id);

  return insertedChat;
};
