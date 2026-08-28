import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { user } from "./user";
import { uploadIntentPurposeEnum, uploadIntentStatusEnum } from "../shared";
import { relations } from "drizzle-orm";

export const UploadIntentTable = pgTable("upload_intents", {
  id,
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  purpose: uploadIntentPurposeEnum("purpose").notNull(),
  storageKey: text("storage_key").notNull(),
  status: uploadIntentStatusEnum("status").notNull().default("pending"),
  createdAt,
});

export type UploadIntentInsertType = typeof UploadIntentTable.$inferInsert;

export const uploadIntentRelations = relations(
  UploadIntentTable,
  ({ one }) => ({
    user: one(user, {
      fields: [UploadIntentTable.userId],
      references: [user.id],
    }),
  }),
);
