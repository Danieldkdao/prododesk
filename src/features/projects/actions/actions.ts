"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  confirmUserProjectOwnership,
  deleteProjectDb,
  insertProjectDb,
  parseProjectData,
  updateProjectDb,
} from "../server/projects";
import { projectSchema, ProjectSchemaType } from "./schemas";
import { areValidIds } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getUserProjectTag } from "../server/cache/projects";
import { db } from "@/db/db";
import { AreaTable, ProjectTable } from "@/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { UnwrapAsync } from "@/lib/types";

const readCachedProjectsAction = async (userId: string) => {
  "use cache";
  cacheTag(getUserProjectTag(userId));

  const projects = await db
    .select({
      ...getTableColumns(ProjectTable),
      area: getTableColumns(AreaTable),
    })
    .from(ProjectTable)
    .where(eq(ProjectTable.userId, userId))
    .leftJoin(AreaTable, eq(AreaTable.id, ProjectTable.areaId))
    .orderBy(desc(ProjectTable.createdAt));

  return projects;
};
export const readProjectsAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedProjectsAction(userId);
};
export type ReadProjectsActionReturnType = UnwrapAsync<
  typeof readProjectsAction
>;

export const createProjectAction = async (unsafeData: ProjectSchemaType) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { success, data } = projectSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const parsedData = parseProjectData(userId, data);

  console.log(parsedData);

  try {
    const createdProject = await insertProjectDb(parsedData);
    if (!createdProject) throw new Error("Failed to create project.");

    return {
      error: false,
      message: "Project created successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateProjectAction = async (
  projectId: string,
  unsafeData: ProjectSchemaType,
) => {
  if (!areValidIds(projectId)) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { success, data } = projectSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const parsedData = parseProjectData(userId, data);

  try {
    const updatedProject = await updateProjectDb(projectId, parsedData);
    if (!updatedProject) throw new Error("Failed to update project.");

    return {
      error: false,
      message: "Project updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const toggleProjectArchiveStatusAction = async (
  projectId: string,
  newArchiveStatus: boolean,
) => {
  if (!areValidIds(projectId)) {
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

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const updatedProject = await updateProjectDb(existingProject.id, {
      isArchived: newArchiveStatus,
      archivedAt: new Date(),
    });
    if (!updatedProject)
      throw new Error("Failed to toggle project archive status.");

    return {
      error: false,
      message: newArchiveStatus
        ? "Project archived successfully!"
        : "Project reactivated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteProjectAction = async (projectId: string) => {
  if (!areValidIds(projectId)) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedProject = await deleteProjectDb(existingProject.id);
    if (!deletedProject) throw new Error("Failed to delete project.");

    return {
      error: false,
      message: "Project deleted successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
