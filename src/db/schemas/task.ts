import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { taskPriorityEnum, taskStatusEnum } from "../shared";
import { MilestoneTable } from "./milestone";
import { ProjectTable } from "./project";
import { user } from "./user";

export const TaskTable = pgTable("tasks", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  emoji: varchar("emoji"),
  status: taskStatusEnum("status").notNull(),
  priority: taskPriorityEnum("priority").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  projectId: uuid("project_id").references(() => ProjectTable.id, {
    onDelete: "set null",
  }),
  milestoneId: uuid("milestone_id").references(() => MilestoneTable.id, {
    onDelete: "set null",
  }),
  createdAt,
  updatedAt,
});

export type TaskInsertType = typeof TaskTable.$inferInsert;
export type TaskSelectType = typeof TaskTable.$inferSelect;

export const taskRelations = relations(TaskTable, ({ one }) => ({
  user: one(user, {
    fields: [TaskTable.userId],
    references: [user.id],
  }),
  project: one(ProjectTable, {
    fields: [TaskTable.projectId],
    references: [ProjectTable.id],
  }),
  milestone: one(MilestoneTable, {
    fields: [TaskTable.milestoneId],
    references: [MilestoneTable.id],
  }),
}));
