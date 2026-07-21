import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { ChatMessageTable } from "./chat-message";
import { MessagePart } from "@/services/ai/tool-contracts";

export const MessagePartTable = pgTable(
  "message_parts",
  {
    id,
    messageId: uuid("message_id")
      .references(() => ChatMessageTable.id, { onDelete: "cascade" })
      .notNull(),
    part: jsonb("part").$type<MessagePart>().notNull(),
    order: integer("order").notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [unique("message_part_order_unique").on(t.messageId, t.order)],
);

export type MessagePartInsertType = typeof MessagePartTable.$inferInsert;
export type MessagePartSelectType = typeof MessagePartTable.$inferSelect;

export const messagePartRelations = relations(MessagePartTable, ({ one }) => ({
  message: one(ChatMessageTable, {
    fields: [MessagePartTable.messageId],
    references: [ChatMessageTable.id],
  }),
}));
