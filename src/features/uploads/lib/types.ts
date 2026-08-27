import { DocumentAssetInsertType, UploadIntentInsertType } from "@/db/schema";

export type UploadRecordData =
  | { purpose: "document-image"; documentAsset: DocumentAssetInsertType }
  | { purpose: "chat-attachment"; uploadIntent: UploadIntentInsertType }
  | {
      purpose: "profile-image";
      uploadIntent: UploadIntentInsertType;
    };

export type UploadRecordOutput =
  | { purpose: "document-image"; assetId: string }
  | { purpose: "chat-attachment"; uploadId: string }
  | { purpose: "profile-image"; uploadId: string };

export type CreateUploadResponse =
  | {
      purpose: "document-image";
      uploadUrl: string;
      assetId: string;
      publicUrl: string;
    }
  | {
      purpose: "chat-attachment";
      uploadUrl: string;
      publicUrl: string;
      uploadId: string;
    }
  | {
      purpose: "profile-image";
      uploadUrl: string;
      uploadId: string;
    };
