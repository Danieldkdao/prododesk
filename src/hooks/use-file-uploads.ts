import { generateFileUrl } from "@/lib/utils";
import {
  createFileKey,
  deleteFileClient,
  fetchUploadPresignedUrl,
  uploadFileWithProgress,
  validateFile,
} from "@/services/tigris/helpers";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

export type CustomFile = {
  url: string | null;
  name: string;
  type: string;
  key?: string;
};

export const useFileUploads = (props: {
  accept?: string;
  keyPrefix: string;
  uploadMessage?: string;
  maxFileLimit?: number;
  maxFileSizeBytes?: number;
  defaultFiles?: Map<string, { name: string; type: string }>;
}) => {
  const {
    accept = "*",
    keyPrefix,
    maxFileLimit = 1,
    defaultFiles,
    maxFileSizeBytes = 10 * 1024 * 1024,
  } = props;

  const [files, setFiles] = useState<
    Map<string, { name: string; type?: string; key: string }>
  >(defaultFiles ?? new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState(
    new Map<string, number>(),
  );
  const [localPreviewUrls, setLocalPreviewUrls] = useState(
    new Map<string, { url: string | null; name: string; type?: string }>(),
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useMemo(() => {
    return new Map(
      Array.from(
        new Set([
          ...Array.from(files).map(([id]) => id),
          ...Array.from(localPreviewUrls).map(([id]) => id),
        ]),
      )
        .map((id) => {
          if (typeof id !== "string") return null;

          const localPreviewUrl = localPreviewUrls.get(id);
          const file = files.get(id);
          if (!localPreviewUrl && !file) return null;
          const previewUrl = localPreviewUrl
            ? localPreviewUrl
            : file
              ? {
                  url: generateFileUrl(file.key),
                  name: file?.name ?? "Unknown file",
                  type: file?.type,
                  key: file.key,
                }
              : null;
          if (!previewUrl) return null;

          return [id, previewUrl];
        })
        .filter((pair): pair is [string, CustomFile] => Boolean(pair)),
    );
  }, [files, localPreviewUrls]);
  const acceptedTypes = accept
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!localPreviewUrls.size) return;

    return () =>
      localPreviewUrls.forEach(({ url }) => url && URL.revokeObjectURL(url));
  }, [localPreviewUrls]);

  const validateFiles = useCallback(
    (incomingFiles: File[]) => {
      if (files.size + incomingFiles.length > maxFileLimit) {
        setError(`Max file limit reached: ${maxFileLimit}`);
        return false;
      }

      for (const file of incomingFiles) {
        const { isValid, reason } = validateFile(file, {
          accept,
          maxFileSizeBytes,
        });
        if (!isValid) {
          setError(reason);
          return false;
        }
      }

      setError("");
      return true;
    },
    [accept, maxFileLimit, maxFileSizeBytes, files.size],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const fileArray = Array.from(files);

      if (!validateFiles(fileArray))
        return toast.error("Failed to validate files.");

      const resolvedFileIdMap = fileArray.map((file) => {
        const fileId = crypto.randomUUID();

        return [fileId, file] as const;
      });

      const fileIdMap = new Map(resolvedFileIdMap);
      const fileIds = Array.from(fileIdMap).map(([id]) => id);

      const filesToUpload = new Map(
        fileIds.map((id) => {
          const file = fileIdMap.get(id);

          const fileName = file?.name ?? "Unknown file";
          const fileType = file?.type;

          return [
            id,
            {
              url: file ? URL.createObjectURL(file) : null,
              name: fileName,
              type: fileType,
            },
          ];
        }),
      );

      const prevLocalPreviewUrls = localPreviewUrls;
      const prevUploadProgresses = uploadProgresses;

      setLocalPreviewUrls((prev) => new Map([...prev, ...filesToUpload]));
      setIsUploading(true);
      setUploadProgresses(
        (prev) => new Map([...prev, ...new Map(fileIds.map((id) => [id, 0]))]),
      );

      try {
        const fileIdKeys = (
          await Promise.all(
            Array.from(fileIdMap).map(([id, file]) =>
              createFileKey(file, keyPrefix).then((key) => ({ id, file, key })),
            ),
          )
        )
          .filter((item): item is { id: string; file: File; key: string } =>
            Boolean(item.key),
          )
          .map(({ id, file, key }) => [id, { file, key }] as const);
        if (fileIdKeys.length !== fileIdMap.size)
          throw new Error("Failed to generate file keys.");

        const presignedPayloads = await Promise.all(
          fileIdKeys.map(([id, { key }]) =>
            fetchUploadPresignedUrl(key).then((url) =>
              url ? { url, key, id } : null,
            ),
          ),
        );

        const presignedUrls = presignedPayloads
          .map((data) =>
            data
              ? {
                  ...data,
                  file: fileIdMap.get(data.id),
                }
              : null,
          )
          .filter(
            (
              presignedUrl,
            ): presignedUrl is {
              url: string;
              key: string;
              file: File;
              id: string;
            } =>
              Boolean(presignedUrl) &&
              Boolean(presignedUrl?.url) &&
              Boolean(presignedUrl?.file),
          );

        if (
          fileIds.length !== presignedPayloads.length ||
          fileIds.length !== presignedUrls.length
        )
          throw new Error("Failed to get upload URL.");

        await Promise.all(
          presignedUrls.map(({ url, file, id }) =>
            uploadFileWithProgress(url, file, (value) =>
              setUploadProgresses((prev) => {
                const next = new Map(prev);
                next.set(id, value);
                return next;
              }),
            ),
          ),
        );

        setFiles((prev) => {
          const next = new Map(prev);

          for (const { id, key, file } of presignedUrls) {
            next.set(id, { name: file.name, type: file.type, key });
          }

          return next;
        });

        setLocalPreviewUrls((prev) => {
          const next = new Map(prev);

          for (const { id } of presignedUrls) {
            const preview = next.get(id);
            if (preview?.url) {
              URL.revokeObjectURL(preview.url);
            }

            next.delete(id);
          }

          return next;
        });
      } catch (error) {
        console.error(error);
        const message = Error.isError(error)
          ? error.message
          : `Failed to upload file${fileArray.length > 1 ? "s" : ""}`;

        setLocalPreviewUrls(prevLocalPreviewUrls);
        setUploadProgresses(prevUploadProgresses);
        toast.error(message);
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [keyPrefix, setFiles, validateFiles, localPreviewUrls, uploadProgresses],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files ?? [];
    if (files && files.length > 0) {
      handleFiles([...files]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target?.files ?? [];
    if (files && files.length > 0) {
      handleFiles([...files]);
    }
  };

  const removeFileFromState = (id: string) => {
    setLocalPreviewUrls((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setFiles((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setUploadProgresses((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleRemoveFile = async (id: string) => {
    if (!files.get(id)) {
      removeFileFromState(id);
      return;
    }

    setIsDeleting(false);

    const file = files.get(id);
    if (!file) return toast.error("File not found.");

    try {
      const response = await deleteFileClient(file.key);
      if (response.error) throw new Error(response.message);

      removeFileFromState(id);
    } catch (error) {
      console.error(error);
      const message = Error.isError(error)
        ? error.message
        : "Failed to delete file.";

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFiles = () => {
    setFiles(new Map());
    setLocalPreviewUrls(new Map());
  };

  return {
    files,
    setFiles,
    isDragging,
    setIsDragging,
    isUploading,
    setIsUploading,
    isDeleting,
    setIsDeleting,
    uploadProgresses,
    setUploadProgresses,
    localPreviewUrls,
    setLocalPreviewUrls,
    error,
    setError,
    inputRef,
    previewUrls,
    acceptedTypes,
    validateFiles,
    handleFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    handleRemoveFile,
    clearFiles,
  };
};

export type UseFileUploadsReturnType = ReturnType<typeof useFileUploads>;
