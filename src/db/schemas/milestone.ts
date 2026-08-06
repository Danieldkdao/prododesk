import { relations } from "drizzle-orm";
import {
    date,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { milestoneStatusEnum } from "../shared";
import { ProjectTable } from "./project";
import { TaskTable } from "./task";
import { user } from "./user";

export const MilestoneTable = pgTable("milestones", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  projectId: uuid("project_id")
    .references(() => ProjectTable.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  position: integer("position").notNull(),
  status: milestoneStatusEnum("status").notNull(),
  dueAt: date("date", { mode: "string" }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export type MilestoneInsertType = typeof MilestoneTable.$inferInsert;
export type MilestoneSelectType = typeof MilestoneTable.$inferSelect;

export const milestoneRelations = relations(
  MilestoneTable,
  ({ one, many }) => ({
    project: one(ProjectTable, {
      fields: [MilestoneTable.projectId],
      references: [ProjectTable.id],
    }),
    tasks: many(TaskTable),
  }),
);
