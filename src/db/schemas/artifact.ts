import { relations } from "drizzle-orm";
import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { activitySubjectEnum } from "../shared";
import { ActivityTable } from "./activity";
import { ChatRunTable } from "./chat-run";

export const ArtifactTable = pgTable(
  "artifacts",
  {
    chatRunId: uuid("chat_run_id")
      .references(() => ChatRunTable.id, { onDelete: "cascade" })
      .notNull(),
    activityId: uuid("activity_id")
      .references(() => ActivityTable.id, { onDelete: "cascade" })
      .notNull(),
    subjectId: uuid("subject_id").notNull(),
    subject: activitySubjectEnum("subject").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.chatRunId, t.subjectId, t.subject],
    }),
  ],
);

export type ArtifactSelectType = typeof ArtifactTable.$inferSelect;

export const artifactSelectSchema = createSelectSchema(ArtifactTable);

export const artifactRelations = relations(ArtifactTable, ({ one }) => ({
  chatRun: one(ChatRunTable, {
    fields: [ArtifactTable.chatRunId],
    references: [ChatRunTable.id],
  }),
  activity: one(ActivityTable, {
    fields: [ArtifactTable.activityId],
    references: [ActivityTable.id],
  }),
}));
