import { integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../helpers";
import { DailyPlanTable } from "./daily-plan";
import { TaskTable } from "./task";
import { relations } from "drizzle-orm";

export const DailyPlanItemTable = pgTable(
  "daily_plan_items",
  {
    id,
    dailyPlanId: uuid("daily_plan_id")
      .references(() => DailyPlanTable.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id")
      .references(() => TaskTable.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    reason: text("reason"),
    createdAt,
  },
  (t) => [
    uniqueIndex("daily_plan-items_task_unique").on(t.dailyPlanId, t.taskId),
    uniqueIndex("daily_plan_items_position_unique").on(
      t.dailyPlanId,
      t.position,
    ),
  ],
);

export const dailyPlanItemRelations = relations(
  DailyPlanItemTable,
  ({ one }) => ({
    dailyPlan: one(DailyPlanTable, {
      fields: [DailyPlanItemTable.dailyPlanId],
      references: [DailyPlanTable.id],
    }),
    task: one(TaskTable, {
      fields: [DailyPlanItemTable.taskId],
      references: [TaskTable.id],
    }),
  }),
);
