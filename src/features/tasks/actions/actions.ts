"use server";

import { db } from "@/db/db";
import { TaskTable, TaskTableSelectType } from "@/db/schema";
import { calculateCalendarValues } from "@/features/calendar/lib/utils";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { mergeDateTime } from "@/lib/utils";
import { format, isSameDay, parse } from "date-fns";
import { and, asc, eq, gte, lte } from "drizzle-orm";
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
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const getCalendarTasksAction = async (
  dateToUse: Date,
  selectedDay: Date | null,
) => {
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

  let selectedDayTasks: TaskTableSelectType[] | null = null;

  const monthDaysWithTasks = monthDays.map((day) => {
    const dayTasks = tasks.filter((task) => {
      const dayString = format(day, "yyyy-MM-dd");
      return task.day === dayString;
    });

    if (selectedDay && isSameDay(day, selectedDay)) {
      selectedDayTasks = dayTasks;
    }

    return {
      day,
      tasks: dayTasks,
    };
  });

  return {
    monthDaysTasks: monthDaysWithTasks,
    selectedDayTasks,
  };
};
export type GetCalendarTasksActionReturnType = Omit<
  UnwrapAsync<typeof getCalendarTasksAction>,
  "selectedDayTasks"
> & { selectedDayTasks: TaskTableSelectType[] | null };

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

    return {
      error: false,
      message: "Task updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: "Failed to update task completion status.",
    };
  }
};
