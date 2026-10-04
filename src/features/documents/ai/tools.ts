import { DocumentAssetTable } from "@/db/schema";
import { deleteFilesFromStorage } from "@/features/uploads/lib/delete-files";
import { eq } from "drizzle-orm";
import { executeMutationToolDb } from "@/features/chats/server/tool-executions";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import { tool } from "ai";
import {
  createDocumentAction,
  deleteDocumentAction,
  readDocumentAction,
  updateDocumentAction,
} from "../actions/actions";
import { readDocumentsDb } from "../server/documents";
import {
  createDocumentToolSchema,
  deleteDocumentToolSchema,
  readDocumentsToolSchema,
  readDocumentToolSchema,
  updateDocumentToolSchema,
} from "./schemas";

const readDocumentsTool = tool({
  description: "Allows you to read the user's documents.",
  inputSchema: readDocumentsToolSchema,
  execute: async (filterOptions, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();

    const response = await readDocumentsDb(filterOptions);
    if (!response) throw new Error(GENERAL_ERROR_MESSAGE);

    return JSON.stringify(
      response.documents.map(
        ({ content: _content, project: _project, ...rest }) => rest,
      ),
    );
  },
});

const readDocumentTool = tool({
  description: "Allows you to read one of the user's documents.",
  inputSchema: readDocumentToolSchema,
  execute: async ({ documentId }, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();

    const document = await readDocumentAction(documentId);
    if (!document) throw new Error(NOT_FOUND_ERROR_MESSAGE);

    return JSON.stringify(document);
  },
});

const createDocumentTool = tool({
  description: "Allows you to create a document for the user.",
  inputSchema: createDocumentToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { name, content, projectId },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "createDocument" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await createDocumentAction(
          {
            name,
            content,
            projectId: projectId ?? undefined,
          },
          { source: "ai", chatRunId: context.runId, tx },
        );
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const updateDocumentTool = tool({
  description: "Allows you to update one of the user's documents.",
  inputSchema: updateDocumentToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { documentId, changes },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateDocument" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateDocumentAction(documentId, changes, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const deleteDocumentTool = tool({
  description: "Allows you to delete one of the current user's documents.",
  inputSchema: deleteDocumentToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ documentId }, { context, toolCallId, abortSignal }) => {
    let storageKeys: string[] = [];
    const output = await executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "deleteDocument" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const assets = await tx
          .select({ storageKey: DocumentAssetTable.storageKey })
          .from(DocumentAssetTable)
          .where(eq(DocumentAssetTable.documentId, documentId));
        storageKeys = assets.map((asset) => asset.storageKey);
        const response = await deleteDocumentAction(documentId, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
    if (storageKeys.length && !(await deleteFilesFromStorage(storageKeys))) {
      console.error("Failed to delete assets for document:", documentId);
    }
    return output;
  },
});

export const documentTools = {
  readDocuments: readDocumentsTool,
  readDocument: readDocumentTool,
  createDocument: createDocumentTool,
  updateDocument: updateDocumentTool,
  deleteDocument: deleteDocumentTool,
};
