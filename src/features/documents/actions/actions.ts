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
