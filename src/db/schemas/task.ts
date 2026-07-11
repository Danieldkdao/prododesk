import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const TaskTable = pgTable("tasks", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  emoji: varchar("emoji"),
  day: date("day", { mode: "string" }).notNull(),
  startAt: timestamp("started_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export type TaskTableInsertType = typeof TaskTable.$inferInsert;
export type TaskTableSelectType = typeof TaskTable.$inferSelect;

export const taskRelations = relations(TaskTable, ({ one }) => ({
  user: one(user, {
    fields: [TaskTable.userId],
    references: [user.id],
  }),
}));
