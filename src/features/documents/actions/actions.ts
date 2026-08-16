"use server";

import { ActivityMutationOptions, db } from "@/db/db";
import { DocumentTable, ProjectTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { and, count, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { DocumentsSortByOption } from "../lib/documents-params";
import {
  getDocumentIdTag,
  getUserDocumentTag,
} from "../server/cache/documents";
import {
  confirmUserDocumentOwnership,
  deleteDocumentDb,
  insertDocumentDb,
  readDocumentsDb,
  updateDocumentDb,
} from "../server/documents";
import { documentSchema, DocumentSchemaType } from "./schemas";

const readCachedDocumentsAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: DocumentsSortByOption;
    projectIds?: string[];
    areaIds?: string[];
    page: number;
  },
) => {
  "use cache";
  cacheTag(getUserDocumentTag(userId));

  const page = filterOptions.page;

  const response = await readDocumentsDb({ ...filterOptions, userId });
  if (!response) return null;

  const { documents, whereQuery } = response;

  const [totalDocuments] = await db
    .select({ count: count() })
    .from(DocumentTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, DocumentTable.projectId))
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalDocuments.count;
  const clientKey = JSON.stringify({
    context: {
      filters: filterOptions,
      results: documents.map(({ id, updatedAt }) => ({ id, updatedAt })),
      hasNextPage,
    },
  });

  return {
    metadata: {
      hasPrevPage,
      hasNextPage,
      clientKey,
    },
    documents,
  };
};
export const readDocumentsAction = async (filterOptions: {
  search: string;
  sortBy: DocumentsSortByOption;
  projectIds?: string[];
  areaIds?: string[];
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedDocumentsAction(userId, filterOptions);
};
export type ReadDocumentsActionReturnType = UnwrapAsync<
  typeof readDocumentsAction
>;

const readCachedDocumentAction = async (userId: string, documentId: string) => {
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

export const createDocumentAction = async (
  unsafeData?: DocumentSchemaType,
  options?: ActivityMutationOptions,
) => {
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
    const createdDocument = await insertDocumentDb(
      {
        ...defaultInsertData,
        ...(insertData ?? {}),
        userId,
      },
      options,
    );
    if (!createdDocument) throw new Error("Failed to create document.");

    return {
      error: false,
      message: "Document created successfully!",
      documentId: createdDocument.id,
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
  unsafeData: Partial<DocumentSchemaType>,
  options?: ActivityMutationOptions,
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

  const { success, data } = documentSchema.partial().safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedDocument = await updateDocumentDb(documentId, data, options);
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

export const deleteDocumentAction = async (
  documentId: string,
  options?: ActivityMutationOptions,
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

  try {
    const deletedDocument = await deleteDocumentDb(documentId, options);
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
