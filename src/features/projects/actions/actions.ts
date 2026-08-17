"use server";

import { ActivityMutationOptions, db } from "@/db/db";
import {
  AreaTable,
  Color,
  DocumentTable,
  MilestoneTable,
  ProjectStatus,
  ProjectTable,
  TaskTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { ArchiveStatusFilterOption } from "@/lib/params";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { cache } from "react";
import { ProjectsSortByOption } from "../lib/projects-params";
import {
  getAreaProjectTag,
  getProjectIdTag,
  getUserProjectTag,
} from "../server/cache/projects";
import {
  confirmUserProjectOwnership,
  deleteProjectDb,
  insertProjectDb,
  parseProjectData,
  readProjectsDb,
  updateProjectDb,
} from "../server/projects";
import {
  projectSchema,
  ProjectSchemaType,
  updateProjectSchema,
  UpdateProjectSchemaType,
} from "./schemas";
import { format, parseISO } from "date-fns";

const readCachedProjectsAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: ProjectsSortByOption;
    colors: Color[];
    statuses: ProjectStatus[];
    archiveStatus: ArchiveStatusFilterOption;
    dateTimeStartRange: Date | null;
    dateTimeEndRange: Date | null;
    page: number;
    areaIds?: string[];
  },
) => {
  "use cache";
  if (filterOptions.areaIds?.length) {
    filterOptions.areaIds?.forEach((areaId) => {
      cacheTag(getAreaProjectTag(areaId));
    });
  } else {
    cacheTag(getUserProjectTag(userId));
  }

  const response = await readProjectsDb({ ...filterOptions, userId });
  if (!response) return null;

  const { projects, whereQuery, areas } = response;

  const page = filterOptions.page;

  const [totalProjects] = await db
    .select({ count: count() })
    .from(ProjectTable)
    .where(whereQuery)
    .leftJoin(AreaTable, eq(AreaTable.id, ProjectTable.areaId));

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalProjects.count;
  const clientKey = JSON.stringify({
    filters: filterOptions,
    results: projects.map(({ id, updatedAt }) => ({ id, updatedAt })),
    hasNextPage,
  });

  return {
    projects,
    metadata: {
      hasPrevPage,
      hasNextPage,
      clientKey,
      areas,
    },
  };
};
export const readProjectsAction = async (filterOptions: {
  search: string;
  sortBy: ProjectsSortByOption;
  colors: Color[];
  statuses: ProjectStatus[];
  archiveStatus: ArchiveStatusFilterOption;
  dateTimeStartRange: Date | null;
  dateTimeEndRange: Date | null;
  page: number;
  areaIds?: string[];
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedProjectsAction(userId, filterOptions);
};
export type ReadProjectsActionReturnType = UnwrapAsync<
  typeof readProjectsAction
>;

const readCachedProjectAction = async (userId: string, projectId: string) => {
  "use cache";
  cacheTag(getProjectIdTag(projectId));

  const priorityRank = sql`
    CASE ${TaskTable.priority}
      WHEN 'urgent' THEN 1 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'high' THEN 2 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'medium' THEN 3 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'low' THEN 4 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      ELSE 5
    END
  `;

  const existingProject = await db.query.ProjectTable.findFirst({
    where: and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
    with: {
      user: true,
      tasks: {
        orderBy: asc(priorityRank),
        limit: 5,
      },
      documents: {
        orderBy: desc(DocumentTable.updatedAt),
        limit: 4,
      },
      milestones: {
        where: ne(MilestoneTable.status, "completed"),
        orderBy: asc(MilestoneTable.position),
        limit: 4,
      },
      area: true,
    },
  });

  const [taskCounts, milestoneCounts, [documentCount]] = await Promise.all([
    db
      .select({
        status: TaskTable.status,
        count: count(),
      })
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          existingProject?.id
            ? eq(TaskTable.projectId, existingProject.id)
            : undefined,
        ),
      )
      .groupBy(TaskTable.status),
    db
      .select({ status: MilestoneTable.status, count: count() })
      .from(MilestoneTable)
      .where(
        and(
          eq(MilestoneTable.userId, userId),
          existingProject?.id
            ? eq(MilestoneTable.projectId, existingProject.id)
            : undefined,
        ),
      )
      .groupBy(MilestoneTable.status),
    db
      .select({
        count: count(),
      })
      .from(DocumentTable)
      .where(
        and(
          eq(DocumentTable.userId, userId),
          existingProject?.id
            ? eq(DocumentTable.projectId, existingProject.id)
            : undefined,
        ),
      ),
  ]);

  return existingProject
    ? {
        ...existingProject,
        taskCounts,
        milestoneCounts,
        documentCount: documentCount.count,
      }
    : null;
};
export const readProjectAction = cache(async (projectId: string) => {
  if (!areValidIds(projectId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedProjectAction(userId, projectId);
});
export type ReadProjectActionReturnType = UnwrapAsync<typeof readProjectAction>;

export const createProjectAction = async (
  unsafeData: ProjectSchemaType,
  options?: ActivityMutationOptions,
) => {
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
    const createdProject = await insertProjectDb(parsedData, options);
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
  unsafeData: UpdateProjectSchemaType,
  options?: ActivityMutationOptions,
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

  const { success, data } = updateProjectSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const existingResult = projectSchema.safeParse({
    name: existingProject.name,
    outcome: existingProject.outcome,
    icon: existingProject.icon,
    status: existingProject.status,
    color: existingProject.color,
    areaId: existingProject.areaId,
    isArchived: existingProject.isArchived,
    startAt: existingProject.startAt ? parseISO(existingProject.startAt) : null,
    endAt: existingProject.endAt ? parseISO(existingProject.endAt) : null,
    ...data,
  });
  if (!existingResult.success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedProject = await updateProjectDb(
      projectId,
      {
        ...data,
        startAt: data.startAt ? format(data.startAt, "yyyy-MM-dd") : undefined,
        endAt: data.endAt ? format(data.endAt, "yyyy-MM-dd") : undefined,
      },
      options,
    );
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
  options?: ActivityMutationOptions,
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
    const updatedProject = await updateProjectDb(
      existingProject.id,
      {
        isArchived: newArchiveStatus,
        archivedAt: newArchiveStatus ? new Date() : null,
      },
      options,
    );
    if (!updatedProject)
      throw new Error("Failed to toggle project archive status.");

    return {
      error: false,
      message: newArchiveStatus
        ? "Project archived successfully!"
        : "Project restored successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteProjectAction = async (
  projectId: string,
  options?: ActivityMutationOptions,
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

  try {
    const deletedProject = await deleteProjectDb(existingProject.id, options);
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
