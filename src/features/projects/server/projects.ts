import { db, DbTransaction } from "@/db/db";
import {
  AreaSelectType,
  AreaTable,
  Color,
  ProjectInsertType,
  ProjectSelectType,
  ProjectStatus,
  ProjectTable,
  TaskSelectType,
  TaskTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { revalidateTaskCache } from "@/features/tasks/server/cache/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { ArchiveStatusFilterOption } from "@/lib/params";
import { SQLMap } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { format } from "date-fns";
import {
  and,
  asc,
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
  SQL,
  sql,
} from "drizzle-orm";
import { ProjectSchemaType } from "../actions/schemas";
import { ProjectsSortByOption } from "../lib/projects-params";
import { revalidateProjectCache } from "./cache/projects";

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
    with: {
      project: true,
    },
  });
  if (existingProjectTasks.length) {
    existingProjectTasks.forEach((task) => {
      revalidateTaskCache(
        task.userId,
        task.id,
        task.projectId,
        task.project?.areaId,
      );
    });
  }
};

export const readProjectsDb = async (filterOptions: {
  search?: string;
  sortBy?: ProjectsSortByOption;
  colors?: Color[];
  statuses?: ProjectStatus[];
  archiveStatus?: ArchiveStatusFilterOption;
  dateTimeStartRange?: Date | null;
  dateTimeEndRange?: Date | null;
  page?: number;
  projectIds?: string[];
  areaIds?: string[];
  userId?: string;
  limit?: number;
}) => {
  const {
    search,
    sortBy,
    colors,
    statuses,
    archiveStatus,
    dateTimeStartRange,
    dateTimeEndRange,
    page,
    projectIds,
    areaIds,
    userId,
    limit = PAGE_SIZE,
  } = filterOptions;
  let userIdToUse: string | null = null;
  if (userId) {
    userIdToUse = userId;
  } else {
    const { userId } = await getCurrentUser();
    if (!userId) return null;

    userIdToUse = userId;
  }

  if (!userIdToUse) return null;

  let offset: number | null = null;
  if (page) {
    offset = (page - 1) * PAGE_SIZE;
  }

  const searchTerm = `%${search?.trim()}%`;
  const searchFilter = search?.trim()
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

  const colorsFilter = colors?.length
    ? inArray(ProjectTable.color, colors)
    : undefined;
  const statusesFilter = statuses?.length
    ? inArray(ProjectTable.status, statuses)
    : undefined;

  const dateTimeRangeFilter = and(
    dateTimeStartRange
      ? gte(ProjectTable.startAt, format(dateTimeStartRange, "yyyy-MM-dd"))
      : undefined,
    dateTimeEndRange
      ? lte(ProjectTable.endAt, format(dateTimeEndRange, "yyyy-MM-dd"))
      : undefined,
  );

  let areas: AreaSelectType[] = [];
  if (areaIds?.length) {
    if (!areValidIds(areaIds)) return null;

    const existingAreas = await Promise.all(
      areaIds.map((areaId) => confirmUserAreaOwnership(areaId, userIdToUse)),
    );
    if (!existingAreas.every(Boolean)) {
      return null;
    }
    areas = existingAreas.filter((area): area is AreaSelectType =>
      Boolean(area),
    );
  }

  const areaFilters = areas.length
    ? inArray(
        ProjectTable.areaId,
        areas.map((area) => area.id),
      )
    : undefined;

  let existingProjectIds: string[] = [];
  if (projectIds?.length) {
    if (!areValidIds(projectIds)) return null;

    const existingProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userId),
      ),
    );
    existingProjectIds = existingProjects
      .filter((project): project is ProjectSelectType => Boolean(project))
      .map((project) => project.id);
    if (existingProjectIds.length !== projectIds.length) return null;
  }

  const projectsFilter = existingProjectIds.length
    ? inArray(ProjectTable.id, existingProjectIds)
    : undefined;

  const archiveFilter = archiveStatus
    ? archiveStatusMap[archiveStatus]
    : undefined;

  const whereQuery = and(
    eq(ProjectTable.userId, userIdToUse),
    searchFilter,
    colorsFilter,
    statusesFilter,
    dateTimeRangeFilter,
    archiveFilter,
    areaFilters,
    projectsFilter,
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

  let query = db
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
    .$dynamic();

  if (sortBy) {
    query = query.orderBy(sortByMap[sortBy]).$dynamic();
  }
  if (offset !== undefined && offset !== null) {
    query = query.offset(offset).$dynamic();
  }

  const projects = await query.limit(limit);

  return {
    projects,
    areas,
    whereQuery,
  };
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
      existingProject.areaId,
    );

    if (updatedProject.areaId !== existingProject.areaId) {
      revalidateProjectCache(
        updatedProject.userId,
        updatedProject.id,
        updatedProject.areaId,
      );
    }

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
