import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { DocumentTable } from "./document";
import { user } from "./user";

export const DocumentAssetTable = pgTable("document_assets", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  documentId: uuid("document_id")
    .references(() => DocumentTable.id, { onDelete: "cascade" })
    .notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt,
});

export type DocumentAssetInsertType = typeof DocumentAssetTable.$inferInsert;

export const documentAssetRelations = relations(
  DocumentAssetTable,
  ({ one }) => ({
    user: one(user, {
      fields: [DocumentAssetTable.userId],
      references: [user.id],
    }),
    document: one(DocumentTable, {
      fields: [DocumentAssetTable.documentId],
      references: [DocumentTable.id],
    }),
  }),
);
