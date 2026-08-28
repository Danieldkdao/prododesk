import { db, DbMutationOptions, DbTransaction } from "@/db/db";
import { ChatInsertType, ChatTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { deleteFilesFromStorage } from "@/features/uploads/lib/delete-files";
import { areValidIds } from "@/lib/utils";
import { and, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { revalidateChatCache } from "./cache/chats";

export const readChatsDb = async (filterOptions: {
  userId?: string;
  search?: string | null;
  page?: number;
  limit?: number;
}) => {
  const userIdToUse: string | null =
    filterOptions?.userId ?? (await getCurrentUser())?.userId;
  if (!userIdToUse) return null;

  const { search, page, limit = PAGE_SIZE } = filterOptions;

  let offset: number | null = null;
  if (page && page > 0) {
    offset = (page - 1) * limit;
  }

  const searchTerm = `%${search?.trim()}%`;
  const searchQuery = search?.trim()
    ? or(ilike(ChatTable.name, searchTerm))
    : undefined;

  const whereQuery = and(eq(ChatTable.userId, userIdToUse), searchQuery);

  let query = db
    .select()
    .from(ChatTable)
    .where(whereQuery)
    .orderBy(desc(ChatTable.createdAt), desc(ChatTable.id))
    .$dynamic();

  if (offset) {
    query = query.offset(offset);
  }

  const chats = await query.limit(limit);

  return {
    chats,
    whereQuery,
  };
};

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

export const confirmUserChatOwnership = async (
  chatId: string,
  otherQueries?: SQL<unknown> | undefined,
  tx?: DbTransaction,
) => {
  if (!areValidIds(chatId)) return null;

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
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { tx } = options ?? {};
  const deleteChat = async (pgtx: DbTransaction) => {
    const existingChat = await pgtx.query.ChatTable.findFirst({
      where: and(eq(ChatTable.id, chatId), eq(ChatTable.userId, userId)),
      with: {
        messages: {
          with: {
            attachments: true,
          },
        },
      },
    });
    if (!existingChat) return null;

    const [deletedChat] = await pgtx
      .delete(ChatTable)
      .where(eq(ChatTable.id, chatId))
      .returning();
    if (!deletedChat) throw new Error("Failed to delete chat.");

    return {
      deletedChat,
      storageKeys: existingChat.messages
        .flatMap((message) => message.attachments)
        .map((attachment) => attachment.storageKey),
    };
  };

  const result = tx ? await deleteChat(tx) : await db.transaction(deleteChat);
  if (!result) return null;

  if (result.storageKeys.length > 0 && !tx) {
    const deleteSuccess = await deleteFilesFromStorage(result.storageKeys);
    if (!deleteSuccess) {
      console.error(
        "Failed to delete attachments from storage for chat:",
        chatId,
      );
    }
  }

  revalidateChatCache(result.deletedChat.userId, result.deletedChat.id);

  return result.deletedChat;
};
