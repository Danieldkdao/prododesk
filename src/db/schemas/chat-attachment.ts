import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { ChatMessageTable } from "./chat-message";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const ChatAttachmentTable = pgTable("chat_attachments", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  storageKey: text("storage_key").notNull(),
  messageId: uuid("message_id")
    .references(() => ChatMessageTable.id, { onDelete: "cascade" })
    .notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  createdAt,
});

export type ChatAttachmentInsertType = typeof ChatAttachmentTable.$inferInsert;
export type ChatAttachmentSelectType = typeof ChatAttachmentTable.$inferSelect;

export const chatAttachmentRelations = relations(
  ChatAttachmentTable,
  ({ one }) => ({
    user: one(user, {
      fields: [ChatAttachmentTable.userId],
      references: [user.id],
    }),
    message: one(ChatMessageTable, {
      fields: [ChatAttachmentTable.messageId],
      references: [ChatMessageTable.id],
    }),
  }),
);
