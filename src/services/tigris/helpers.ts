import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import { ApiResponse } from "@/lib/types";

export const createFileKey = async (file: File, keyPrefix: string) => {
  const safeFileName = file.name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  const response = await fetch("/api/s3/generate-key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: safeFileName,
      keyPrefix,
    }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as ApiResponse<{ key: string }>;
  if (data.error) return null;

  return data.data.key;
};

export const fetchUploadPresignedUrl = async (key: string) => {
  const response = await fetch("/api/s3/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as ApiResponse<{ url: string }>;
  if (data.error) return null;

  return data.data.url;
};

export const uploadFileWithProgress = (
  url: string,
  file: File,
  onProgress: (progress: number) => void,
) => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status: ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed"));
    };

    xhr.open("PUT", url);

    if (file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    xhr.send(file);
  });
};

export const validateFile = (
  file: File,
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

export const deleteFileClient = async (key: string) => {
  try {
    const presignedResponse = await fetch("/api/s3/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
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
    const errorMessage = Error.isError(error)
      ? error.message
      : GENERAL_ERROR_MESSAGE;
    return {
      error: true,
      message: errorMessage,
    };
  }
};
