import { pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./user";
import { createdAt } from "../helpers";
import { relations } from "drizzle-orm";

export const SettingsTable = pgTable("settings", {
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .primaryKey(),
  description: text("description"),
  createdAt,
});

export const settingsRelations = relations(SettingsTable, ({ one }) => ({
  user: one(user, {
    fields: [SettingsTable.userId],
    references: [user.id],
  }),
}));
