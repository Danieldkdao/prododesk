import { db, DbTransaction } from "@/db/db";
import {
  DocumentInsertType,
  DocumentSelectType,
  DocumentTable,
} from "@/db/schema";
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
  const [insertedDocument] = await (tx ?? db)
    .insert(DocumentTable)
    .values(document)
    .returning();

  revalidateDocumentCache(insertedDocument.userId, insertedDocument.id);
  if (insertedDocument.projectId) {
    revalidateProjectCache(insertedDocument.userId, insertedDocument.projectId);
  }

  return insertedDocument;
};

export const updateDocumentDb = async (
  documentId: string,
  document: Pick<Partial<DocumentSelectType>, "name" | "content" | "projectId">,
  tx?: DbTransaction,
) => {
  const existingDocument = await confirmUserDocumentOwnership(documentId);
  if (!existingDocument) return null;

  const [updatedDocument] = await (tx ?? db)
    .update(DocumentTable)
    .set(document)
    .where(
      and(
        eq(DocumentTable.id, existingDocument.id),
        eq(DocumentTable.userId, existingDocument.userId),
      ),
    )
    .returning();

  revalidateDocumentCache(updatedDocument.userId, updatedDocument.id);
  if (updatedDocument.projectId) {
    revalidateProjectCache(updatedDocument.userId, updatedDocument.projectId);
  }

  return updatedDocument;
};

export const deleteDocumentDb = async (
  documentId: string,
  tx?: DbTransaction,
) => {
  const existingDocument = await confirmUserDocumentOwnership(documentId);
  if (!existingDocument) return null;

  const [deletedDocument] = await (tx ?? db)
    .delete(DocumentTable)
    .where(
      and(
        eq(DocumentTable.id, existingDocument.id),
        eq(DocumentTable.userId, existingDocument.userId),
      ),
    )
    .returning();

  revalidateDocumentCache(deletedDocument.userId, deletedDocument.id);
  if (deletedDocument.projectId) {
    revalidateDocumentCache(deletedDocument.id, deletedDocument.projectId);
  }

  return deletedDocument;
};
