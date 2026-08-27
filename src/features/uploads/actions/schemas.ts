import z from "zod";

const uploadContextSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("document-image"),
    documentId: z.uuid(),
  }),
  z.object({
    purpose: z.literal("profile-image"),
  }),
  z.object({
    purpose: z.literal("chat-attachment"),
    chatId: z.uuid().optional(),
  }),
]);
export type UploadContextSchemaType = z.infer<typeof uploadContextSchema>;

export type UploadPayloadPurposeType = UploadContextSchemaType["purpose"];

export type UploadContextFor<P extends UploadPayloadPurposeType> = Extract<
  UploadContextSchemaType,
  { purpose: P }
>;

export const uploadPayloadSchema = z
  .object({
    fileName: z.string().trim().min(1),
    fileType: z.string().trim().min(1),
    fileSize: z.number().positive(),
  })
  .and(uploadContextSchema);
export type UploadPayloadSchemaType = z.infer<typeof uploadPayloadSchema>;

export const deleteUploadRequestSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("upload-intent"),
    uploadId: z.uuid(),
  }),
]);
export type DeleteUploadRequestSchemaType = z.infer<
  typeof deleteUploadRequestSchema
>;
export type DeleteUploadRequestPurposeType =
  DeleteUploadRequestSchemaType["purpose"];

export type DeleteUploadRequestFor<P extends DeleteUploadRequestPurposeType> =
  Extract<DeleteUploadRequestSchemaType, { purpose: P }>;
