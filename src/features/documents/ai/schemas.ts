import z from "zod";
import { documentsSortByOptions } from "../lib/documents-params";
import { approvalReasonSchema } from "@/services/ai/tools/helpers";

export const readDocumentsToolSchema = z.object({
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe(
      "A search query that allows you to search by document name or content.",
    ),
  documentIds: z
    .array(z.uuid())
    .default([])
    .describe("Narrow the search to an array of document IDs."),
  projectIds: z
    .array(z.uuid())
    .default([])
    .describe("Narrow the search down to an array of project IDs."),
  areaIds: z
    .array(z.uuid())
    .default([])
    .describe("Narrow the search down to an array of area IDs."),
  sortBy: z
    .enum(documentsSortByOptions)
    .default("recently_created")
    .describe("Sort the results."),
  limit: z
    .number()
    .int()
    .positive()
    .min(1)
    .max(100)
    .default(25)
    .describe("Limit the number of results to return."),
});

export const readDocumentToolSchema = z.object({
  documentId: z.uuid().describe("The ID of the document to read."),
});

export const createDocumentToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(200)
    .default("Untitled")
    .describe("The document name."),
  content: z
    .string()
    .default("")
    .describe("The document content, in markdown language."),
  projectId: z.uuid().nullish().describe("The ID of the associated project."),
  approvalReason: approvalReasonSchema,
});

export const updateDocumentToolSchema = z.object({
  documentId: z.uuid().describe("The ID of the document to update."),
  changes: z
    .object({
      name: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .optional()
        .describe("The document name."),
      content: z.string().optional().describe("The document content."),
      projectId: z.uuid().nullish(),
    })
    .refine((changes) => Object.keys(changes).length > 0)
    .describe("The changes you want to make, must make at least one change."),
  approvalReason: approvalReasonSchema,
});

export const deleteDocumentToolSchema = z.object({
  documentId: z.uuid().describe("The ID of the document to delete."),
  approvalReason: approvalReasonSchema,
});
