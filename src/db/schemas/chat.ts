import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { ChatMessageTable } from "./chat-message";

export const ChatTable = pgTable("chats", {
  id,
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt,
  updatedAt,
});

export type ChatTableInsertType = typeof ChatTable.$inferInsert;
export type ChatTableSelectType = typeof ChatTable.$inferSelect;

export const chatRelations = relations(ChatTable, ({ one, many }) => ({
  user: one(user, {
    fields: [ChatTable.userId],
    references: [user.id],
  }),
  messages: many(ChatMessageTable),
}));
