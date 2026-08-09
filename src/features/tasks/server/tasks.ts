import { db, DbTransaction } from "@/db/db";
import { TaskTable, TaskInsertType, TaskSelectType } from "@/db/schema";
import { revalidateTaskCache } from "./cache/tasks";
import { and, eq, SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/helpers";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { revalidateMilestoneCache } from "@/features/milestones/server/cache/milestones";
import { insertActivityDb } from "@/features/activity/server/activity";

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

export const insertTaskDb = async (
  taskData: TaskInsertType,
  tx?: DbTransaction,
) => {
  try {
    const insertedTask = await db.transaction(async (pgtx) => {
      const [insertedTask] = await (tx ?? pgtx)
        .insert(TaskTable)
        .values(taskData)
        .returning();

      if (!insertedTask) throw new Error("Failed to insert task.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "task",
          action: "create",
          subjectId: insertedTask.id,
          subjectLabel: insertedTask.name,
          projectId: insertedTask.projectId,
          message: `Created task "${insertedTask.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedTask;
    });

    revalidateTaskCache(insertedTask.userId, insertedTask.id);
    if (insertedTask?.projectId) {
      revalidateProjectCache(insertedTask.userId, insertedTask.projectId);
    }

    return insertedTask;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateTaskDb = async (
  taskId: string,
  taskData: Omit<
    Partial<TaskSelectType>,
    "id" | "createdAt" | "updatedAt" | "userId"
  >,
  tx?: DbTransaction,
) => {
  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) return null;

  try {
    const updatedTask = await db.transaction(async (pgtx) => {
      const [updatedTask] = await (tx ?? pgtx)
        .update(TaskTable)
        .set(taskData)
        .where(eq(TaskTable.id, existingTask.id))
        .returning();
      if (!updatedTask) throw new Error("Failed to update task.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "task",
          action: "update",
          subjectId: updatedTask.id,
          subjectLabel: updatedTask.name,
          projectId: updatedTask.projectId,
          message: `Updated task ${updatedTask.name}`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedTask;
    });

    revalidateTaskCache(updatedTask.userId, updatedTask.id);
    if (updatedTask?.projectId) {
      revalidateProjectCache(updatedTask.userId, updatedTask.projectId);
      revalidateMilestoneCache(updatedTask.userId, updatedTask.projectId);
    }

    return updatedTask;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteTaskDb = async (taskId: string, tx?: DbTransaction) => {
  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) return null;

  try {
    const deletedTask = await db.transaction(async (pgtx) => {
      const [deletedTask] = await (tx ?? pgtx)
        .delete(TaskTable)
        .where(eq(TaskTable.id, existingTask.id))
        .returning();
      if (!deletedTask) throw new Error("Failed to delete task.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "task",
          action: "delete",
          subjectId: deletedTask.id,
          subjectLabel: deletedTask.name,
          projectId: deletedTask.projectId,
          message: `Deleted task "${deletedTask.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedTask;
    });

    revalidateTaskCache(deletedTask.userId, deletedTask.id);
    if (deletedTask?.projectId) {
      revalidateProjectCache(deletedTask.userId, deletedTask.projectId);
    }

    return deletedTask;
  } catch (error) {
    console.error(error);
    return null;
  }
};
