import { db, DbTransaction } from "@/db/db";
import { ChatTable, ChatTableInsertType } from "@/db/schema";
import { revalidateChatCache } from "./cache/chats";

export const insertChatDb = async (
  chat: ChatTableInsertType,
  tx?: DbTransaction,
) => {
  const [insertedChat] = await (tx ?? db)
    .insert(ChatTable)
    .values(chat)
    .returning();

  revalidateChatCache(insertedChat.userId, insertedChat.id);

  return insertedChat;
};
