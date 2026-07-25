import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { user } from "./user";
import { AreaTable } from "./area";
import { colorEnum, projectStatusEnum } from "../shared";
import { relations } from "drizzle-orm";

export const ProjectTable = pgTable("projects", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  outcome: text("outcome"),
  icon: varchar("icon"),
  color: colorEnum("color"),
  areaId: uuid("area").references(() => AreaTable.id, { onDelete: "set null" }),
  startAt: timestamp("started_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  status: projectStatusEnum("status").notNull(),
  createdAt,
  updatedAt,
});

export type ProjectInsertType = typeof ProjectTable.$inferInsert;
export type ProjectSelectType = typeof ProjectTable.$inferSelect;

export const projectRelations = relations(ProjectTable, ({ one }) => ({
  user: one(user, {
    fields: [ProjectTable.userId],
    references: [user.id],
  }),
  area: one(AreaTable, {
    fields: [ProjectTable.areaId],
    references: [AreaTable.id],
  }),
}));
