import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { ToolExecutionStatusEnum } from "../shared";
import { ChatRunTable } from "./chat-run";

export const ToolExecutionTable = pgTable(
  "tool_executions",
  {
    id,
    runId: uuid("run_id")
      .references(() => ChatRunTable.id, { onDelete: "cascade" })
      .notNull(),
    toolCallId: text("tool_call_id").notNull(),
    toolName: text("tool_name").notNull(),
    status: ToolExecutionStatusEnum("status").default("pending").notNull(),
    output: jsonb("output"),
    error: text("error"),
    createdAt,
    updatedAt,
  },
  (t) => [unique("tool_execution_call_unique").on(t.runId, t.toolCallId)],
);

export type ToolExecutionInsertType = typeof ToolExecutionTable.$inferInsert;
export type ToolExecutionSelectType = typeof ToolExecutionTable.$inferSelect;

export const toolExecutionRelations = relations(
  ToolExecutionTable,
  ({ one }) => ({
    chat: one(ChatRunTable, {
      fields: [ToolExecutionTable.runId],
      references: [ChatRunTable.id],
    }),
  }),
);
