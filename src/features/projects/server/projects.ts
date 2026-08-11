import { db, DbTransaction } from "@/db/db";
import {
  ProjectInsertType,
  ProjectSelectType,
  ProjectTable,
  TaskTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { SQLMap } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { ProjectSchemaType } from "../actions/schemas";
import { revalidateProjectCache } from "./cache/projects";
import { format } from "date-fns";
import { revalidateTaskCache } from "@/features/tasks/server/cache/tasks";
import { insertActivityDb } from "@/features/activity/server/activity";

export const confirmUserProjectOwnership = async (
  projectId: string,
  existingUserId?: string,
) => {
  let userIdToUse;
  if (existingUserId) {
    userIdToUse = existingUserId;
  } else {
    const { userId } = await getCurrentUser();

    userIdToUse = userId;
  }

  if (!userIdToUse) return null;

  const [existingProject] = await db
    .select()
    .from(ProjectTable)
    .where(
      and(eq(ProjectTable.userId, userIdToUse), eq(ProjectTable.id, projectId)),
    );

  return existingProject ?? null;
};

export const parseProjectData = (
  userId: string,
  projectData: ProjectSchemaType,
): ProjectInsertType => {
  const { startAt, endAt, ...rest } = projectData;

  return {
    ...rest,
    startAt: startAt ? format(startAt, "yyyy-MM-dd") : null,
    endAt: endAt ? format(endAt, "yyyy-MM-dd") : null,
    userId,
  };
};

const revalidateProjectTasksCache = async (projectId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  const existingProjectTasks = await db.query.TaskTable.findMany({
    where: and(
      eq(TaskTable.userId, userId),
      eq(TaskTable.projectId, projectId),
    ),
  });
  if (existingProjectTasks.length) {
    existingProjectTasks.forEach((task) => {
      revalidateTaskCache(task.userId, task.id);
    });
  }
};

export const insertProjectDb = async (
  projectData: ProjectInsertType,
  tx?: DbTransaction,
) => {
  try {
    const insertedProject = await db.transaction(async (pgtx) => {
      const [insertedProject] = await (tx ?? pgtx)
        .insert(ProjectTable)
        .values(projectData)
        .returning();

      if (!insertedProject) throw new Error("Failed to insert project.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "project",
          action: "create",
          subjectId: insertedProject.id,
          subjectLabel: insertedProject.name,
          projectId: insertedProject.id,
          message: `Started project "${insertedProject.name}"`,
        },
        tx ?? pgtx,
      );

      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedProject;
    });

    revalidateProjectCache(
      insertedProject.userId,
      insertedProject.id,
      insertedProject.areaId,
    );

    return insertedProject;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateProjectDb = async (
  projectId: string,
  projectData: SQLMap<
    Omit<
      Partial<ProjectSelectType>,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  >,
  tx?: DbTransaction,
) => {
  try {
    const existingProject = await confirmUserProjectOwnership(projectId);
    if (!existingProject) return null;

    const updatedProject = await db.transaction(async (pgtx) => {
      const [updatedProject] = await (tx ?? pgtx)
        .update(ProjectTable)
        .set(projectData)
        .where(
          and(
            eq(ProjectTable.id, existingProject.id),
            and(eq(ProjectTable.userId, existingProject.userId)),
          ),
        )
        .returning();
      if (!updatedProject) throw new Error("Failed to update project.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "project",
          action: "create",
          subjectId: updatedProject.id,
          subjectLabel: updatedProject.name,
          projectId: updatedProject.id,
          message: `Updated project "${updatedProject.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedProject;
    });

    revalidateProjectTasksCache(updatedProject.id);
    revalidateProjectCache(
      updatedProject.userId,
      updatedProject.id,
      updatedProject.areaId,
    );

    return updatedProject;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteProjectDb = async (
  projectId: string,
  tx?: DbTransaction,
) => {
  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  try {
    const deletedProject = await db.transaction(async (pgtx) => {
      const [deletedProject] = await (tx ?? pgtx)
        .delete(ProjectTable)
        .where(
          and(
            eq(ProjectTable.id, existingProject.id),
            eq(ProjectTable.userId, existingProject.userId),
          ),
        )
        .returning();
      if (!deletedProject) throw new Error("Failed to delete project.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "create",
          subject: "project",
          subjectId: deletedProject.id,
          subjectLabel: deletedProject.name,
          projectId: deletedProject.id,
          message: `Deleted project "${deletedProject.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedProject;
    });

    revalidateProjectTasksCache(deletedProject.id);
    revalidateProjectCache(
      deletedProject.userId,
      deletedProject.id,
      deletedProject.areaId,
    );

    return deletedProject;
  } catch (error) {
    console.error(error);
    return null;
  }
};
