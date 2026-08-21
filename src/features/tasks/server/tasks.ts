import { ActivityMutationOptions, db, DbTransaction } from "@/db/db";
import {
  AreaSelectType,
  MilestoneTable,
  ProjectSelectType,
  ProjectTable,
  TaskInsertType,
  TaskSelectType,
  TaskTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { revalidateMilestoneCache } from "@/features/milestones/server/cache/milestones";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { runMutationCacheInvalidation } from "@/lib/data-cache";
import {
  areValidIds,
  getLocalDayBounds,
  getLocalMonthBounds,
  isValidDate,
} from "@/lib/utils";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { DayTasksSortByOption, TasksFilters } from "../lib/tasks-params";
import { revalidateTaskCache } from "./cache/tasks";
import { confirmUserMilestoneOwnership } from "@/features/milestones/server/milestones";
import {
  CalendarFilters,
  CalendarViewOption,
} from "@/features/calendar/lib/calendar-params";
import {
  taskPriorities,
  TaskPriority,
  taskStatuses,
  TaskStatus,
} from "@/db/schema";
import { BoardProperty, TaskBoardCursor } from "../lib/types";

type TaskBoardDbQuery = {
  property: BoardProperty;
  column: TaskStatus | TaskPriority;
  cursor?: TaskBoardCursor | null;
};

type ReadTasksDbFilters = Partial<TasksFilters> & {
  page?: number;
  unassignedOnly?: boolean;
  allTasks?: boolean;
  selectedDay?: CalendarFilters["day"];
  selectedMonth?: CalendarFilters["month"] | null;
  view?: CalendarFilters["view"] | null;
  projectIds?: string[];
  areaIds?: string[];
  userId?: string;
  timeZone?: string;
  board?: TaskBoardDbQuery;
  limit?: number;
};

export const confirmUserTaskOwnership = async (
  taskId: string,
  additionalFilters: SQL<unknown>[] = [],
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  const [existingTask] = await (tx ?? db)
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

export const readTasksDb = async (filterOptions: ReadTasksDbFilters) => {
  const {
    search,
    sortBy = "recently_created",
    priorities,
    statuses,
    dateTimeStartRange,
    dateTimeEndRange,
    page,
    unassignedOnly,
    allTasks,
    selectedDay,
    selectedMonth,
    view,
    projectIds,
    areaIds,
    userId,
    timeZone,
    limit = PAGE_SIZE,
    board,
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
    offset = (page - 1) * limit;
  }

  const normalizedSearch = search?.trim();

  const priorityRank = sql`
    CASE ${TaskTable.priority}
      WHEN 'urgent' THEN 1 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'high' THEN 2 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'medium' THEN 3 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      WHEN 'low' THEN 4 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
      ELSE 5
    END
  `;

  const searchFilter = normalizedSearch
    ? or(
        ilike(TaskTable.name, `%${normalizedSearch}%`),
        ilike(TaskTable.description, `%${normalizedSearch}%`),
        ilike(ProjectTable.name, `%${normalizedSearch}%`),
        ilike(MilestoneTable.name, `%${normalizedSearch}%`),
      )
    : undefined;

  const priorityFilter = priorities?.length
    ? inArray(TaskTable.priority, priorities)
    : undefined;

  const sortByMap: Record<DayTasksSortByOption, SQL<unknown>[]> = {
    name_a_z: [asc(sql`lower(${TaskTable.name})`), asc(TaskTable.id)],
    name_z_a: [desc(sql`lower(${TaskTable.name})`), desc(TaskTable.id)],
    oldest: [asc(TaskTable.createdAt), asc(TaskTable.id)],
    priority: [asc(priorityRank), asc(TaskTable.id)],
    recently_created: [desc(TaskTable.createdAt), desc(TaskTable.id)],
  };

  const statusFilter = statuses?.length
    ? inArray(TaskTable.status, statuses)
    : undefined;

  const validBoardColumn = board
    ? board.property === "status"
      ? taskStatuses.includes(board.column as TaskStatus)
      : taskPriorities.includes(board.column as TaskPriority)
    : true;

  if (!validBoardColumn) return null;

  const boardColumnFilter = board
    ? board.property === "status"
      ? eq(TaskTable.status, board.column as TaskStatus)
      : eq(TaskTable.priority, board.column as TaskPriority)
    : undefined;

  if (
    board?.cursor &&
    (!areValidIds(board.cursor.id) || !isValidDate(board.cursor.createdAt))
  )
    return null;

  const boardCursorFilter = board?.cursor
    ? or(
        lt(TaskTable.createdAt, board.cursor.createdAt),
        and(
          eq(TaskTable.createdAt, board.cursor.createdAt),
          lt(TaskTable.id, board.cursor.id),
        ),
      )
    : undefined;

  let existingProjects: ProjectSelectType[] = [];

  if (projectIds?.length) {
    if (!areValidIds(projectIds)) return null;

    const userProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userIdToUse),
      ),
    );

    existingProjects = userProjects.filter(
      (project): project is ProjectSelectType => Boolean(project),
    );

    if (existingProjects.length !== projectIds.length) return null;
  }

  const projectsFilter = existingProjects.length
    ? inArray(
        TaskTable.projectId,
        existingProjects.map((project) => project.id),
      )
    : undefined;

  let existingAreaIds: string[] = [];

  if (areaIds?.length) {
    if (!areValidIds(areaIds)) return null;

    const userAreas = await Promise.all(
      areaIds.map((areaId) => confirmUserAreaOwnership(areaId, userIdToUse)),
    );
    existingAreaIds = userAreas
      .filter((area): area is AreaSelectType => Boolean(area))
      .map((area) => area.id);

    if (existingAreaIds.length !== areaIds.length) return null;
  }

  const areasFilter = existingAreaIds.length
    ? inArray(ProjectTable.areaId, existingAreaIds)
    : undefined;

  const timeRangeFilter = and(
    dateTimeStartRange
      ? gte(TaskTable.scheduledAt, dateTimeStartRange)
      : undefined,
    dateTimeEndRange ? lte(TaskTable.scheduledAt, dateTimeEndRange) : undefined,
  );

  const scheduledFilter = (startUtc: Date, endUtc: Date) =>
    and(
      gte(TaskTable.scheduledAt, startUtc),
      lte(TaskTable.scheduledAt, endUtc),
    );
  const dueFilter = (startUtc: Date, endUtc: Date) =>
    and(gte(TaskTable.dueAt, startUtc), lte(TaskTable.dueAt, endUtc));

  const defaultScheduledDueFilter = (startUtc: Date, endUtc: Date) =>
    or(scheduledFilter(startUtc, endUtc), dueFilter(startUtc, endUtc));

  const viewMap: Record<
    CalendarViewOption,
    (startUtc: Date, endUtc: Date) => SQL<unknown> | undefined
  > = {
    all: defaultScheduledDueFilter,
    scheduled: (startUtc: Date, endUtc: Date) =>
      scheduledFilter(startUtc, endUtc),
    due: (startUtc: Date, endUtc: Date) => dueFilter(startUtc, endUtc),
  };

  let dayFilter;

  if (selectedDay && timeZone) {
    const { startUtc, endUtc } = getLocalDayBounds(selectedDay, timeZone);

    dayFilter = view
      ? viewMap[view](startUtc, endUtc)
      : defaultScheduledDueFilter(startUtc, endUtc);
  }

  let monthFilter;
  if (selectedMonth && timeZone) {
    const { startUtc, endUtc } = getLocalMonthBounds(selectedMonth, timeZone);

    monthFilter = view
      ? viewMap[view](startUtc, endUtc)
      : defaultScheduledDueFilter(startUtc, endUtc);
  }

  const milestoneFilter = unassignedOnly
    ? isNull(TaskTable.milestoneId)
    : undefined;

  const whereQuery = and(
    eq(TaskTable.userId, userIdToUse),
    dayFilter,
    monthFilter,
    searchFilter,
    priorityFilter,
    projectsFilter,
    statusFilter,
    timeRangeFilter,
    milestoneFilter,
    areasFilter,
    boardColumnFilter,
    boardCursorFilter,
  );

  let query = db
    .select({
      ...getTableColumns(TaskTable),
      project: getTableColumns(ProjectTable),
      milestone: getTableColumns(MilestoneTable),
    })
    .from(TaskTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, TaskTable.projectId))
    .leftJoin(MilestoneTable, eq(MilestoneTable.id, TaskTable.milestoneId))
    .where(whereQuery)
    .$dynamic();

  if (offset) {
    query = query.offset(offset);
  }
  if (board) {
    query = query
      .orderBy(desc(TaskTable.createdAt), desc(TaskTable.id))
      .$dynamic();
  } else if (sortBy) {
    query = query.orderBy(...sortByMap[sortBy]).$dynamic();
  }

  if (!allTasks) {
    query = query.limit(limit).$dynamic();
  }

  const tasks = await query;

  return {
    tasks,
    projects: existingProjects,
    dayFilter,
    whereQuery,
  };
};

