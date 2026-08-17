"use server";

import { ActivityMutationOptions, db } from "@/db/db";
import { ProjectTable, TaskPriority, TaskStatus, TaskTable } from "@/db/schema";
import { calculateCalendarValues } from "@/features/calendar/lib/utils";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import {
  areValidIds,
  getLocalDayBounds,
  getLocalMonthBounds,
} from "@/lib/utils";
import { format, isValid } from "date-fns";
import { and, asc, count, eq, gte, lte, ne } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { DayTasksSortByOption } from "../lib/tasks-params";
import { getUserTaskTag } from "../server/cache/tasks";
import {
  confirmUserTaskOwnership,
  deleteTaskDb,
  insertTaskDb,
  readTasksDb,
  updateTaskDb,
} from "../server/tasks";
import {
  taskSchema,
  TaskSchemaType,
  updateTaskSchema,
  UpdateTaskSchemaType,
} from "./schemas";
import { confirmUserMilestoneOwnership } from "@/features/milestones/server/milestones";

export const createTaskAction = async (
  unsafeData: TaskSchemaType,
  options?: ActivityMutationOptions,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success, error } = taskSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: error.message,
    };
  }

  try {
    const createdTask = await insertTaskDb({ ...data, userId }, options);
    if (!createdTask) throw new Error("Failed to create task.");

    return {
      error: false,
      message: "Task created successfully!",
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
  unsafeData: UpdateTaskSchemaType,
  options?: ActivityMutationOptions,
) => {
  if (!areValidIds(taskId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { data, success } = updateTaskSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const existingResult = taskSchema.safeParse({
    name: existingTask.name,
    description: existingTask.description,
    emoji: existingTask.emoji,
    priority: existingTask.priority,
    status: existingTask.status,
    projectId: existingTask.projectId,
    milestoneId: existingTask.milestoneId,
    scheduledAt: existingTask.scheduledAt ?? null,
    dueAt: existingTask.dueAt ?? null,
    ...data,
  });
  if (!existingResult.success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedTask = await updateTaskDb(existingTask.id, data, options);
    if (!updatedTask) throw new Error("Failed to update task.");

    return {
      error: false,
      message: "Task updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateTaskMilestoneAction = async (
  taskId: string,
  milestoneId: string | null,
  options?: ActivityMutationOptions,
) => {
  if (!areValidIds(taskId) || (milestoneId && !areValidIds(milestoneId))) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  if (milestoneId) {
    const existingMilestone = await confirmUserMilestoneOwnership(
      milestoneId,
      userId,
    );
    if (!existingMilestone) {
      return {
        error: true,
        message: NOT_FOUND_ERROR_MESSAGE,
      };
    }
  }

  try {
    const updatedTask = await updateTaskDb(
      existingTask.id,
      { milestoneId },
      options,
    );
    if (!updatedTask) throw new Error("Failed to update task milestone.");

    return {
      error: false,
      message: "Task updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteTaskAction = async (
  taskId: string,
  options?: ActivityMutationOptions,
) => {
  if (!areValidIds(taskId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedTask = await deleteTaskDb(taskId, options);
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

const getCachedCalendarTasks = async (
  userId: string,
  timeZone: string,
  dateToUse: Date,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  if (!isValid(dateToUse)) return null;

  const { monthDays } = calculateCalendarValues(dateToUse);

  const { startUtc, endUtc } = getLocalMonthBounds(dateToUse, timeZone);

  const tasks = await db
    .select()
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        gte(TaskTable.scheduledAt, startUtc),
        lte(TaskTable.scheduledAt, endUtc),
      ),
    )
    .orderBy(asc(TaskTable.id));

  const monthDaysWithTasks = monthDays.map((day) => {
    const dayTasks = tasks.filter((task) => {
      const { startUtc, endUtc } = getLocalDayBounds(day, timeZone);
      return (
        task.scheduledAt &&
        task.scheduledAt >= startUtc &&
        task.scheduledAt <= endUtc
      );
    });

    return {
      day,
      tasks: dayTasks,
    };
  });

  return {
    month: dateToUse,
    monthDaysTasks: monthDaysWithTasks,
  };
};
export const getCalendarTasksAction = async (dateToUse: Date) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return getCachedCalendarTasks(userId, user.timeZone, dateToUse);
};
export type GetCalendarTasksActionReturnType = UnwrapAsync<
  typeof getCalendarTasksAction
>;

const readCachedTasksAction = async (
  userId: string,
  timeZone: string,
  filterOptions: {
    search: string;
    sortBy: DayTasksSortByOption;
    priorities: TaskPriority[];
    statuses: TaskStatus[];
    dateTimeStartRange: Date | null;
    dateTimeEndRange: Date | null;
    page: number;
    unassignedOnly?: boolean;
    allTasks?: boolean;
    selectedDay?: Date | null;
    projectIds?: string[];
    areaIds?: string[];
  },
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const { page, selectedDay } = filterOptions;

  const response = await readTasksDb({ ...filterOptions, userId, timeZone });
  if (!response) return null;

  const { tasks, projects, dayFilter, whereQuery } = response;

  const [totalSelectedTasks] = await db
    .select({
      count: count(),
    })
    .from(TaskTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, TaskTable.projectId))
    .where(whereQuery);

  const [totalTasks] = await db
    .select({ count: count() })
    .from(TaskTable)
    .where(and(eq(TaskTable.userId, userId), dayFilter));

  const [totalCompletedTasks] = await db
    .select({ count: count() })
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        dayFilter,
        eq(TaskTable.status, "completed"),
      ),
    );

  const allTasksCompleted = totalCompletedTasks.count === totalTasks.count;

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalSelectedTasks.count;
  const clientKey = JSON.stringify({
    filters: {
      ...filterOptions,
      priorities: [...filterOptions.priorities].sort(),
      statuses: [...filterOptions.statuses].sort(),
    },
    results: tasks.map(({ id, updatedAt }) => ({ id, updatedAt })),
    pagination: {
      hasNextPage,
    },
    derivedState: {
      allTasksCompleted,
    },
  });

  return {
    tasks,
    metadata: {
      hasPrevPage,
      hasNextPage,
      allTasksCompleted,
      day: selectedDay ? format(selectedDay, "yyyy-MM-dd") : null,
      projects,
      clientKey,
    },
  };
};
export const readTasksAction = async (filterOptions: {
  search: string;
  sortBy: DayTasksSortByOption;
  priorities: TaskPriority[];
  statuses: TaskStatus[];
  dateTimeStartRange: Date | null;
  dateTimeEndRange: Date | null;
  page: number;
  unassignedOnly?: boolean;
  allTasks?: boolean;
  projectIds?: string[];
  areaIds?: string[];
  selectedDay?: Date | null;
}) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedTasksAction(userId, user.timeZone, filterOptions);
};
export type ReadTasksActionReturnType = UnwrapAsync<typeof readTasksAction>;

export const updateTasksStatusAction = async (
  taskId: string | string[],
  newStatus: TaskStatus,
  options?: ActivityMutationOptions,
) => {
  if (!areValidIds(taskId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId, user } = await getCurrentUser();
  if (!userId || !user) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  try {
    let updatedTask;
    if (typeof taskId === "string") {
      updatedTask = await updateTaskDb(taskId, { status: newStatus }, options);
      if (!updatedTask)
        throw new Error("Failed to update task completion status.");
    } else {
      const tasks = await Promise.all(
        taskId.map((taskId) =>
          updateTaskDb(taskId, { status: newStatus }, options),
        ),
      );
      if (!tasks.every(Boolean) || tasks.length !== taskId.length)
        throw new Error("Failed to update tasks status.");

      updatedTask = tasks[0];
    }
    if (!updatedTask) throw new Error("Failed to update tasks status.");

    let allComplete = false;

    if (updatedTask.scheduledAt) {
      const { startUtc, endUtc } = getLocalDayBounds(
        updatedTask.scheduledAt,
        user.timeZone,
      );

      const [incompleteTasks] = await db
        .select({
          count: count(),
        })
        .from(TaskTable)
        .where(
          and(
            eq(TaskTable.userId, userId),
            ne(TaskTable.status, "completed"),
            gte(TaskTable.scheduledAt, startUtc),
            lte(TaskTable.scheduledAt, endUtc),
          ),
        );

      allComplete = incompleteTasks.count === 0;
    }

    return {
      error: false,
      message: "Task updated successfully!",
      allComplete,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: "Failed to update task completion status.",
    };
  }
};

export const updateTasksPriorityAction = async (
  taskId: string | string[],
  newPriority: TaskPriority,
  options?: ActivityMutationOptions,
) => {
  if (!areValidIds(taskId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  try {
    let update;
    if (Array.isArray(taskId)) {
      const updates = await Promise.all(
        taskId.map((taskId) =>
          updateTaskDb(taskId, { priority: newPriority }, options),
        ),
      );
      if (!updates.every(Boolean))
        throw new Error("Failed to update task priorities.");

      update = updates[0];
    } else {
      update = await updateTaskDb(taskId, { priority: newPriority }, options);
    }
    if (!update) throw new Error("Failed to update task priority.");

    return {
      error: false,
      message: "Task priority updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
