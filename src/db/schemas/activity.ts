import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { user } from "./user";
import { activitySourceEnum, activitySubjectEnum } from "../shared";
import { ProjectTable } from "./project";
import { relations } from "drizzle-orm";

export const ActivityTable = pgTable("activities", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  source: activitySourceEnum("source").notNull(),
  subject: activitySubjectEnum("subject").notNull(),
  subjectId: uuid("subject_id"),
  subjectLabel: text("subject_label").notNull(),
  projectId: uuid("project_id").references(() => ProjectTable.id, {
    onDelete: "cascade",
  }),
  title: varchar("title"),
  description: text("description"),
  createdAt,
});

export type ActivityInsertType = typeof ActivityTable.$inferInsert;
export type ActivitySelectType = typeof ActivityTable.$inferSelect;

export const activityRelations = relations(ActivityTable, ({ one }) => ({
  user: one(user, {
    fields: [ActivityTable.userId],
    references: [user.id],
  }),
  projectId: one(ProjectTable, {
    fields: [ActivityTable.projectId],
    references: [ProjectTable.id],
  }),
}));
