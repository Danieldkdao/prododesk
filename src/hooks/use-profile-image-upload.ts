import {
  fetchUploadPresignedUrl,
  uploadFileWithProgress,
  validateFile as validateFileHelper,
} from "@/features/uploads/lib/helpers";
import { isError } from "@/lib/utils";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

export const useProfileImageUpload = ({
  accept = "*",
  maxFileSizeBytes = 5 * 1024 * 1024,
}: {
  accept?: string;
  maxFileSizeBytes?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previewUrl = currentFile?.previewUrl;
    if (!previewUrl) return;

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [currentFile?.previewUrl]);

  const validateFile = useCallback(
    (file: File) => {
      const { isValid, reason } = validateFileHelper(file, {
        accept,
        maxFileSizeBytes,
      });

      if (!isValid) setError(reason);

      return isValid;
    },
    [accept, maxFileSizeBytes],
  );

  const handleFilePreview = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      if (!validateFile(file)) return false;

      const previewUrl = URL.createObjectURL(file);

      setCurrentFile({ file, previewUrl });

      return true;
    },
    [validateFile],
  );

  const handleFileUpload = useCallback(async () => {
    if (!currentFile) return;

    const { file } = currentFile;

    if (!validateFile(file)) return null;

    try {
      const data = await fetchUploadPresignedUrl(file, {
        purpose: "profile-image",
      });
      if (!data || !data.uploadUrl || !data.uploadId)
        throw new Error("Failed to fetch upload URL.");

      await uploadFileWithProgress(data.uploadUrl, file, setUploadProgress);

      setError(null);

      return data.uploadId;
    } catch (error) {
      console.error(error);
      const errorMessage = isError(error)
        ? error.message
        : "Failed to upload file. Please try again.";
      setError(errorMessage);

      return null;
    }
  }, [currentFile, validateFile]);

  const reset = useCallback(() => {
    setCurrentFile(null);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    inputRef,
    currentFile,
    uploadProgress,
    error,
    handleFilePreview,
    handleFileUpload,
    reset,
  };
};
