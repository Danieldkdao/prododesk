"use server";

import { db } from "@/db/db";
import {
  ProjectSelectType,
  ProjectTable,
  TaskPriority,
  TaskStatus,
  TaskTable,
} from "@/db/schema";
import { calculateCalendarValues } from "@/features/calendar/lib/utils";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
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
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { DayTasksSortByOption } from "../lib/tasks-params";
import { getUserTaskTag } from "../server/cache/tasks";
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

  const { data, success, error } = taskSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: error.message,
    };
  }

  try {
    const createdTask = await insertTaskDb({ ...data, userId });
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

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const updatedTask = await updateTaskDb(existingTask.id, data);
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

  try {
    const updatedTask = await updateTaskDb(existingTask.id, { milestoneId });
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

export const deleteTaskAction = async (taskId: string) => {
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
  selectedDay: Date | null,
  projectIds: string[],
  timeZone: string,
  filterOptions: {
    search: string;
    sortBy: DayTasksSortByOption;
    priorities: TaskPriority[];
    statuses: TaskStatus[];
    dateTimeStartRange: Date | null;
    dateTimeEndRange: Date | null;
    page: number;
  },
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  if (!projectIds.length && !selectedDay) return null;

  const {
    search,
    sortBy,
    priorities,
    statuses,
    dateTimeStartRange,
    dateTimeEndRange,
    page,
  } = filterOptions;

  let existingProjects;

  if (projectIds.length) {
    if (!areValidIds(projectIds)) return null;

    existingProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userId),
      ),
    );
    if (
      !existingProjects.every((project): project is ProjectSelectType =>
        Boolean(project),
      )
    )
      return null;
  }

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;

  const priorityRank = sql`
    CASE ${TaskTable.priority}
      WHEN 'urgent' THEN 1 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'high' THEN 2 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'medium' THEN 3 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'low' THEN 4 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      ELSE 5
    END
  `;

  const searchFilter = search.trim()
    ? or(
        ilike(TaskTable.name, searchTerm),
        ilike(TaskTable.description, searchTerm),
        ilike(ProjectTable.name, searchTerm),
      )
    : undefined;

  const priorityFilter = priorities.length
    ? inArray(TaskTable.priority, priorities)
    : undefined;

  const sortByMap: Record<DayTasksSortByOption, SQL<unknown>> = {
    name_a_z: asc(sql`lower(${TaskTable.name})`),
    name_z_a: desc(sql`lower(${TaskTable.name})`),
    oldest: asc(TaskTable.createdAt),
    priority: asc(priorityRank),
    recently_created: desc(TaskTable.createdAt),
  };

  const statusFilter = statuses.length
    ? inArray(TaskTable.status, statuses)
    : undefined;

  const projectsFilter = projectIds.length
    ? inArray(TaskTable.projectId, projectIds)
    : undefined;

  const timeRangeFilter = and(
    dateTimeStartRange
      ? gte(TaskTable.scheduledAt, dateTimeStartRange)
      : undefined,
    dateTimeEndRange ? lte(TaskTable.scheduledAt, dateTimeEndRange) : undefined,
  );

  let dayFilter;

  if (selectedDay) {
    const { startUtc, endUtc } = getLocalDayBounds(selectedDay, timeZone);

    dayFilter = and(
      gte(TaskTable.scheduledAt, startUtc),
      lte(TaskTable.scheduledAt, endUtc),
    );
  }

  const whereQuery = and(
    eq(TaskTable.userId, userId),
    dayFilter,
    searchFilter,
    priorityFilter,
    projectsFilter,
    statusFilter,
    timeRangeFilter,
  );

  const tasks = await db
    .select({
      ...getTableColumns(TaskTable),
      project: getTableColumns(ProjectTable),
    })
    .from(TaskTable)
    .where(whereQuery)
    .leftJoin(ProjectTable, eq(ProjectTable.id, TaskTable.projectId))
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

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

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalSelectedTasks.count;
  const clientKey = `${JSON.stringify(tasks)}${hasNextPage ? "has next page" : "no next page"}`;

  return {
    tasks,
    metadata: {
      hasPrevPage,
      hasNextPage,
      allTasksCompleted: totalCompletedTasks.count === totalTasks.count,
      day: selectedDay ? format(selectedDay, "yyyy-MM-dd") : null,
      projects: existingProjects ?? null,
      clientKey,
    },
  };
};
export const readTasksAction = async (
  selectedDay: Date | null,
  projectIds: string[],
  filterOptions: {
    search: string;
    sortBy: DayTasksSortByOption;
    priorities: TaskPriority[];
    statuses: TaskStatus[];
    dateTimeStartRange: Date | null;
    dateTimeEndRange: Date | null;
    page: number;
  },
) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedTasksAction(
    userId,
    selectedDay,
    projectIds,
    user.timeZone,
    filterOptions,
  );
};
export type ReadTasksActionReturnType = UnwrapAsync<typeof readTasksAction>;

export const updateTasksStatusAction = async (
  taskId: string | string[],
  newStatus: TaskStatus,
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
      updatedTask = await updateTaskDb(taskId, {
        status: newStatus,
      });
      if (!updatedTask)
        throw new Error("Failed to update task completion status.");
    } else {
      const tasks = await Promise.all(
        taskId.map((taskId) => updateTaskDb(taskId, { status: newStatus })),
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
        taskId.map((taskId) => updateTaskDb(taskId, { priority: newPriority })),
      );
      if (!updates.every(Boolean))
        throw new Error("Failed to update task priorities.");

      update = updates[0];
    } else {
      update = await updateTaskDb(taskId, { priority: newPriority });
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
