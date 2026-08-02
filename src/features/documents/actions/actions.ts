"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { documentSchema, DocumentSchemaType } from "./schemas";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  confirmUserDocumentOwnership,
  deleteDocumentDb,
  insertDocumentDb,
  updateDocumentDb,
} from "../server/documents";
import { areValidIds } from "@/lib/utils";
import { cacheTag } from "next/cache";
import {
  getDocumentIdTag,
  getUserDocumentTag,
} from "../server/cache/documents";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { DocumentTable, ProjectSelectType, ProjectTable } from "@/db/schema";
import { and, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { UnwrapAsync } from "@/lib/types";

export const readCachedDocumentsAction = async (
  userId: string,
  projectIds?: string[],
) => {
  "use cache";
  cacheTag(getUserDocumentTag(userId));

  let existingProjectIds: string[] | undefined = undefined;
  if (projectIds?.length) {
    const existingProjects = await Promise.all(
      projectIds.map((projectId) => confirmUserProjectOwnership(projectId)),
    );
    if (
      !existingProjects.every((project): project is ProjectSelectType =>
        Boolean(project),
      )
    )
      return null;

    existingProjectIds = existingProjects.map((project) => project.id);
  }

  const projectsFilter = existingProjectIds?.length
    ? inArray(DocumentTable.projectId, existingProjectIds)
    : undefined;
  const whereQuery = and(eq(DocumentTable.userId, userId), projectsFilter);

  const documents = await db
    .select({
      ...getTableColumns(DocumentTable),
      project: getTableColumns(ProjectTable),
    })
    .from(DocumentTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, DocumentTable.projectId))
    .where(whereQuery)
    .orderBy(desc(DocumentTable.createdAt));

  return documents;
};
export const readDocumentsAction = async (projectIds?: string[]) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedDocumentsAction(userId, projectIds);
};
export type ReadDocumentsActionReturnType = UnwrapAsync<
  typeof readDocumentsAction
>;

export const readCachedDocumentAction = async (
  userId: string,
  documentId: string,
) => {
  "use cache";
  cacheTag(getDocumentIdTag(documentId));

  return (
    db.query.DocumentTable.findFirst({
      where: and(
        eq(DocumentTable.id, documentId),
        eq(DocumentTable.userId, userId),
      ),
      with: {
        project: true,
      },
    }) ?? null
  );
};
export const readDocumentAction = async (documentId: string) => {
  if (!areValidIds(documentId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedDocumentAction(userId, documentId);
};
export type ReadDocumentActionReturnType = UnwrapAsync<
  typeof readDocumentAction
>;

export const createDocumentAction = async (unsafeData?: DocumentSchemaType) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const defaultInsertData = {
    name: "Untitled",
  };
  let insertData;

  if (unsafeData) {
    const { success, data } = documentSchema.safeParse(unsafeData);
    if (!success) {
      return {
        error: true,
        message: INVALID_DATA_ERROR_MESSAGE,
      };
    }

    insertData = data;
  }

  try {
    const createdDocument = await insertDocumentDb({
      ...defaultInsertData,
      ...(insertData ?? {}),
      userId,
    });
    if (!createdDocument) throw new Error("Failed to create document.");

    return {
      error: false,
      message: "Document created successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateDocumentAction = async (
  documentId: string,
  unsafeData: DocumentSchemaType,
) => {
  if (!areValidIds(documentId)) {
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

  const existingDocument = await confirmUserDocumentOwnership(documentId);
  if (!existingDocument) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { success, data } = documentSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedDocument = await updateDocumentDb(documentId, data);
    if (!updatedDocument) throw new Error("Failed to update document.");

    return {
      error: false,
      message: "Document updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteDocumentAction = async (documentId: string) => {
  if (!areValidIds(documentId)) {
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

  const existingDocument = await confirmUserDocumentOwnership(documentId);
  if (!existingDocument) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedDocument = await deleteDocumentDb(documentId);
    if (!deletedDocument) throw new Error("Failed to delete document.");

    return {
      error: false,
      message: "Document deleted successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