export const insertTaskDb = async (
  taskData: TaskInsertType,
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
  try {
    const existingProject = taskData.projectId
      ? await confirmUserProjectOwnership(taskData.projectId, undefined, tx)
      : null;
    if (taskData.projectId && !existingProject)
      throw new Error("No existing project found.");

    const insertTask = async (pgtx: DbTransaction) => {
      const [insertedTask] = await pgtx
        .insert(TaskTable)
        .values(taskData)
        .returning();

      if (!insertedTask) throw new Error("Failed to insert task.");

      const insertedActivity = await insertActivityDb(
        {
          source,
          subject: "task",
          action: "create",
          subjectId: insertedTask.id,
          subjectLabel: insertedTask.name,
          projectId: insertedTask.projectId,
          message: `Created task "${insertedTask.name}"`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedTask;
    };

    const insertedTask = tx
      ? await insertTask(tx)
      : await db.transaction(insertTask);

    await runMutationCacheInvalidation(source === "ai", () => {
      revalidateTaskCache(
        insertedTask.userId,
        insertedTask.id,
        insertedTask.projectId,
        existingProject?.areaId,
      );
    });

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
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
  const existingTask = await confirmUserTaskOwnership(taskId, [], tx);
  if (!existingTask) return null;

  try {
    const oldProject = existingTask.projectId
      ? await confirmUserProjectOwnership(existingTask.projectId, undefined, tx)
      : null;

    const nextProjectId =
      taskData.projectId === undefined
        ? existingTask.projectId
        : taskData.projectId;

    const newProject = nextProjectId
      ? await confirmUserProjectOwnership(nextProjectId, undefined, tx)
      : null;

    if (nextProjectId && !newProject) throw new Error("Project not found.");

    const newMilestone = taskData.milestoneId
      ? await confirmUserMilestoneOwnership(
          taskData.milestoneId,
          undefined,
          undefined,
          tx,
        )
      : null;
    if (taskData.milestoneId && !newMilestone)
      throw new Error("Milestone not found.");

    const updateTask = async (pgtx: DbTransaction) => {
      const [updatedTask] = await pgtx
        .update(TaskTable)
        .set(taskData)
        .where(eq(TaskTable.id, existingTask.id))
        .returning();
      if (!updatedTask) throw new Error("Failed to update task.");

      const insertedActivity = await insertActivityDb(
        {
          source,
          subject: "task",
          action: "update",
          subjectId: updatedTask.id,
          subjectLabel: updatedTask.name,
          projectId: updatedTask.projectId,
          message: `Updated task "${updatedTask.name}"`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedTask;
    };

    const updatedTask = tx
      ? await updateTask(tx)
      : await db.transaction(updateTask);

    await runMutationCacheInvalidation(source === "ai", () => {
      revalidateTaskCache(updatedTask.userId, updatedTask.id);

      if (oldProject) {
        revalidateProjectCache(
          updatedTask.userId,
          oldProject.id,
          oldProject.areaId,
        );
      }

      if (newProject && newProject.id !== oldProject?.id) {
        revalidateProjectCache(
          updatedTask.userId,
          newProject.id,
          newProject.areaId,
        );
      }
      if (updatedTask?.projectId) {
        revalidateMilestoneCache(
          updatedTask.userId,
          updatedTask.projectId,
          newProject?.areaId,
        );
      }
    });

    return updatedTask;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteTaskDb = async (
  taskId: string,
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
  const existingTask = await confirmUserTaskOwnership(taskId, [], tx);
  if (!existingTask) return null;

  try {
    const existingProject = existingTask.projectId
      ? await confirmUserProjectOwnership(existingTask.projectId, undefined, tx)
      : null;
    if (existingTask.projectId && !existingProject)
      throw new Error("No existing project found.");

    const deleteTask = async (pgtx: DbTransaction) => {
      const [deletedTask] = await pgtx
        .delete(TaskTable)
        .where(eq(TaskTable.id, existingTask.id))
        .returning();
      if (!deletedTask) throw new Error("Failed to delete task.");

      const insertedActivity = await insertActivityDb(
        {
          source,
          subject: "task",
          action: "delete",
          subjectId: deletedTask.id,
          subjectLabel: deletedTask.name,
          projectId: deletedTask.projectId,
          message: `Deleted task "${deletedTask.name}"`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedTask;
    };

    const deletedTask = tx
      ? await deleteTask(tx)
      : await db.transaction(deleteTask);

    await runMutationCacheInvalidation(source === "ai", () => {
      revalidateTaskCache(
        deletedTask.userId,
        deletedTask.id,
        deletedTask.projectId,
        existingProject?.areaId,
      );
    });

    return deletedTask;
  } catch (error) {
    console.error(error);
    return null;
  }
};
