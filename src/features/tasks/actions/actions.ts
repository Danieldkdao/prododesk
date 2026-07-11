"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { mergeDateTime } from "@/lib/utils";
import {
  confirmUserTaskOwnership,
  deleteTaskDb,
  insertTaskDb,
  updateTaskDb,
} from "../server/tasks";
import { taskSchema, TaskSchemaType } from "./schemas";
import { db } from "@/db/db";
import { TaskTable } from "@/db/schema";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { format, isSameDay, parse } from "date-fns";
import { UnwrapAsync } from "@/lib/types";

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
  startRange: Date,
  endRange: Date,
  monthDays: Date[],
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const tasks = await db
    .select()
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        or(
          gte(TaskTable.day, format(startRange, "yyyy-MM-dd")),
          lte(TaskTable.day, format(endRange, "yyyy-MM-dd")),
        ),
      ),
    );

  const monthDaysWithTasks = monthDays.map((day) => {
    const dayTasks = tasks.filter((task) => {
      const parsedDay = parse(task.day, "yyyy-MM-dd", new Date());
      return isSameDay(parsedDay, day);
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
