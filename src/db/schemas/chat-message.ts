import { relations } from "drizzle-orm";
import { index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { chatRoleEnum, modelIdEnum } from "../shared";
import { ChatTable } from "./chat";
import { ChatRunTable } from "./chat-run";
import { MessagePartTable } from "./message-part";

export const ChatMessageTable = pgTable(
  "chat_messages",
  {
    id,
    chatId: uuid("chat_id")
      .notNull()
      .references(() => ChatTable.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    modelId: modelIdEnum("model_id").notNull(),
    clientMessageId: text("client_message_id").notNull(),
    responseToClientId: text("response_to_client_id"),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique("chat_message_client_id_unique").on(t.chatId, t.clientMessageId),
    unique("chat_message_response_id_unique").on(
      t.chatId,
      t.responseToClientId,
    ),
    index("chat_messages_chat_created_at_idx").on(t.chatId, t.createdAt.asc()),
  ],
);

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
    chatRun: one(ChatRunTable),
  }),
);
