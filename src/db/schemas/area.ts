import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { colorEnum } from "../shared";
import { ProjectTable } from "./project";
import { user } from "./user";
import { ActivityTable } from "./activity";

export const AreaTable = pgTable("areas", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  color: colorEnum("colors").notNull(),
  position: integer().notNull(),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt,
  updatedAt,
});

export type AreaInsertType = typeof AreaTable.$inferInsert;
export type AreaSelectType = typeof AreaTable.$inferSelect;

export const areaRelations = relations(AreaTable, ({ one, many }) => ({
  user: one(user, {
    fields: [AreaTable.userId],
    references: [user.id],
  }),
  projects: many(ProjectTable),
  activity: many(ActivityTable),
}));
