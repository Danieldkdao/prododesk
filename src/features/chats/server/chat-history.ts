import "server-only";

import { db } from "@/db/db";
import {
  ActivityTable,
  ArtifactTable,
  ChatMessageTable,
  MessagePartTable,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { CHAT_HISTORY_PAGE_SIZE } from "../lib/constants";

export const readChatHistoryPageDb = async (
  chatId: string,
  before?: string,
) => {
  const cursor = before
    ? await db.query.ChatMessageTable.findFirst({
        where: and(
          eq(ChatMessageTable.chatId, chatId),
          eq(ChatMessageTable.clientMessageId, before),
        ),
        columns: { id: true },
      })
    : undefined;
  if (before && !cursor) return null;
  const messages = await db.query.ChatMessageTable.findMany({
    where: and(
      eq(ChatMessageTable.chatId, chatId),
      cursor
        ? sql`(${ChatMessageTable.createdAt}, ${ChatMessageTable.id}) < (select created_at, id from chat_messages where id = ${cursor.id}::uuid)`
        : undefined,
    ),
    orderBy: [desc(ChatMessageTable.createdAt), desc(ChatMessageTable.id)],
    limit: CHAT_HISTORY_PAGE_SIZE + 1,
    with: {
      attachments: true,
      parts: {
        orderBy: [asc(MessagePartTable.order), asc(MessagePartTable.id)],
      },
      chatRun: {
        with: {
          artifacts: {
            where: inArray(
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
            with: { activity: true },
          },
        },
      },
    },
  });
  return {
    messages: messages.slice(0, CHAT_HISTORY_PAGE_SIZE).reverse(),
    hasOlderMessages: messages.length > CHAT_HISTORY_PAGE_SIZE,
  };
};
