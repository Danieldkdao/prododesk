import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { colorEnum, projectStatusEnum } from "../shared";
import { AreaTable } from "./area";
import { TaskTable } from "./task";
import { user } from "./user";
import { ActivityTable } from "./activity";
import { DocumentTable } from "./document";
import { MilestoneTable } from "./milestone";

export const ProjectTable = pgTable("projects", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  outcome: text("outcome"),
  icon: varchar("icon"),
  color: colorEnum("color").notNull(),
  areaId: uuid("area_id").references(() => AreaTable.id, {
    onDelete: "set null",
  }),
  startAt: date("started_at", { mode: "string" }),
  endAt: date("end_at", { mode: "string" }),
  status: projectStatusEnum("status").notNull(),
  isArchived: boolean("is_archived").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export type ProjectInsertType = typeof ProjectTable.$inferInsert;
export type ProjectSelectType = typeof ProjectTable.$inferSelect;

export const projectRelations = relations(ProjectTable, ({ one, many }) => ({
  user: one(user, {
    fields: [ProjectTable.userId],
    references: [user.id],
  }),
  area: one(AreaTable, {
    fields: [ProjectTable.areaId],
    references: [AreaTable.id],
  }),
  tasks: many(TaskTable),
  documents: many(DocumentTable),
  milestones: many(MilestoneTable),
  activity: many(ActivityTable),
}));
