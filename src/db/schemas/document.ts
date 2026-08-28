import { relations } from "drizzle-orm";
import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { ProjectTable } from "./project";
import { user } from "./user";
import { DocumentAssetTable } from "./document-asset";

export const DocumentTable = pgTable("documents", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
  content: text("content").notNull().default(""),
  projectId: uuid("project_id").references(() => ProjectTable.id, {
    onDelete: "set null",
  }),
  createdAt,
  updatedAt,
});

export type DocumentInsertType = typeof DocumentTable.$inferInsert;
export type DocumentSelectType = typeof DocumentTable.$inferSelect;

export const documentRelations = relations(DocumentTable, ({ one, many }) => ({
  user: one(user, {
    fields: [DocumentTable.userId],
    references: [user.id],
  }),
  project: one(ProjectTable, {
    fields: [DocumentTable.projectId],
    references: [ProjectTable.id],
  }),
  assets: many(DocumentAssetTable),
}));
