"use server";

import { ActivityMutationOptions, db } from "@/db/db";
import {
  MilestoneSelectType,
  ProjectSelectType,
  ProjectTable,
  taskPriorities,
  TaskPriority,
  TaskSelectType,
  TaskStatus,
  taskStatuses,
  TaskTable,
} from "@/db/schema";
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
import { areValidIds, getLocalDayBounds } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { and, count, eq, gte, lte, ne } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { TasksFilters } from "../lib/tasks-params";
import { getTaskIdTag, getUserTaskTag } from "../server/cache/tasks";
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
import { CalendarFilters } from "@/features/calendar/lib/calendar-params";
import { tz } from "@date-fns/tz";
import {
  BoardProperty,
  TaskBoardColumnValue,
  PaginationCursor,
} from "../lib/types";
import { TASK_BOARD_PAGE_SIZE } from "../lib/constants";

type ReadCalendarTasksFilters = Pick<CalendarFilters, "view"> & {
  month: CalendarFilters["month"];
  projectIds?: string[];
  areaIds?: string[];
} & Partial<
    Omit<TasksFilters, "dateTimeStartRange" | "dateTimeEndRange" | "sortBy">
  >;

type ReadTasksFilters = TasksFilters & {
  page: number;
  unassignedOnly?: boolean;
  allTasks?: boolean;
  selectedDay?: CalendarFilters["day"];
  projectIds?: string[];
  areaIds?: string[];
};

export type TaskBoardFilters = Omit<TasksFilters, "sortBy"> & {
  projectIds?: string[];
  areaIds?: string[];
};

export type TaskBoardTask = TaskSelectType & {
  project: ProjectSelectType | null;
  milestone: MilestoneSelectType | null;
};

export type TaskBoardColumnPage = {
  tasks: TaskBoardTask[];
  nextCursor: PaginationCursor | null;
  hasNextPage: boolean;
};

export type TaskBoardData = {
  property: BoardProperty;
  columns: Partial<Record<TaskBoardColumnValue, TaskBoardColumnPage>>;
  projects: ProjectSelectType[];
  queryKey: string;
};

export type ReadTaskBoardOptions = TaskBoardFilters & {
  property: BoardProperty;
};

export type ReadTaskBoardColumnOptions = ReadTaskBoardOptions & {
  column: TaskBoardColumnValue;
  cursor?: PaginationCursor | null;
};

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

const readCachedCalendarTasks = async (
  userId: string,
  timeZone: string,
  options: ReadCalendarTasksFilters,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const { month, ...rest } = options;

  if (!isValid(month)) return null;

  const { monthDays } = calculateCalendarValues(month);

  const response = await readTasksDb({
    userId,
    selectedMonth: month,
    timeZone,
    allTasks: true,
    ...rest,
  });
  if (!response) return null;

  const { tasks } = response;

  type CalendarTask = (typeof tasks)[number];
  type DayBucket = {
    scheduled: CalendarTask[];
    due: CalendarTask[];
  };

  const tasksByDay = new Map<string, DayBucket>();
  const timeZoneContext = tz(timeZone);

  const addTaskToDay = (
    date: Date,
    kind: keyof DayBucket,
    task: CalendarTask,
  ) => {
    const key = format(date, "yyyy-MM-dd", {
      in: timeZoneContext,
    });

    const bucket = tasksByDay.get(key) ?? {
      scheduled: [],
      due: [],
    };
    bucket[kind].push(task);
    tasksByDay.set(key, bucket);
  };

  for (const task of tasks) {
    if (task.scheduledAt) {
      addTaskToDay(task.scheduledAt, "scheduled", task);
    }
    if (task.dueAt) {
      addTaskToDay(task.dueAt, "due", task);
    }
  }

  const monthDaysWithTasks = monthDays.map((day) => {
    const key = format(day, "yyyy-MM-dd");

    return {
      day,
      tasks:
        tasksByDay.get(key) ?? ({ scheduled: [], due: [] } satisfies DayBucket),
    };
  });

  return {
    month,
    monthDaysTasks: monthDaysWithTasks,
  };
};
export const readCalendarTasksAction = async (
  options: ReadCalendarTasksFilters,
) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedCalendarTasks(userId, user.timeZone, options);
};
export type ReadCalendarTasksActionReturnType = UnwrapAsync<
  typeof readCalendarTasksAction
