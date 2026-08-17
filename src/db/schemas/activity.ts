import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { createdAt, id } from "../helpers";
import {
  activityActionEnum,
  activitySourceEnum,
  activitySubjectEnum,
} from "../shared";
import { AreaTable } from "./area";
import { ArtifactTable } from "./artifact";
import { ProjectTable } from "./project";
import { user } from "./user";

export const ActivityTable = pgTable("activities", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  source: activitySourceEnum("source").notNull(),
  action: activityActionEnum("action").notNull(),
  subject: activitySubjectEnum("subject").notNull(),
  subjectId: uuid("subject_id"),
  subjectLabel: text("subject_label").notNull(),
  projectId: uuid("project_id").references(() => ProjectTable.id, {
    onDelete: "set null",
  }),
  areaId: uuid("area_id").references(() => AreaTable.id, {
    onDelete: "set null",
  }),
  message: text("message").notNull(),
  createdAt,
});

export type ActivityInsertType = typeof ActivityTable.$inferInsert;
export type ActivitySelectType = typeof ActivityTable.$inferSelect;

export const activitySelectSchema = createSelectSchema(ActivityTable);

export const activityRelations = relations(ActivityTable, ({ one, many }) => ({
  user: one(user, {
    fields: [ActivityTable.userId],
    references: [user.id],
  }),
  project: one(ProjectTable, {
    fields: [ActivityTable.projectId],
    references: [ProjectTable.id],
  }),
  area: one(AreaTable, {
    fields: [ActivityTable.areaId],
    references: [AreaTable.id],
  }),
  artifacts: many(ArtifactTable),
}));
