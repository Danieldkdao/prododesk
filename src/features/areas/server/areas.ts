import { db, DbTransaction } from "@/db/db";
import { AreaInsertType, AreaSelectType, AreaTable } from "@/db/schema";
import { revalidateAreaCache } from "./cache/areas";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq } from "drizzle-orm";
import { SQLMap } from "@/lib/types";

export const confirmUserAreaOwnership = async (areaId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingArea] = await db
    .select()
    .from(AreaTable)
    .where(and(eq(AreaTable.id, areaId), eq(AreaTable.userId, userId)));

  return existingArea ?? null;
};

export const insertAreaDb = async (
  areaData: SQLMap<AreaInsertType>,
  tx?: DbTransaction,
) => {
  const [insertedArea] = await (tx ?? db)
    .insert(AreaTable)
    .values(areaData)
    .returning();

  revalidateAreaCache(insertedArea.userId, insertedArea.id);

  return insertedArea;
};

export const updateAreaDb = async (
  areaId: string,
  areaData: SQLMap<
    Omit<Partial<AreaSelectType>, "id" | "createdAt" | "updatedAt" | "userId">
  >,
  tx?: DbTransaction,
) => {
  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  const [updatedArea] = await (tx ?? db)
    .update(AreaTable)
    .set(areaData)
    .where(
      and(
        eq(AreaTable.id, existingArea.id),
        eq(AreaTable.userId, existingArea.userId),
      ),
    )
    .returning();

  revalidateAreaCache(updatedArea.userId, updatedArea.id);

  return updatedArea;
};

export const deleteAreaDb = async (areaId: string, tx?: DbTransaction) => {
  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  const [deletedArea] = await (tx ?? db)
    .delete(AreaTable)
    .where(
      and(
        eq(AreaTable.id, existingArea.id),
        eq(AreaTable.userId, existingArea.userId),
      ),
    )
    .returning();

  revalidateAreaCache(deletedArea.userId, deletedArea.id);

  return deletedArea;
};
