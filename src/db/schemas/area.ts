import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { areaStatusEnum } from "../shared";

export const AreaTable = pgTable("areas", {
  id,
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon"),
  color: varchar("color"),
  position: integer().notNull(),
  status: areaStatusEnum("status").notNull(),
  createdAt,
  updatedAt,
});
