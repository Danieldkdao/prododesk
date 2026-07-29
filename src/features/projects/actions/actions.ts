"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
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
import { getProjectIdTag, getUserProjectTag } from "../server/cache/projects";
import { db } from "@/db/db";
import { AreaTable, ProjectTable } from "@/db/schema";
import { and, count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { UnwrapAsync } from "@/lib/types";
import { cache } from "react";

const readCachedProjectsAction = async (
  userId: string,
  filterOptions: { search: string; page: number },
) => {
  "use cache";
  cacheTag(getUserProjectTag(userId));

  const { search, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchQuery = search.trim()
    ? or(
        ilike(ProjectTable.name, searchTerm),
        ilike(ProjectTable.outcome, searchTerm),
        ilike(AreaTable.name, searchTerm),
        ilike(AreaTable.description, searchTerm),
      )
    : undefined;

  const whereQuery = and(eq(ProjectTable.userId, userId), searchQuery);

  const projects = await db
    .select({
      ...getTableColumns(ProjectTable),
      area: getTableColumns(AreaTable),
    })
    .from(ProjectTable)
    .where(whereQuery)
    .leftJoin(AreaTable, eq(AreaTable.id, ProjectTable.areaId))
    .orderBy(desc(ProjectTable.createdAt))
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalProjects] = await db
    .select({ count: count() })
    .from(ProjectTable)
    .where(whereQuery)
    .leftJoin(AreaTable, eq(AreaTable.id, ProjectTable.areaId));

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalProjects.count;

  return {
    projects,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};
export const readProjectsAction = async (filterOptions: {
  search: string;
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedProjectsAction(userId, filterOptions);
};
export type ReadProjectsActionReturnType = UnwrapAsync<
  typeof readProjectsAction
>;

export const readCachedProjectAction = async (
  userId: string,
  projectId: string,
) => {
  "use cache";
  cacheTag(getProjectIdTag(projectId));

  const existingProject = await db.query.ProjectTable.findFirst({
    where: and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
    with: {
      user: true,
      tasks: true,
      area: true,
    },
  });

  return existingProject ?? null;
};
export const readProjectAction = cache(async (projectId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedProjectAction(userId, projectId);
});
export type ReadProjectActionReturnType = UnwrapAsync<typeof readProjectAction>;

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
