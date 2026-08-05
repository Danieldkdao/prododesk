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
import {
  AreaTable,
  Color,
  ProjectStatus,
  ProjectTable,
  TaskSelectType,
  TaskTable,
} from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { UnwrapAsync } from "@/lib/types";
import { cache } from "react";
import { ProjectsSortByOption } from "../lib/projects-params";
import { ArchiveStatusFilterOption } from "@/lib/params";
import { format } from "date-fns";

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
  },
) => {
  "use cache";
  cacheTag(getUserProjectTag(userId));

  const {
    search,
    sortBy,
    colors,
    statuses,
    archiveStatus,
    dateTimeStartRange,
    dateTimeEndRange,
    page,
  } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchFilter = search.trim()
    ? or(
        ilike(ProjectTable.name, searchTerm),
        ilike(ProjectTable.outcome, searchTerm),
        ilike(AreaTable.name, searchTerm),
        ilike(AreaTable.description, searchTerm),
      )
    : undefined;

  const sortByMap: Record<ProjectsSortByOption, SQL<unknown>> = {
    oldest: asc(ProjectTable.createdAt),
    recently_created: desc(ProjectTable.createdAt),
    recently_updated: desc(ProjectTable.updatedAt),
  };

  const archiveStatusMap: Record<
    ArchiveStatusFilterOption,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    active: and(
      eq(ProjectTable.isArchived, false),
      isNull(ProjectTable.archivedAt),
    ),
    archived: and(
      eq(ProjectTable.isArchived, true),
      isNotNull(ProjectTable.archivedAt),
    ),
  };

  const colorsFilter = colors.length
    ? inArray(ProjectTable.color, colors)
    : undefined;
  const statusesFilter = statuses.length
    ? inArray(ProjectTable.status, statuses)
    : undefined;

  const dateTimeRangeFilter = and(
    dateTimeStartRange
      ? gte(ProjectTable.startAt, format(dateTimeStartRange, "yyyy-MM-dd"))
      : undefined,
    dateTimeEndRange
      ? lte(ProjectTable.startAt, format(dateTimeEndRange, "yyyy-MM-dd"))
      : undefined,
  );

  const whereQuery = and(
    eq(ProjectTable.userId, userId),
    searchFilter,
    colorsFilter,
    statusesFilter,
    dateTimeRangeFilter,
    archiveStatusMap[archiveStatus],
  );

  const priorityRank = sql`
    CASE ${TaskTable.priority}
      WHEN 'urgent' THEN 1 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'high' THEN 2 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'medium' THEN 3 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'low' THEN 4 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      ELSE 5
    END
  `;

  const projects = await db
    .select({
      ...getTableColumns(ProjectTable),
      area: getTableColumns(AreaTable),
      taskCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${TaskTable} tt
        WHERE tt.project_id = ${ProjectTable.id}
      )`,
      completeTaskCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${TaskTable} tt
        WHERE tt.project_id = ${ProjectTable.id}
          AND tt.status = 'completed'
      )`,
      nextTask: sql<TaskSelectType | null>`(
        ${db
          .select({ task: sql`row_to_json(tasks.*)` })
          .from(TaskTable)
          .where(
            and(
              ne(TaskTable.status, "completed"),
              eq(TaskTable.projectId, ProjectTable.id),
            ),
          )
          .orderBy(asc(priorityRank))
          .limit(1)}
      )`.mapWith((val) => {
        if (!val) return null;
        return typeof val === "string" ? JSON.parse(val) : val;
      }),
    })
    .from(ProjectTable)
    .where(whereQuery)
    .leftJoin(AreaTable, eq(AreaTable.id, ProjectTable.areaId))
    .orderBy(sortByMap[sortBy])
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
  sortBy: ProjectsSortByOption;
  colors: Color[];
  statuses: ProjectStatus[];
  archiveStatus: ArchiveStatusFilterOption;
  dateTimeStartRange: Date | null;
  dateTimeEndRange: Date | null;
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
