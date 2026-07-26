import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { areaStatusEnum, colorEnum } from "../shared";
import { user } from "./user";
import { relations } from "drizzle-orm";
import { ProjectTable } from "./project";

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
  status: areaStatusEnum("status").notNull().default("active"),
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
}));
