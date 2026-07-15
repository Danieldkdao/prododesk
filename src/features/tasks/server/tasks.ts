import { db } from "@/db/db";
import {
  TaskTable,
  TaskTableInsertType,
  TaskTableSelectType,
} from "@/db/schema";
import { revalidateTaskCache } from "./cache/tasks";
import { and, eq, SQL } from "drizzle-orm";

export const confirmUserTaskOwnership = async (
  userId: string,
  taskId: string,
  additionalFilters: SQL<unknown>[] = [],
) => {
  const [existingTask] = await db
    .select()
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        eq(TaskTable.id, taskId),
        ...additionalFilters,
      ),
    );
  return existingTask;
};

export const insertTaskDb = async (taskData: TaskTableInsertType) => {
  const [insertedTask] = await db
    .insert(TaskTable)
    .values(taskData)
    .returning();

  revalidateTaskCache(insertedTask.userId, insertedTask.id);

  return insertedTask;
};

export const updateTaskDb = async (
  taskId: string,
  taskData: Omit<
    Partial<TaskTableSelectType>,
    "id" | "name" | "createdAt" | "updatedAt" | "userId"
  >,
) => {
  const [updatedTask] = await db
    .update(TaskTable)
    .set(taskData)
    .where(eq(TaskTable.id, taskId))
    .returning();

  revalidateTaskCache(updatedTask.userId, updatedTask.id);

  return updatedTask;
};

export const deleteTaskDb = async (taskId: string) => {
  const [deletedTask] = await db
    .delete(TaskTable)
    .where(eq(TaskTable.id, taskId))
    .returning();

  revalidateTaskCache(deletedTask.userId, deletedTask.id);

  return deletedTask;
};
