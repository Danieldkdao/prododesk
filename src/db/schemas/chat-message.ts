import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { ChatTable } from "./chat";
import { chatRoleEnum, modelIdEnum } from "../shared";
import { relations } from "drizzle-orm";

export const ChatMessageTable = pgTable("chat_messages", {
  id,
  chatId: uuid("chat_id")
    .notNull()
    .references(() => ChatTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  role: chatRoleEnum("role").notNull(),
  modelId: modelIdEnum("model_id").notNull(),
  createdAt,
  updatedAt,
});

export const chatMessageRelations = relations(ChatMessageTable, ({ one }) => ({
  chat: one(ChatTable, {
    fields: [ChatMessageTable.chatId],
    references: [ChatTable.id],
  }),
}));
