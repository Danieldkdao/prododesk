import { db, DbMutationOptions, DbTransaction } from "@/db/db";
import { ChatTable, ChatInsertType } from "@/db/schema";
import { revalidateChatCache } from "./cache/chats";
import { and, eq, SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/helpers";

export const insertChatDb = async (
  chat: ChatInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const [insertedChat] = await (tx ?? db)
    .insert(ChatTable)
    .values(chat)
    .returning();

  revalidateChatCache(insertedChat.userId, insertedChat.id);

  return insertedChat;
};

export const updateChatDb = async (
  chatId: string,
  chat: Pick<ChatInsertType, "name">,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
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
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingChat] = await (tx ?? db)
    .select()
    .from(ChatTable)
    .where(
      and(eq(ChatTable.userId, userId), eq(ChatTable.id, chatId), otherQueries),
    );

  return existingChat ?? null;
};

export const deleteChatDb = async (
  chatId: string,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const [deletedChat] = await (tx ?? db)
    .delete(ChatTable)
    .where(eq(ChatTable.id, chatId))
    .returning();

  revalidateChatCache(deletedChat.userId, deletedChat.id);

  return deletedChat;
};
