import { relations } from "drizzle-orm";
import { date, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { dailyPlanEnergyLevelEnum } from "../shared";
import { DailyPlanItemTable } from "./daily-plan-item";
import { user } from "./user";

export const DailyPlanTable = pgTable(
  "daily_plans",
  {
    id,
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    planDate: date("plan_date", { mode: "string" }).notNull(),
    availableMinutes: integer("available_minutes").notNull(),
    energyLevel: dailyPlanEnergyLevelEnum("energy_level").notNull(),
    summary: text("summary"),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("daily_plans_user_date_unique").on(t.userId, t.planDate)],
);

export type DailyPlanSelectType = typeof DailyPlanTable.$inferSelect;

export const dailyPlanRelations = relations(
  DailyPlanTable,
  ({ one, many }) => ({
    user: one(user, {
      fields: [DailyPlanTable.userId],
      references: [user.id],
    }),
    items: many(DailyPlanItemTable),
  }),
);
