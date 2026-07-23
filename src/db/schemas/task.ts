import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { taskPriorityEnum } from "../shared";
import { user } from "./user";

export const TaskTable = pgTable(
  "tasks",
  {
    id,
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name").notNull(),
    description: text("description"),
    emoji: varchar("emoji"),
    priority: taskPriorityEnum("priority").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    startAt: timestamp("started_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("task_user_day_created_at_idx").on(
      t.userId,
      t.day,
      t.createdAt.desc(),
    ),
    index("task_user_day_completion_idx").on(
      t.userId,
      t.day,
      t.isCompleted,
      t.completedAt,
    ),
    index("tasks_user_day_start_at_idx").on(t.userId, t.day, t.startAt),
  ],
);

export type TaskTableInsertType = typeof TaskTable.$inferInsert;
export type TaskTableSelectType = typeof TaskTable.$inferSelect;

export const taskRelations = relations(TaskTable, ({ one }) => ({
  user: one(user, {
    fields: [TaskTable.userId],
    references: [user.id],
  }),
}));
