"use server";

import { db } from "@/db/db";
import { TaskPriority, TaskTable } from "@/db/schema";
import { calculateCalendarValues } from "@/features/calendar/lib/utils";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { mergeDateTime } from "@/lib/utils";
import { format } from "date-fns";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import {
  DayTasksSchedule,
  DayTasksSortByOption,
  DayTasksStatus,
} from "../lib/day-tasks-params";
import {
  confirmUserTaskOwnership,
  deleteTaskDb,
  insertTaskDb,
  updateTaskDb,
} from "../server/tasks";
import { taskSchema, TaskSchemaType } from "./schemas";

export const createTaskAction = async (unsafeData: TaskSchemaType) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = taskSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { startAt, endAt, day, ...rest } = data;

  try {
    const createdTask = await insertTaskDb({
      userId,
      startAt: startAt ? mergeDateTime(data.day, startAt) : null,
      endAt: endAt ? mergeDateTime(data.day, endAt) : null,
      day: format(day, "yyyy-MM-dd"),
      ...rest,
    });
    if (!createdTask) throw new Error("Failed to create task.");

    return {
      error: false,
      message: "Task created successfully!",
      task: createdTask,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateTaskAction = async (
  taskId: string,
  unsafeData: TaskSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = taskSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { day, startAt, endAt, ...rest } = data;

  try {
    const updatedTask = await updateTaskDb(taskId, {
      startAt: startAt ? mergeDateTime(day, startAt) : null,
      endAt: endAt ? mergeDateTime(day, endAt) : null,
      ...rest,
    });
    if (!updatedTask) throw new Error("Failed to update task.");

    return {
      error: false,
      message: "Task updated successfully!",
      task: updatedTask,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteTaskAction = async (taskId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingTask = await confirmUserTaskOwnership(userId, taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedTask = await deleteTaskDb(taskId);
    if (!deletedTask) throw new Error("Failed to delete task.");

    return {
      error: false,
      message: "Task deleted successfully!",
      deletedTask,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getCalendarTasksAction = async (dateToUse: Date) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { startOfMonth, endOfMonth, monthDays } =
    calculateCalendarValues(dateToUse);

  const tasks = await db
    .select()
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        gte(TaskTable.day, format(startOfMonth, "yyyy-MM-dd")),
        lte(TaskTable.day, format(endOfMonth, "yyyy-MM-dd")),
      ),
    )
    .orderBy(asc(TaskTable.id));

  const monthDaysWithTasks = monthDays.map((day) => {
    const dayTasks = tasks.filter((task) => {
      const dayString = format(day, "yyyy-MM-dd");
      return task.day === dayString;
    });

    return {
      day,
      tasks: dayTasks,
    };
  });

  return monthDaysWithTasks;
};
export type GetCalendarTasksActionReturnType = UnwrapAsync<
  typeof getCalendarTasksAction
>;

export const getDayTasksAction = async (
  selectedDay: Date | null,
  filterOptions: {
    search: string;
    sortBy: DayTasksSortByOption;
    priorities: TaskPriority[];
    status: DayTasksStatus;
    schedule: DayTasksSchedule;
    timeStartRange: Date | null;
    timeEndRange: Date | null;
    page: number;
  },
) => {
  const { userId } = await getCurrentUser();
  if (!userId || !selectedDay) return null;

  const formattedDay = format(selectedDay, "yyyy-MM-dd");

  const {
    search,
    sortBy,
    priorities,
    status,
    schedule,
    timeStartRange,
    timeEndRange,
    page,
  } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;

  const priorityRank = sql`
    CASE ${TaskTable.priority}
      WHEN 'urgent' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END
  `;

  const completedAtRank = sql`
    CASE
      WHEN ${TaskTable.completedAt} IS NULL THEN 0
      ELSE 1
    END
  `;

  const searchFilter = search.trim()
    ? or(
        ilike(TaskTable.name, searchTerm),
        ilike(TaskTable.description, searchTerm),
      )
    : undefined;

  const priorityFilter = priorities.length
    ? inArray(TaskTable.priority, priorities)
    : undefined;

  const sortByMap: Record<DayTasksSortByOption, SQL<unknown>> = {
    name_a_z: asc(sql`lower(${TaskTable.name})`),
    name_z_a: desc(sql`lower(${TaskTable.name})`),
    oldest: asc(TaskTable.createdAt),
    priority: desc(priorityRank),
    recently_completed: desc(completedAtRank),
    recently_created: desc(TaskTable.createdAt),
  };

  const statusMap: Record<DayTasksStatus, SQL<unknown> | undefined> = {
    all: undefined,
    active: and(
      eq(TaskTable.isCompleted, false),
      isNull(TaskTable.completedAt),
    ),
    complete: and(
      eq(TaskTable.isCompleted, true),
      isNotNull(TaskTable.completedAt),
    ),
  };

  const scheduleMap: Record<DayTasksSchedule, SQL<unknown> | undefined> = {
    any: undefined,
    scheduled: isNotNull(TaskTable.startAt),
    unscheduled: and(isNull(TaskTable.startAt), isNull(TaskTable.endAt)),
  };

  const timeRangeFilter = and(
    timeStartRange ? gte(TaskTable.startAt, timeStartRange) : undefined,
    timeEndRange ? lte(TaskTable.endAt, timeEndRange) : undefined,
  );

  const whereQuery = and(
    eq(TaskTable.userId, userId),
    eq(TaskTable.day, formattedDay),
    searchFilter,
    priorityFilter,
    statusMap[status],
    scheduleMap[schedule],
    timeRangeFilter,
  );

  const selectedDayTasks = await db
    .select()
    .from(TaskTable)
    .where(whereQuery)
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalSelectedTasks] = await db
    .select({
      count: count(),
    })
    .from(TaskTable)
    .where(whereQuery);

  const [totalCompletedTasks] = await db
    .select({ count: count() })
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        eq(TaskTable.day, formattedDay),
        eq(TaskTable.isCompleted, true),
        isNotNull(TaskTable.completedAt),
      ),
    );

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalSelectedTasks.count;

  return {
    selectedDayTasks,
    metadata: {
      hasPrevPage,
      hasNextPage,
      allTasksCompleted: totalCompletedTasks.count === totalSelectedTasks.count,
    },
  };
};
export type GetDayTasksActionReturnType = UnwrapAsync<typeof getDayTasksAction>;

export const toggleTaskCompletionAction = async (taskId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingTask = await confirmUserTaskOwnership(userId, taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  try {
    const updatedTask = await updateTaskDb(taskId, {
      isCompleted: !existingTask.isCompleted,
      completedAt: !existingTask.isCompleted ? new Date() : null,
    });
    if (!updatedTask)
      throw new Error("Failed to update task completion status.");

    const [incompleteTasks] = await db
      .select({
        count: count(),
      })
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          isNull(TaskTable.completedAt),
          eq(TaskTable.isCompleted, false),
          eq(TaskTable.day, updatedTask.day),
        ),
      );

    return {
      error: false,
      message: "Task updated successfully!",
      allComplete: incompleteTasks.count === 0,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: "Failed to update task completion status.",
    };
  }
};
