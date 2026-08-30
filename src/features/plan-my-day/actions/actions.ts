"use server";

import { db } from "@/db/db";
import { TaskSelectType, TaskTable } from "@/db/schema";
import { getUserTaskTag } from "@/features/tasks/server/cache/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import { getLocalDayBounds } from "@/lib/utils";
import { tz, TZDate } from "@date-fns/tz";
import { format, parse, subDays } from "date-fns";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { cacheTag } from "next/cache";
import {
  PlannerCardState,
  PlannerCounts,
  SingleTaskSource,
} from "../lib/types";
import { getPlannerCardState } from "../lib/utils";

const readCachedPlanMyDayDataAction = async (
  userId: string,
  timeZone: string,
  date: string,
): Promise<
  | {
      [S in PlannerCardState]: S extends "single"
        ? PlannerCounts & {
            state: S;
            source: SingleTaskSource;
            singleTask: TaskSelectType;
          }
        : PlannerCounts & { state: S };
    }[PlannerCardState]
  | null
> => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const dateToUse = parse(date, "yyyy-MM-dd", TZDate.tz(timeZone), {
    in: tz(timeZone),
  });
  const { startUtc, endUtc } = getLocalDayBounds(dateToUse, timeZone);
  const threeDaysAgo = subDays(startUtc, 3);

  const [todayTasks, tasksNeedAttention, unsortedTasks] = await Promise.all([
    db
      .select()
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          or(
            and(
              gte(TaskTable.scheduledAt, startUtc),
              lte(TaskTable.scheduledAt, endUtc),
            ),
            and(gte(TaskTable.dueAt, startUtc), lte(TaskTable.dueAt, endUtc)),
          ),
        ),
      ),
    db
      .select()
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          or(
            lte(TaskTable.scheduledAt, startUtc),
            lte(TaskTable.dueAt, startUtc),
            and(
              isNull(TaskTable.scheduledAt),
              isNull(TaskTable.dueAt),
              isNull(TaskTable.projectId),
              isNull(TaskTable.milestoneId),
            ),
          ),
        ),
      ),
    db
      .select()
      .from(TaskTable)
      .where(
        and(
          isNull(TaskTable.scheduledAt),
          isNull(TaskTable.dueAt),
          isNull(TaskTable.projectId),
          isNull(TaskTable.milestoneId),
          lte(TaskTable.createdAt, threeDaysAgo),
        ),
      ),
  ]);

  const todayTaskCount = todayTasks.length;
  const tasksNeedAttentionCount = tasksNeedAttention.length;
  const unsortedTaskCount = unsortedTasks.length;

  const counts = {
    todayTaskCount,
    tasksNeedAttentionCount,
    unsortedTaskCount,
  };

  const plannerState = getPlannerCardState(counts);

  let singleTask: TaskSelectType | null = null;

  if (plannerState.state === "single") {
    const source = plannerState.source;
    switch (source) {
      case "attention":
        singleTask = tasksNeedAttention?.[0] ?? null;
        break;
      case "today":
        singleTask = todayTasks?.[0] ?? null;
        break;
      case "unsorted":
        singleTask = unsortedTasks?.[0] ?? null;
        break;
      default:
        throw new Error(
          `Unknown single task source: ${source satisfies never}`,
        );
    }
  }
  return plannerState.state === "single"
    ? singleTask
      ? {
          ...counts,
          ...plannerState,
          singleTask,
        }
      : null
    : {
        ...counts,
        ...plannerState,
      };
};
export const readPlanMyDayDataAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  const today = format(new Date(), "yyyy-MM-dd", {
    in: tz(user.timeZone),
  });

  return readCachedPlanMyDayDataAction(userId, user.timeZone, today);
};
