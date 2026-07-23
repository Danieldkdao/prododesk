import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { chatRunStatusEnum } from "../shared";
import { ChatTable } from "./chat";
import { ChatMessageTable } from "./chat-message";

export const ChatRunTable = pgTable(
  "chat_runs",
  {
    id,
    chatId: uuid("chat_id")
      .references(() => ChatTable.id, { onDelete: "cascade" })
      .notNull(),
    userMessageClientId: text("user_message_client_id").notNull(),
    assistantMessageId: uuid("assistant_message_id").references(
      () => ChatMessageTable.id,
      { onDelete: "set null" },
    ),
    responseTimeMs: integer("response_time_ms").default(0).notNull(),
    status: chatRunStatusEnum("status").default("pending").notNull(),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique("chat_run_user_message_unique").on(t.chatId, t.userMessageClientId),
  ],
);

export type ChatRunInsertType = typeof ChatRunTable.$inferInsert;
export type ChatRunSelectType = typeof ChatRunTable.$inferSelect;

export const chatRunRelations = relations(ChatRunTable, ({ one }) => ({
  chat: one(ChatTable, {
    fields: [ChatRunTable.chatId],
    references: [ChatTable.id],
  }),
  assistantMessage: one(ChatMessageTable, {
    fields: [ChatRunTable.assistantMessageId],
    references: [ChatMessageTable.id],
  }),
}));
