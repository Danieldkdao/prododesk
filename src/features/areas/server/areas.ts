import { db } from "@/db/db";
import {
  AreaInsertType,
  AreaSelectType,
  AreaTable,
  ProjectTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { SQLMap } from "@/lib/types";
import { and, eq } from "drizzle-orm";
import { revalidateAreaCache } from "./cache/areas";

export const confirmUserAreaOwnership = async (
  areaId: string,
  existingUserId?: string,
) => {
  let userIdToUse: string | null | undefined = null;
  if (existingUserId) {
    userIdToUse = existingUserId;
  } else {
    const { userId } = await getCurrentUser();
    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  const [existingArea] = await db
    .select()
    .from(AreaTable)
    .where(and(eq(AreaTable.id, areaId), eq(AreaTable.userId, userIdToUse)));

  return existingArea ?? null;
};

const revalidateAreaProjectsCache = async (areaId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  const existingAreaProjects = await db.query.ProjectTable.findMany({
    where: and(
      eq(ProjectTable.userId, userId),
      eq(ProjectTable.areaId, areaId),
    ),
  });

  if (existingAreaProjects.length) {
    existingAreaProjects.forEach((project) => {
      revalidateProjectCache(project.userId, project.id, project.areaId);
    });
  }
};

export const insertAreaDb = async (areaData: SQLMap<AreaInsertType>) => {
  try {
    const insertedArea = await db.transaction(async (tx) => {
      const [insertedArea] = await tx
        .insert(AreaTable)
        .values(areaData)
        .returning();
      if (!insertedArea) throw new Error("Failed to insert area.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "create",
          subject: "area",
          subjectLabel: insertedArea.name,
          subjectId: insertedArea.id,
          areaId: insertedArea.id,
          message: `Started area "${insertedArea.name}"`,
        },
        tx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedArea;
    });

    revalidateAreaProjectsCache(insertedArea.id);
    revalidateAreaCache(insertedArea.userId, insertedArea.id);

    return insertedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateAreaDb = async (
  areaId: string,
  areaData: SQLMap<
    Omit<Partial<AreaSelectType>, "id" | "createdAt" | "updatedAt" | "userId">
  >,
) => {
  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  try {
    const updatedArea = await db.transaction(async (tx) => {
      const [updatedArea] = await tx
        .update(AreaTable)
        .set(areaData)
        .where(
          and(
            eq(AreaTable.id, existingArea.id),
            eq(AreaTable.userId, existingArea.userId),
          ),
        )
        .returning();
      if (!updatedArea) throw new Error("Failed to update area.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "update",
          subject: "area",
          subjectLabel: updatedArea.name,
          subjectId: updatedArea.id,
          areaId: updatedArea.id,
          message: `Updated area "${updatedArea.name}"`,
        },
        tx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedArea;
    });

    revalidateAreaProjectsCache(updatedArea.id);
    revalidateAreaCache(updatedArea.userId, updatedArea.id);

    return updatedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteAreaDb = async (areaId: string) => {
  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  try {
    const deletedArea = await db.transaction(async (tx) => {
      const [deletedArea] = await tx
        .delete(AreaTable)
        .where(
          and(
            eq(AreaTable.id, existingArea.id),
            eq(AreaTable.userId, existingArea.userId),
          ),
        )
        .returning();
      if (!deletedArea) throw new Error("Failed to delete area.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "delete",
          subject: "area",
          subjectLabel: deletedArea.name,
          subjectId: deletedArea.id,
          areaId: deletedArea.id,
          message: `Deleted area "${deletedArea.name}"`,
        },
        tx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedArea;
    });

    revalidateAreaProjectsCache(deletedArea.id);
    revalidateAreaCache(deletedArea.userId, deletedArea.id);

    return deletedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};
