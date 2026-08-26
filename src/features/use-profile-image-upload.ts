import { generateFileUrl } from "@/lib/utils";
import {
  createFileKey,
  fetchUploadPresignedUrl,
  uploadFileWithProgress,
  validateFile as validateFileHelper,
} from "@/services/tigris/helpers";
import { ChangeEvent, useCallback, useRef, useState } from "react";

export const useProfileImageUpload = ({
  accept = "*",
  keyPrefix,
  maxFileSizeBytes = 5 * 1024 * 1024,
}: {
  accept?: string;
  keyPrefix: string;
  maxFileSizeBytes?: number;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

      if (!validateFile(file)) return;

      const previewUrl = URL.createObjectURL(file);

      setCurrentFile({ file, previewUrl });
    },
    [validateFile],
  );

  const handleFileUpload = useCallback(async () => {
    if (!currentFile) return;

    const { file } = currentFile;

    if (!validateFile(file)) return null;

    try {
      const key = await createFileKey(file, keyPrefix);
      if (!key) throw new Error("Failed to create file key.");

      const url = await fetchUploadPresignedUrl(key);
      if (!url) throw new Error("Failed to fetch upload URL.");

      await uploadFileWithProgress(url, file, setUploadProgress);

      setError(null);

      return key;
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : "Failed to uplaod file. Please try again.";
      setError(errorMessage);

      return null;
    }
  }, [currentFile, validateFile, keyPrefix]);

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