>;

const readCachedTasksAction = async (
  userId: string,
  timeZone: string,
  filterOptions: ReadTasksFilters,
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
export const readTasksAction = async (filterOptions: ReadTasksFilters) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedTasksAction(userId, user.timeZone, filterOptions);
};
export type ReadTasksActionReturnType = UnwrapAsync<typeof readTasksAction>;

const getTaskBoardColumns = (property: BoardProperty) =>
  property === "status" ? taskStatuses : taskPriorities;

const readTaskBoardColumnPage = async (
  userId: string,
  timeZone: string,
  options: ReadTaskBoardColumnOptions,
) => {
  const { property, column, cursor, ...filters } = options;
  const validColumns = getTaskBoardColumns(property) as readonly string[];

  if (!validColumns.includes(column)) return null;

  const response = await readTasksDb({
    ...filters,
    userId,
    timeZone,
    limit: TASK_BOARD_PAGE_SIZE + 1,
    board: {
      property,
      column,
      cursor,
    },
  });
  if (!response) return null;

  const hasNextPage = response.tasks.length > TASK_BOARD_PAGE_SIZE;
  const tasks = response.tasks.slice(0, TASK_BOARD_PAGE_SIZE);
  const lastTask = tasks.at(-1);

  return {
    page: {
      tasks,
      hasNextPage,
      nextCursor:
        hasNextPage && lastTask
          ? {
              createdAt: lastTask.createdAt,
              id: lastTask.id,
            }
          : null,
    } satisfies TaskBoardColumnPage,
    projects: response.projects,
  };
};
const readCachedTaskBoardAction = async (
  userId: string,
  timeZone: string,
  options: ReadTaskBoardOptions,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const columns = getTaskBoardColumns(options.property);

  const responses = await Promise.all(
    columns.map((column) =>
      readTaskBoardColumnPage(userId, timeZone, { ...options, column }),
    ),
  );
  if (responses.some((response) => !response)) return null;

  const columnPages = Object.fromEntries(
    columns.map((column, index) => [column, responses[index]!.page]),
  ) as TaskBoardData["columns"];

  return {
    property: options.property,
    columns: columnPages,
    projects: responses[0]?.projects ?? [],
    queryKey: JSON.stringify({
      ...options,
      priorities: [...options.priorities].sort(),
      statuses: [...options.statuses].sort(),
      projectIds: options.projectIds ? [...options.projectIds].sort() : null,
      areaIds: options.areaIds ? [...options.areaIds].sort() : null,
    }),
  } satisfies TaskBoardData;
};
export const readTaskBoardAction = async (options: ReadTaskBoardOptions) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedTaskBoardAction(userId, user.timeZone, options);
};

const readCachedTaskBoardColumnAction = async (
  userId: string,
  timeZone: string,
  options: ReadTaskBoardColumnOptions,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const response = await readTaskBoardColumnPage(userId, timeZone, options);

  return response?.page ?? null;
};
export const readTaskBoardColumnAction = async (
  options: ReadTaskBoardColumnOptions,
) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedTaskBoardColumnAction(userId, user.timeZone, options);
};

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

const readCachedTaskAction = async (userId: string, taskId: string) => {
  "use cache";
  cacheTag(getTaskIdTag(taskId));

  const task = await db.query.TaskTable.findFirst({
    where: and(eq(TaskTable.userId, userId), eq(TaskTable.id, taskId)),
    with: {
      project: true,
      milestone: true,
    },
  });

  return task ?? null;
};
export const readTaskAction = async (taskId: string | null) => {
  if (!taskId || !areValidIds(taskId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedTaskAction(userId, taskId);
};
export type ReadTaskActionReturnType = UnwrapAsync<typeof readTaskAction>;
