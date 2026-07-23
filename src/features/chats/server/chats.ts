import { db, DbTransaction } from "@/db/db";
import { ChatTable, ChatTableInsertType } from "@/db/schema";
import { revalidateChatCache } from "./cache/chats";
import { and, eq, SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/helpers";

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

export const updateChatDb = async (
  chatId: string,
  chat: Pick<ChatTableInsertType, "name">,
  tx?: DbTransaction,
) => {
  const [updatedChat] = await (tx ?? db)
    .update(ChatTable)
    .set(chat)
    .where(eq(ChatTable.id, chatId))
    .returning();

  revalidateChatCache(updatedChat.userId, updatedChat.id);

  return updatedChat;
};

export const confirmChatOwnership = async (
  chatId: string,
  otherQueries?: SQL<unknown> | undefined,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingChat] = await db
    .select()
    .from(ChatTable)
    .where(
      and(eq(ChatTable.userId, userId), eq(ChatTable.id, chatId), otherQueries),
    );

  return existingChat ?? null;
};

export const deleteChatDb = async (chatId: string) => {
  const [deletedChat] = await db
    .delete(ChatTable)
    .where(eq(ChatTable.id, chatId))
    .returning();

  revalidateChatCache(deletedChat.userId, deletedChat.id);

  return deletedChat;
};
