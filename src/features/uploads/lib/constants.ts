import { MAX_FILE_SIZE } from "@/components/tiptap/lib/tiptap-utils";
import { UploadPayloadPurposeType } from "../actions/schemas";

export const UPLOAD_LIMITS: Record<
  UploadPayloadPurposeType,
  { accept: string; maxSize: number }
> = {
  "document-image": {
    accept: "image/*",
    maxSize: MAX_FILE_SIZE,
  },
  "chat-attachment": {
    accept: "image/jpeg, image/png, application/pdf, .jpg, .jpeg",
    maxSize: MAX_FILE_SIZE,
  },
  "profile-image": {
    accept: "image/*",
    maxSize: MAX_FILE_SIZE,
  },
};
