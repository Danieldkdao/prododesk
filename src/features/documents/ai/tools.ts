import { tool } from "ai";
import {
  createDocumentToolSchema,
  deleteDocumentToolSchema,
  readDocumentsToolSchema,
  readDocumentToolSchema,
  updateDocumentToolSchema,
} from "./schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { readDocumentsDb } from "../server/documents";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import {
  createDocumentAction,
  deleteDocumentAction,
  readDocumentAction,
  updateDocumentAction,
} from "../actions/actions";
import {
  findToolExecutionDb,
  updateToolExecutionDb,
  upsertToolExecutionDb,
} from "@/features/chats/server/tool-executions";

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
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "createDocument",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await createDocumentAction(
        {
          name,
          content,
          projectId: projectId ?? undefined,
        },
        { source: "ai", chatRunId: context.runId },
      );

      const isSuccess = !response.error;
      const output = response.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "createDocument",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
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
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateDocument",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await updateDocumentAction(
        documentId,
        {
          ...changes,
          projectId: changes.projectId ?? undefined,
        },
        { source: "ai", chatRunId: context.runId },
      );

      const isSuccess = !response.error;
      const output = response.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateDocument",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const deleteDocumentTool = tool({
  description: "Allows you to delete one of the current user's documents.",
  inputSchema: deleteDocumentToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ documentId }, { context, toolCallId, abortSignal }) => {
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "deleteDocument",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await deleteDocumentAction(documentId, {
        source: "ai",
        chatRunId: context.runId,
      });

      const isSuccess = !response.error;
      const output = response.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "deleteDocument",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

export const documentTools = {
  readDocuments: readDocumentsTool,
  readDocument: readDocumentTool,
  createDocument: createDocumentTool,
  updateDocument: updateDocumentTool,
  deleteDocument: deleteDocumentTool,
};
