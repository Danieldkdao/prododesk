import { db, DbMutationOptions, DbTransaction } from "@/db/db";
import { ChatMessageInsertType, ChatMessageTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidateChatCache } from "./cache/chats";
import { confirmUserChatOwnership } from "./chats";
import { getCurrentUser } from "@/lib/auth/helpers";

export const findChatMessageDb = async (
  messageId: string,
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return (
    (await (tx ?? db).query.ChatMessageTable.findFirst({
      where: and(eq(ChatMessageTable.id, messageId)),
    })) ?? null
  );
};

export const insertChatMessageDb = async (
  chatMessage: ChatMessageInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChat = await confirmUserChatOwnership(
    chatMessage.chatId,
    undefined,
    tx,
  );
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
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChat = await confirmUserChatOwnership(
    chatMessage.chatId,
    undefined,
    tx,
  );
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
