import { db, DbTransaction } from "@/db/db";
import {
  ChatRunInsertType,
  ChatRunSelectType,
  ChatRunTable,
} from "@/db/schema";
import { SQLUpdateMap } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { confirmChatOwnership } from "./chats";
import { revalidateChatCache } from "./cache/chats";

export const findChatRunDb = async (
  query: { id: string } | { chatId: string; userMessageClientId: string },
) => {
  const whereQuery =
    "id" in query
      ? eq(ChatRunTable.id, query.id)
      : and(
          eq(ChatRunTable.chatId, query.chatId),
          eq(ChatRunTable.userMessageClientId, query.userMessageClientId),
        );

  return db.query.ChatRunTable.findFirst({
    where: whereQuery,
  });
};

export const insertChatRunDb = async (
  chatRun: ChatRunInsertType,
  tx?: DbTransaction,
) => {
  const existingChat = await confirmChatOwnership(chatRun.chatId);
  if (!existingChat) return null;

  const [insertedChatRun] = await (tx ?? db)
    .insert(ChatRunTable)
    .values(chatRun)
    .onConflictDoNothing()
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return insertedChatRun ?? null;
};

export const upsertChatRunDb = async (
  chatRun: ChatRunInsertType,
  tx?: DbTransaction,
) => {
  const existingChat = await confirmChatOwnership(chatRun.chatId);
  if (!existingChat) return null;

  const [upsertedChatRun] = await (tx ?? db)
    .insert(ChatRunTable)
    .values(chatRun)
    .onConflictDoUpdate({
      target: [ChatRunTable.chatId, ChatRunTable.userMessageClientId],
      set: chatRun,
    })
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return upsertedChatRun ?? null;
};

export const updateChatRunDb = async (
  runId: string,
  chatRun: SQLUpdateMap<
    Partial<
      Pick<
        ChatRunSelectType,
        | "assistantMessageId"
        | "status"
        | "finishedAt"
        | "error"
        | "responseTimeMs"
      >
    >
  >,
  tx?: DbTransaction,
) => {
  const existingChatRun = await findChatRunDb({ id: runId });
  if (!existingChatRun) return null;

  const existingChat = await confirmChatOwnership(existingChatRun.chatId);
  if (!existingChat) return null;

  const [updatedChatRun] = await (tx ?? db)
    .update(ChatRunTable)
    .set(chatRun)
    .where(eq(ChatRunTable.id, existingChatRun.id))
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return updatedChatRun ?? null;
};
