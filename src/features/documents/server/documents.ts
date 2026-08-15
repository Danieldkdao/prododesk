import { db, DbTransaction } from "@/db/db";
import {
  AreaSelectType,
  DocumentInsertType,
  DocumentSelectType,
  DocumentTable,
  ProjectSelectType,
  ProjectTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { areValidIds } from "@/lib/utils";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  SQL,
} from "drizzle-orm";
import { DocumentsSortByOption } from "../lib/documents-params";
import { revalidateDocumentCache } from "./cache/documents";

export const confirmUserDocumentOwnership = async (
  documentId: string,
  userId?: string,
  additionalFilters?: SQL[],
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

  const [existingDocument] = await db
    .select()
    .from(DocumentTable)
    .where(
      and(
        eq(DocumentTable.userId, userIdToUse),
        eq(DocumentTable.id, documentId),
        ...(additionalFilters ?? []),
      ),
    );

  return existingDocument ?? null;
};

export const readDocumentsDb = async (filterOptions: {
  search?: string;
  sortBy?: DocumentsSortByOption;
  projectIds?: string[];
  areaIds?: string[];
  documentIds?: string[];
  page?: number;
  limit?: number;
  userId?: string;
}) => {
  const {
    search,
    sortBy,
    projectIds,
    areaIds,
    documentIds,
    page,
    limit = PAGE_SIZE,
    userId,
  } = filterOptions;
  let userIdToUse: string | null = null;
  if (userId) {
    userIdToUse = userId;
  } else {
    const { userId } = await getCurrentUser();
    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  let offset: number | null = null;
  if (page) {
    offset = (page - 1) * limit;
  }

  const sortByMap: Record<DocumentsSortByOption, SQL<unknown>> = {
    oldest: asc(DocumentTable.createdAt),
    recently_created: desc(DocumentTable.createdAt),
    recently_updated: desc(DocumentTable.updatedAt),
  };

  const searchTerm = `%${search?.trim()}%`;
  const searchQuery = or(
    ilike(DocumentTable.name, searchTerm),
    ilike(DocumentTable.content, searchTerm),
    ilike(ProjectTable.name, searchTerm),
  );

  let existingDocumentIds: string[] = [];
  if (documentIds?.length) {
    if (!areValidIds(documentIds)) return null;
    const existingDocuments = await Promise.all(
      documentIds.map((documentId) =>
        confirmUserDocumentOwnership(documentId, userIdToUse),
      ),
    );
    existingDocumentIds = existingDocuments
      .filter((document): document is DocumentSelectType => Boolean(document))
      .map((document) => document.id);
    if (existingDocumentIds.length !== documentIds.length) return null;
  }

  const documentsFilter = existingDocumentIds.length
    ? inArray(DocumentTable.id, existingDocumentIds)
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
    ? inArray(DocumentTable.projectId, existingProjectIds)
    : undefined;

  let existingAreaIds: string[] = [];
  if (areaIds?.length) {
    if (!areValidIds(areaIds)) return null;
    const existingAreas = await Promise.all(
      areaIds.map((areaId) => confirmUserAreaOwnership(areaId, userIdToUse)),
    );
    existingAreaIds = existingAreas
      .filter((area): area is AreaSelectType => Boolean(area))
      .map((area) => area.id);

    if (existingAreaIds.length !== areaIds.length) return null;
  }

  const areasFilter = existingAreaIds.length
    ? inArray(ProjectTable.areaId, existingAreaIds)
    : undefined;

  const whereQuery = and(
    eq(DocumentTable.userId, userIdToUse),
    projectsFilter,
    areasFilter,
    documentsFilter,
    searchQuery,
  );

  let query = db
    .select({
      ...getTableColumns(DocumentTable),
      project: getTableColumns(ProjectTable),
    })
    .from(DocumentTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, DocumentTable.projectId))
    .where(whereQuery)
    .$dynamic();

  if (sortBy) {
    query = query.orderBy(sortByMap[sortBy]).$dynamic();
  }
  if (offset) {
    query.offset(offset).$dynamic();
  }

  const documents = await query.limit(limit);

  return {
    documents,
    whereQuery,
  };
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
