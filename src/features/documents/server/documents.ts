import { db, DbTransaction } from "@/db/db";
import {
  DocumentInsertType,
  DocumentSelectType,
  DocumentTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq, SQL } from "drizzle-orm";
import { revalidateDocumentCache } from "./cache/documents";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";

export const confirmUserDocumentOwnership = async (
  documentId: string,
  additionalFilters?: SQL[],
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [existingDocument] = await db
    .select()
    .from(DocumentTable)
    .where(
      and(
        eq(DocumentTable.userId, userId),
        eq(DocumentTable.id, documentId),
        ...(additionalFilters ?? []),
      ),
    );

  return existingDocument ?? null;
};

export const insertDocumentDb = async (
  document: DocumentInsertType,
  tx?: DbTransaction,
) => {
  try {
    const existingProject = document.projectId
      ? await confirmUserProjectOwnership(document.projectId)
      : null;
    if (document.projectId && !existingProject)
      throw new Error("No existing project found.");

    const insertedDocument = await db.transaction(async (pgtx) => {
      const [insertedDocument] = await (tx ?? pgtx)
        .insert(DocumentTable)
        .values(document)
        .returning();

      if (!insertedDocument) throw new Error("Failed to insert document.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "document",
          action: "create",
          subjectId: insertedDocument.id,
          subjectLabel: insertedDocument.name,
          projectId: insertedDocument.projectId,
          message: `Created document "${insertedDocument.name}"`,
        },
        tx ?? pgtx,
      );

      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedDocument;
    });

    revalidateDocumentCache(
      insertedDocument.userId,
      insertedDocument.id,
      insertedDocument.projectId,
      existingProject?.areaId,
    );

    return insertedDocument;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateDocumentDb = async (
  documentId: string,
  document: Pick<Partial<DocumentSelectType>, "name" | "content" | "projectId">,
  tx?: DbTransaction,
) => {
  const existingDocument = await confirmUserDocumentOwnership(documentId);
  if (!existingDocument) return null;

  try {
    const oldDocument = existingDocument.projectId
      ? await confirmUserProjectOwnership(existingDocument.projectId)
      : null;

    const nextDocumentId =
      document.projectId === undefined
        ? existingDocument.projectId
        : document.projectId;

    const newDocument = nextDocumentId
      ? await confirmUserProjectOwnership(nextDocumentId)
      : null;

    const updatedDocument = await db.transaction(async (pgtx) => {
      const [updatedDocument] = await (tx ?? pgtx)
        .update(DocumentTable)
        .set(document)
        .where(
          and(
            eq(DocumentTable.id, existingDocument.id),
            eq(DocumentTable.userId, existingDocument.userId),
          ),
        )
        .returning();

      if (!updatedDocument) throw new Error("Failed to update document.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "document",
          action: "update",
          subjectLabel: updatedDocument.name,
          subjectId: updatedDocument.id,
          projectId: updatedDocument.projectId,
          message: `Updated document "${updatedDocument.name}"`,
        },
        tx ?? pgtx,
      );

      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedDocument;
    });

    revalidateDocumentCache(updatedDocument.userId, updatedDocument.id);

    if (oldDocument) {
      revalidateProjectCache(
        updatedDocument.userId,
        oldDocument.id,
        oldDocument.areaId,
      );
    }

    if (newDocument && newDocument.id !== oldDocument?.id) {
      revalidateProjectCache(
        updatedDocument.userId,
        newDocument.id,
        newDocument.areaId,
      );
    }

    return updatedDocument;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteDocumentDb = async (
  documentId: string,
  tx?: DbTransaction,
) => {
  const existingDocument = await confirmUserDocumentOwnership(documentId);
  if (!existingDocument) return null;

  try {
    const existingProject = existingDocument.projectId
      ? await confirmUserProjectOwnership(existingDocument.projectId)
      : null;
    if (existingDocument.projectId && !existingProject)
      throw new Error("No existing project found.");

    const deletedDocument = await db.transaction(async (pgtx) => {
      const [deletedDocument] = await (tx ?? pgtx)
        .delete(DocumentTable)
        .where(
          and(
            eq(DocumentTable.id, existingDocument.id),
            eq(DocumentTable.userId, existingDocument.userId),
          ),
        )
        .returning();
      if (!deletedDocument) throw new Error("Failed to delete document.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "document",
          action: "delete",
          subjectLabel: deletedDocument.name,
          subjectId: deletedDocument.id,
          projectId: deletedDocument.projectId,
          message: `Deleted document "${deletedDocument.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedDocument;
    });

    revalidateDocumentCache(
      deletedDocument.userId,
      deletedDocument.id,
      deletedDocument.projectId,
      existingProject?.areaId,
    );

    return deletedDocument;
  } catch (error) {
    console.error(error);
    return null;
  }
};
