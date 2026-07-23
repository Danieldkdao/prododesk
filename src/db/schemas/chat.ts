import { relations } from "drizzle-orm";
import { index, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { ChatMessageTable } from "./chat-message";
import { ChatRunTable } from "./chat-run";
import { user } from "./user";

export const ChatTable = pgTable(
  "chats",
  {
    id,
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("chats_user_created_at_idx").on(t.userId, t.createdAt.desc())],
);

export type ChatTableInsertType = typeof ChatTable.$inferInsert;
export type ChatTableSelectType = typeof ChatTable.$inferSelect;

export const chatRelations = relations(ChatTable, ({ one, many }) => ({
  user: one(user, {
    fields: [ChatTable.userId],
    references: [user.id],
  }),
  messages: many(ChatMessageTable),
  chatRuns: many(ChatRunTable),
}));
