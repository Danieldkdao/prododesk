import { db, DbTransaction } from "@/db/db";
import {
  ChatRunInsertType,
  ChatRunSelectType,
  ChatRunTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const insertChatRunDb = async (
  chatRun: ChatRunInsertType,
  tx?: DbTransaction,
) => {
  const [insertedChatRun] = await (tx ?? db)
    .insert(ChatRunTable)
    .values(chatRun)
    .onConflictDoNothing()
    .returning();

  return insertedChatRun ?? null;
};

export const updateChatRunDb = async (
  runId: string,
  chatRun: Partial<
    Pick<
      ChatRunSelectType,
      "assistantMessageId" | "status" | "finishedAt" | "error"
    >
  >,
  tx?: DbTransaction,
) => {
  const [updatedChatRun] = await (tx ?? db)
    .update(ChatRunTable)
    .set(chatRun)
    .where(eq(ChatRunTable.id, runId))
    .returning();

  return updatedChatRun ?? null;
};

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
