import {
  deleteFileClient,
  fetchUploadPresignedUrl,
  uploadFileWithProgress,
  validateFile,
} from "@/features/uploads/lib/helpers";
import { FileAttachment } from "@/services/ai/types";
import { isError } from "@/lib/utils";
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

type CustomFile = {
  url: string;
  name: string;
  type: string;
};

export const useFileUploads = (props: {
  accept?: string;
  uploadMessage?: string;
  maxFileLimit?: number;
  maxFileSizeBytes?: number;
  defaultFiles?: Map<
    string,
    { name: string; type: string; uploadId: string; url: string }
  >;
  chatId?: string;
}) => {
  const {
    accept = "*",
    maxFileLimit = 1,
    defaultFiles,
    maxFileSizeBytes = 10 * 1024 * 1024,
    chatId,
  } = props;

  const [files, setFiles] = useState<
    Map<string, { name: string; type: string; uploadId: string; url: string }>
  >(defaultFiles ?? new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFilesDeleting, setIsFilesDeleting] = useState(
    new Map<string, boolean>(),
  );
  const [uploadProgresses, setUploadProgresses] = useState(
    new Map<string, number>(),
  );
  const [localPreviewUrls, setLocalPreviewUrls] = useState(
    new Map<string, { url: string; name: string; type: string }>(),
  );
  const [error, setError] = useState("");
  const localPreviewUrlsRef = useRef(localPreviewUrls);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptedTypes = accept
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);
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
          const previewUrl = localPreviewUrl ?? file;
          if (!previewUrl) return null;

          return [id, previewUrl];
        })
        .filter((pair): pair is [string, CustomFile] => Boolean(pair)),
    );
  }, [files, localPreviewUrls]);
  const uploadedFiles = useMemo(
    () =>
      Array.from(files, ([, file]) => ({
        type: "file",
        mediaType: file.type,
        url: file.url,
        filename: file.name,
        providerMetadata: {
          prododesk: {
            uploadId: file.uploadId,
          },
        },
      })),
    [files],
  ) satisfies FileAttachment[];

  const isAnyFileDeleting = useMemo(
    () => isFilesDeleting.size > 0,
    [isFilesDeleting],
  );

  useEffect(() => {
    return () => {
      localPreviewUrlsRef.current?.forEach(
        ({ url }) => url && URL.revokeObjectURL(url),
      );
    };
  }, []);

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
      const fileIds = Array.from(fileIdMap);

      const filesToUpload = new Map(
        fileIds.map(([id, file]) => {
          const fileName = file.name ?? "Unknown file";
          const fileType = file.type;

          return [
            id,
            {
              url: URL.createObjectURL(file),
              name: fileName,
              type: fileType,
            },
          ];
        }),
      );

      setLocalPreviewUrls((prev) => new Map([...prev, ...filesToUpload]));
      setIsUploading(true);
      setUploadProgresses(
        (prev) =>
          new Map([...prev, ...new Map(fileIds.map(([id]) => [id, 0]))]),
      );

      try {
        const presignedPayloads = await Promise.all(
          fileIds.map(([id, file]) =>
            fetchUploadPresignedUrl(file, {
              purpose: "chat-attachment",
              chatId,
            }).then((data) => (data ? { ...data, id, file } : null)),
          ),
        );

        const presignedUrls = presignedPayloads.filter(
          (payload): payload is NonNullable<typeof payload> => Boolean(payload),
        );

        if (fileIds.length !== presignedUrls.length)
          throw new Error("Failed to get upload URL.");

        await Promise.all(
          presignedUrls.map(({ uploadUrl, file, id }) =>
            uploadFileWithProgress(uploadUrl, file, (value) =>
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

          for (const { id, uploadId, publicUrl, file } of presignedUrls) {
            next.set(id, {
              name: file.name,
              type: file.type,
              uploadId,
              url: publicUrl,
            });
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
        const message = isError(error)
          ? error.message
          : `Failed to upload file${fileArray.length > 1 ? "s" : ""}`;
        toast.error(message);

        setLocalPreviewUrls((prev) => {
          const next = new Map(prev);
          for (const [id] of fileIds) {
            const preview = next.get(id);
            if (preview?.url) {
              URL.revokeObjectURL(preview.url);
            }

            next.delete(id);
          }

          return next;
        });
        setUploadProgresses((prev) => {
          const next = new Map(prev);
          for (const [id] of fileIds) {
            next.delete(id);
          }

          return next;
        });
      } finally {
        setIsUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [setFiles, validateFiles, chatId],
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
      const preview = next.get(id);
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
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

    setIsFilesDeleting((prev) => {
      const next = new Map(prev);
      next.set(id, true);
      return next;
    });

    const file = files.get(id);
    if (!file) return toast.error("File not found.");

    try {
      const response = await deleteFileClient({
        purpose: "upload-intent",
        uploadId: file.uploadId,
      });
      if (response.error) throw new Error(response.message);

      removeFileFromState(id);
    } catch (error) {
      console.error(error);
      const message = isError(error) ? error.message : "Failed to delete file.";

      toast.error(message);
    } finally {
      setIsFilesDeleting((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const clearFiles = () => {
    setFiles(new Map());
    setLocalPreviewUrls((prev) => {
      const next = new Map(prev);
      next.forEach(({ url }) => {
        if (url) URL.revokeObjectURL(url);
      });

      return new Map();
    });
  };

  return {
    files,
    uploadedFiles,
    setFiles,
    isDragging,
    setIsDragging,
    isUploading,
    setIsUploading,
    isFilesDeleting,
    isAnyFileDeleting,
    setIsFilesDeleting,
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
