import { db } from "@/db/db";
import { TaskTable, TaskInsertType, TaskSelectType } from "@/db/schema";
import { revalidateTaskCache } from "./cache/tasks";
import { and, eq, SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/helpers";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { revalidateMilestoneCache } from "@/features/milestones/server/cache/milestones";

export const confirmUserTaskOwnership = async (
  taskId: string,
  additionalFilters: SQL<unknown>[] = [],
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

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
  return existingTask ?? null;
};

export const insertTaskDb = async (taskData: TaskInsertType) => {
  const [insertedTask] = await db
    .insert(TaskTable)
    .values(taskData)
    .returning();

  revalidateTaskCache(insertedTask.userId, insertedTask.id);
  if (insertedTask?.projectId) {
    revalidateProjectCache(insertedTask.userId, insertedTask.projectId);
  }

  return insertedTask;
};

export const updateTaskDb = async (
  taskId: string,
  taskData: Omit<
    Partial<TaskSelectType>,
    "id" | "createdAt" | "updatedAt" | "userId"
  >,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) return null;

  const [updatedTask] = await db
    .update(TaskTable)
    .set(taskData)
    .where(eq(TaskTable.id, existingTask.id))
    .returning();

  revalidateTaskCache(updatedTask.userId, updatedTask.id);
  if (updatedTask?.projectId) {
    revalidateProjectCache(updatedTask.userId, updatedTask.projectId);
    revalidateMilestoneCache(updatedTask.userId, updatedTask.projectId);
  }

  return updatedTask;
};

export const deleteTaskDb = async (taskId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) return null;

  const [deletedTask] = await db
    .delete(TaskTable)
    .where(eq(TaskTable.id, existingTask.id))
    .returning();

  revalidateTaskCache(deletedTask.userId, deletedTask.id);
  if (deletedTask?.projectId) {
    revalidateProjectCache(deletedTask.userId, deletedTask.projectId);
  }

  return deletedTask;
};
