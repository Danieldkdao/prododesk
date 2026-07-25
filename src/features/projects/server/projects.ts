import { db, DbTransaction } from "@/db/db";
import {
  ProjectInsertType,
  ProjectSelectType,
  ProjectTable,
} from "@/db/schema";
import { revalidateProjectCache } from "./cache/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq } from "drizzle-orm";
import { SQLMap } from "@/lib/types";
import { ProjectSchemaType } from "../actions/schemas";
import { parse } from "date-fns";

export const confirmUserProjectOwnership = async (projectId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingProject] = await db
    .select()
    .from(ProjectTable)
    .where(
      and(eq(ProjectTable.userId, userId), eq(ProjectTable.id, projectId)),
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
    startAt: startAt ? parse(startAt, "yyyy-MM-dd", new Date()) : null,
    endAt: endAt ? parse(endAt, "yyyy-MM-dd", new Date()) : null,
    userId,
  };
};

export const insertProjectDb = async (
  projectData: ProjectInsertType,
  tx?: DbTransaction,
) => {
  const [insertedProject] = await (tx ?? db)
    .insert(ProjectTable)
    .values(projectData)
    .returning();

  revalidateProjectCache(insertedProject.userId, insertedProject.id);

  return insertedProject;
};

export const updateProjectDb = async (
  projectId: string,
  projectData: SQLMap<
    Omit<
      Partial<ProjectSelectType>,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  >,
) => {
  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  const [updatedProject] = await db
    .update(ProjectTable)
    .set(projectData)
    .where(
      and(
        eq(ProjectTable.id, existingProject.id),
        and(eq(ProjectTable.userId, existingProject.userId)),
      ),
    )
    .returning();

  revalidateProjectCache(updatedProject.userId, updatedProject.id);

  return updatedProject;
};

export const deleteProjectDb = async (projectId: string) => {
  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  const [deletedProject] = await db
    .delete(ProjectTable)
    .where(
      and(
        eq(ProjectTable.id, existingProject.id),
        eq(ProjectTable.userId, existingProject.userId),
      ),
    )
    .returning();

  revalidateProjectCache(deletedProject.userId, deletedProject.id);

  return deletedProject;
};
