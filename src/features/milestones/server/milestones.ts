import { db, DbTransaction } from "@/db/db";
import {
  MilestoneInsertType,
  MilestoneSelectType,
  MilestoneStatus,
  MilestoneTable,
  ProjectSelectType,
  ProjectTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { SQLMap } from "@/lib/types";
import { and, asc, eq, gte, ilike, inArray, lte, or, SQL } from "drizzle-orm";
import { revalidateMilestoneCache } from "./cache/milestones";
import { PAGE_SIZE } from "@/lib/constants";
import { format } from "date-fns";
import { areValidIds } from "@/lib/utils";

export const confirmUserMilestoneOwnership = async (
  milestoneId: string,
  userId?: string,
  additionalFilters?: SQL<unknown>[],
) => {
  let userIdToUse: string | null = null;
  if (userId) {
    userIdToUse = userId;
  } else {
    const { userId } = await getCurrentUser();
    if (!userId) return null;
    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  return (
    db.query.MilestoneTable.findFirst({
      where: and(
        eq(MilestoneTable.id, milestoneId),
        eq(MilestoneTable.userId, userIdToUse),
        ...(additionalFilters || []),
      ),
    }) ?? null
  );
};

export const readMilestonesDb = async (filterOptions: {
  projectIds?: string[];
  milestoneIds?: string[];
  search?: string;
  statuses?: MilestoneStatus[];
  dueAtOnAfter?: Date | null;
  dueAtOnBefore?: Date | null;
  userId?: string;
  limit?: number;
  page?: number;
}) => {
  const {
    projectIds,
    milestoneIds,
    search,
    statuses,
    dueAtOnAfter,
    dueAtOnBefore,
    userId,
    limit = PAGE_SIZE,
    page,
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

  const searchTerm = `%${search?.trim()}%`;
  const searchFilter = search?.trim()
    ? or(
        ilike(MilestoneTable.name, searchTerm),
        ilike(MilestoneTable.description, searchTerm),
      )
    : undefined;

  const statusesFilter = statuses?.length
    ? inArray(MilestoneTable.status, statuses)
    : undefined;

  const dueAtFilter = and(
    dueAtOnAfter
      ? gte(MilestoneTable.dueAt, format(dueAtOnAfter, "yyyy-MM-dd"))
      : undefined,
    dueAtOnBefore
      ? lte(MilestoneTable.dueAt, format(dueAtOnBefore, "yyyy-MM-dd"))
      : undefined,
  );

  let existingMilestoneIds: string[] = [];
  if (milestoneIds?.length) {
    if (!areValidIds(milestoneIds)) return null;

    const existingMilestones = await Promise.all(
      milestoneIds.map((milestoneId) =>
        confirmUserMilestoneOwnership(milestoneId, userIdToUse),
      ),
    );
    existingMilestoneIds = existingMilestones
      .filter((milestone): milestone is MilestoneSelectType =>
        Boolean(milestone),
      )
      .map((milestone) => milestone.id);
    if (existingMilestoneIds.length !== milestoneIds.length) return null;
  }

  const milestonesFilter = existingMilestoneIds.length
    ? inArray(MilestoneTable.id, existingMilestoneIds)
    : undefined;

  let existingProjectIds: string[] = [];
  if (projectIds?.length) {
    if (!areValidIds(projectIds)) return null;

    const existingProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userIdToUse),
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

  const whereQuery = and(
    eq(MilestoneTable.userId, userIdToUse),
    milestonesFilter,
    projectsFilter,
    searchFilter,
    statusesFilter,
    dueAtFilter,
  );

  const milestones = await db.query.MilestoneTable.findMany({
    where: whereQuery,
    orderBy: asc(MilestoneTable.position),
    with: {
      tasks: {
        with: {
          project: true,
        },
      },
    },
    offset: offset ?? undefined,
    limit,
  });

  return {
    milestones,
    whereQuery,
  };
};

export const insertMilestoneDb = async (
  milestone: SQLMap<MilestoneInsertType>,
  tx?: DbTransaction,
) => {
  try {
    const existingProject =
      milestone.projectId && typeof milestone.projectId === "string"
        ? await confirmUserProjectOwnership(milestone.projectId)
        : null;
    if (milestone.projectId && !existingProject)
      throw new Error("No existing project found.");

    const insertedMilestone = await db.transaction(async (pgtx) => {
      const [insertedMilestone] = await (tx ?? pgtx)
        .insert(MilestoneTable)
        .values(milestone)
        .returning();
      if (!insertedMilestone) throw new Error("Failed to insert milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "milestone",
          action: "create",
          subjectId: insertedMilestone.id,
          subjectLabel: insertedMilestone.name,
          projectId: insertedMilestone.projectId,
          message: `Created milestone ${milestone.name}`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedMilestone;
    });

    revalidateMilestoneCache(
      insertedMilestone.userId,
      insertedMilestone.projectId,
      existingProject?.areaId,
    );

    return insertedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateMilestoneDb = async (
  milestoneId: string,
  milestone: Omit<
    Partial<MilestoneSelectType>,
    "id" | "userId" | "projectId" | "createdAt" | "updatedAt"
  >,
  tx?: DbTransaction,
) => {
  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) return null;

  const existingProject = existingMilestone.projectId
    ? await confirmUserProjectOwnership(existingMilestone.projectId)
    : null;
  if (existingMilestone.projectId && !existingProject) return null;

  try {
    const updatedMilestone = await db.transaction(async (pgtx) => {
      const [updatedMilestone] = await (tx ?? pgtx)
        .update(MilestoneTable)
        .set(milestone)
        .where(
          and(
            eq(MilestoneTable.id, existingMilestone.id),
            eq(MilestoneTable.userId, existingMilestone.userId),
          ),
        )
        .returning();
      if (!updatedMilestone) throw new Error("Failed to update milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "milestone",
          action: "update",
          subjectId: updatedMilestone.id,
          subjectLabel: updatedMilestone.name,
          projectId: updatedMilestone.projectId,
          message: `Updated milestone "${updatedMilestone.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedMilestone;
    });

    revalidateMilestoneCache(
      updatedMilestone.userId,
      updatedMilestone.projectId,
      existingProject?.areaId,
    );

    return updatedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteMilestoneDb = async (
  milestoneId: string,
  tx?: DbTransaction,
) => {
  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) return null;

  const existingProject = existingMilestone.projectId
    ? await confirmUserProjectOwnership(existingMilestone.projectId)
    : null;
  if (existingMilestone.projectId && !existingProject) return null;

  try {
    const deletedMilestone = await db.transaction(async (pgtx) => {
      const [deletedMilestone] = await (tx ?? pgtx)
        .delete(MilestoneTable)
        .where(
          and(
            eq(MilestoneTable.id, existingMilestone.id),
            eq(MilestoneTable.userId, existingMilestone.userId),
          ),
        )
        .returning();
      if (!deletedMilestone) throw new Error("Failed to delete milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "milestone",
          action: "delete",
          subjectId: deletedMilestone.id,
          subjectLabel: deletedMilestone.name,
          projectId: deletedMilestone.projectId,
          message: `Deleted milestone "${deletedMilestone.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedMilestone;
    });

    revalidateMilestoneCache(
      deletedMilestone.userId,
      deletedMilestone.projectId,
      existingProject?.areaId,
    );

    return deletedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};
