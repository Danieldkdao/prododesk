import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { chatRoleEnum, modelIdEnum } from "../shared";
import { ChatTable } from "./chat";
import { MessagePartTable } from "./message-part";

export const ChatMessageTable = pgTable("chat_messages", {
  id,
  chatId: uuid("chat_id")
    .notNull()
    .references(() => ChatTable.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  modelId: modelIdEnum("model_id").notNull(),
  createdAt,
  updatedAt,
});

export type ChatMessageInsertType = typeof ChatMessageTable.$inferInsert;
export type ChatMessageSelectType = typeof ChatMessageTable.$inferSelect;

export const chatMessageRelations = relations(
  ChatMessageTable,
  ({ one, many }) => ({
    chat: one(ChatTable, {
      fields: [ChatMessageTable.chatId],
      references: [ChatTable.id],
    }),
    parts: many(MessagePartTable),
  }),
);
