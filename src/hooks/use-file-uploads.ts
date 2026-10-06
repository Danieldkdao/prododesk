import {
  deleteFileClient,
  fetchUploadPresignedUrl,
  uploadFileWithProgress,
  validateFile,
} from "@/features/uploads/lib/helpers";
import { isError } from "@/lib/utils";
import { FileAttachment } from "@/services/ai/types";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
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
  const activeUploadRef = useRef<AbortController | null>(null);
  const removedIdsRef = useRef(new Set<string>());
  const filesRef = useRef(files);

  useLayoutEffect(() => {
    filesRef.current = files;
    localPreviewUrlsRef.current = localPreviewUrls;
  }, [files, localPreviewUrls]);
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
      activeUploadRef.current?.abort();
      localPreviewUrlsRef.current?.forEach(
        ({ url }) => url && URL.revokeObjectURL(url),
      );
    };
  }, []);

  const validateFiles = useCallback(
    (incomingFiles: File[]) => {
      if (filesRef.current.size + incomingFiles.length > maxFileLimit) {
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
    [accept, maxFileLimit, maxFileSizeBytes],
  );

  const handleFiles = useCallback(
    async (incomingFiles: File[]) => {
      if (activeUploadRef.current) {
        toast.error("Please wait for the current uploads to finish.");
        return;
      }
      if (!incomingFiles.length) return;
      if (!validateFiles(incomingFiles)) {
        toast.error("Failed to validate files.");
        return;
      }
      const controller = new AbortController();
      activeUploadRef.current = controller;
      const fileEntries = incomingFiles.map(
        (file) => [crypto.randomUUID(), file] as const,
      );
      const previews = new Map(
        fileEntries.map(([id, file]) => [
          id,
          { url: URL.createObjectURL(file), name: file.name, type: file.type },
        ]),
      );
      setLocalPreviewUrls((previous) => new Map([...previous, ...previews]));
      setIsUploading(true);
      setUploadProgresses(
        (previous) =>
          new Map([
            ...previous,
            ...fileEntries.map(([id]) => [id, 0] as const),
          ]),
      );

      const results = await Promise.allSettled(
        fileEntries.map(async ([id, file]) => {
          const payload = await fetchUploadPresignedUrl(file, {
            purpose: "chat-attachment",
            chatId,
          });
          if (!payload) throw new Error("Failed to get upload URL.");
          try {
            await uploadFileWithProgress(
              payload.uploadUrl,
              file,
              (value) => {
                if (controller.signal.aborted || removedIdsRef.current.has(id))
                  return;
                setUploadProgresses((previous) =>
                  new Map(previous).set(id, value),
                );
              },
              controller.signal,
            );
            if (controller.signal.aborted || removedIdsRef.current.has(id)) {
              await deleteFileClient({
                purpose: "upload-intent",
                uploadId: payload.uploadId,
              });
              return null;
            }
            return {
              id,
              name: file.name,
              type: file.type,
              uploadId: payload.uploadId,
              url: payload.publicUrl,
            };
          } catch (error) {
            await deleteFileClient({
              purpose: "upload-intent",
              uploadId: payload.uploadId,
            });
            throw error;
          }
        }),
      );

      const completedUploads = results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
      await Promise.allSettled(
        completedUploads
          .filter((file) => removedIdsRef.current.has(file.id))
          .map((file) =>
            deleteFileClient({
              purpose: "upload-intent",
              uploadId: file.uploadId,
            }),
          ),
      );
      if (controller.signal.aborted) {
        await Promise.allSettled(
          completedUploads.map((file) =>
            deleteFileClient({
              purpose: "upload-intent",
              uploadId: file.uploadId,
            }),
          ),
        );
      }
      if (!controller.signal.aborted) {
        const completed = new Map(filesRef.current);
        for (const result of results) {
          if (
            result.status !== "fulfilled" ||
            !result.value ||
            removedIdsRef.current.has(result.value.id)
          )
            continue;
          const { id, ...file } = result.value;
          completed.set(id, file);
        }
        filesRef.current = completed;
        setFiles(completed);
        const failed = results.filter(
          (result) => result.status === "rejected",
        ).length;
        if (failed)
          toast.error(
            `${failed} file${failed === 1 ? "" : "s"} could not be uploaded. Please try again.`,
          );
      }
      for (const [id, preview] of previews) {
        URL.revokeObjectURL(preview.url);
        removedIdsRef.current.delete(id);
      }
      setLocalPreviewUrls((previous) => {
        const updated = new Map(previous);
        for (const [id] of fileEntries) updated.delete(id);
        return updated;
      });
      setUploadProgresses((previous) => {
        const updated = new Map(previous);
        for (const [id] of fileEntries) updated.delete(id);
        return updated;
      });
      if (activeUploadRef.current === controller) {
        activeUploadRef.current = null;
        setIsUploading(false);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [validateFiles, chatId],
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
    removedIdsRef.current.add(id);
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
    activeUploadRef.current?.abort();
    filesRef.current = new Map();
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
