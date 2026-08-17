import { db, DbMutationOptions, DbTransaction } from "@/db/db";
import {
  ActivityTable,
  ArtifactTable,
  ChatRunInsertType,
  ChatRunSelectType,
  ChatRunTable,
} from "@/db/schema";
import { SQLMap } from "@/lib/types";
import { and, eq, inArray } from "drizzle-orm";
import { confirmChatOwnership } from "./chats";
import { revalidateChatCache } from "./cache/chats";

export const findChatRunDb = async (
  query: { id: string } | { chatId: string; userMessageClientId: string },
  tx?: DbTransaction,
) => {
  const whereQuery =
    "id" in query
      ? eq(ChatRunTable.id, query.id)
      : and(
          eq(ChatRunTable.chatId, query.chatId),
          eq(ChatRunTable.userMessageClientId, query.userMessageClientId),
        );

  return (tx ?? db).query.ChatRunTable.findFirst({
    where: whereQuery,
  });
};

export const insertChatRunDb = async (
  chatRun: ChatRunInsertType,
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChat = await confirmChatOwnership(
    chatRun.chatId,
    undefined,
    tx,
  );
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
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChat = await confirmChatOwnership(
    chatRun.chatId,
    undefined,
    tx,
  );
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
  chatRun: SQLMap<
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
  options?: DbMutationOptions,
) => {
  const { tx } = options ?? {};
  const existingChatRun = await findChatRunDb({ id: runId }, tx);
  if (!existingChatRun) return null;

  const existingChat = await confirmChatOwnership(
    existingChatRun.chatId,
    undefined,
    tx,
  );
  if (!existingChat) return null;

  const [updatedChatRun] = await (tx ?? db)
    .update(ChatRunTable)
    .set(chatRun)
    .where(eq(ChatRunTable.id, existingChatRun.id))
    .returning();

  revalidateChatCache(existingChat.userId, existingChat.id);

  return updatedChatRun ?? null;
};

export const getRunArtifacts = async (runId: string) => {
  return db.query.ArtifactTable.findMany({
    where: and(
      eq(ArtifactTable.chatRunId, runId),
      inArray(
        ArtifactTable.activityId,
        db
          .select({ id: ActivityTable.id })
          .from(ActivityTable)
          .where(
            and(
              eq(ActivityTable.source, "ai"),
              inArray(ActivityTable.action, ["create", "update"]),
            ),
          ),
      ),
    ),
    with: {
      activity: true,
    },
  });
};
