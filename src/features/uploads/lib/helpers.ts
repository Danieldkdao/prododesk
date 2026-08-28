import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import { ApiResponse } from "@/lib/types";
import { isError } from "@/lib/utils";
import {
  DeleteUploadRequestFor,
  DeleteUploadRequestPurposeType,
  UploadContextFor,
  UploadPayloadPurposeType,
} from "../actions/schemas";
import { CreateUploadResponse } from "./types";

export const fetchUploadPresignedUrl = async <
  P extends UploadPayloadPurposeType,
>(
  file: File | { name: string; type: string; size: number },
  context: UploadContextFor<P>,
) => {
  const response = await fetch("/api/s3/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      ...context,
    }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as ApiResponse<
    Extract<CreateUploadResponse, { purpose: P }>
  >;
  if (data.error) return null;

  return data.data;
};

export const uploadFileWithProgress = (
  url: string,
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const handleSignalAbort = () => {
      xhr.abort();
    };

    const cleanup = () => {
      signal?.removeEventListener("abort", handleSignalAbort);
    };

    const resolveOnce = () => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve();
    };

    const rejectOnce = (error: Error) => {
      if (settled) return;

      settled = true;
      cleanup();
      reject(error);
    };

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        onProgress(100);
        resolveOnce();
        return;
      }

      rejectOnce(new Error(`Upload failed with status: ${xhr.status}`));
    };

    xhr.onerror = () => {
      rejectOnce(new Error("Upload failed"));
    };

    xhr.onabort = () => {
      rejectOnce(
        isError(signal?.reason)
          ? signal.reason
          : new DOMException("Upload aborted", "AbortError"),
      );
    };

    if (signal?.aborted) {
      rejectOnce(
        isError(signal?.reason)
          ? signal.reason
          : new DOMException("Upload aborted", "AbortError"),
      );
    }

    signal?.addEventListener("abort", handleSignalAbort, { once: true });

    xhr.open("PUT", url);

    if (file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    xhr.send(file);
  });
};

export const validateFile = (
  file: File | { size: number; type: string; name: string },
  config: { accept: string; maxFileSizeBytes: number },
): { isValid: true; reason: null } | { isValid: false; reason: string } => {
  const { accept, maxFileSizeBytes } = config;

  if (file.size > maxFileSizeBytes) {
    return {
      isValid: false,
      reason: `File size exceeds the limit of ${maxFileSizeBytes / (1024 * 1024)} MB`,
    };
  }

  if (accept !== "*") {
    const allowedTypes = accept
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);
    const isFileValidType = allowedTypes.some(
      (type) =>
        file.type === type ||
        (type.endsWith("/*") &&
          file.type.startsWith(type.replace("/*", "/"))) ||
        file.name.toLowerCase().endsWith(type.toLowerCase()),
    );
    if (!isFileValidType) {
      return {
        isValid: false,
        reason: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
      };
    }
  }

  return {
    isValid: true,
    reason: null,
  };
};

export const deleteFileClient = async <
  P extends DeleteUploadRequestPurposeType,
>(
  request: DeleteUploadRequestFor<P>,
) => {
  try {
    const presignedResponse = await fetch("/api/s3/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    const presignedPayload = (await presignedResponse.json()) as ApiResponse<{
      url: string;
    }>;

    if (!presignedResponse.ok || presignedPayload.error)
      throw new Error(presignedPayload.message || "Failed to get delete URL.");

    const presignedUrl = presignedPayload.data.url;
    if (!presignedUrl) throw new Error("Delete URL is missing.");

    const deleteResponse = await fetch(presignedUrl, { method: "DELETE" });
    if (!deleteResponse.ok)
      throw new Error("Failed to delete file from storage.");

    return {
      error: false,
      message: "File deleted successfully.",
    };
  } catch (error) {
    console.error(error);
    const errorMessage = isError(error) ? error.message : GENERAL_ERROR_MESSAGE;
    return {
      error: true,
      message: errorMessage,
    };
  }
};
