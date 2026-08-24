import { ApiResponse } from "@/lib/types";
import { generateFileUrl } from "@/lib/utils";
import {
  createFileKey,
  uploadFileWithProgress,
} from "@/services/tigris/helpers";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuthSession } from "./use-auth-session";

export const useFileUploads = (props: {
  accept?: string;
  keyPrefix: string;
  uploadMessage?: string;
  deleteMessage?: string;
  maxFileLimit?: number;
  defaultFiles?: string[];
}) => {
  const {
    accept = "*",
    keyPrefix,
    uploadMessage,
    deleteMessage,
    maxFileLimit = 1,
    defaultFiles,
  } = props;

  const { data: session } = useAuthSession();

  const [files, setFiles] = useState<string[]>(defaultFiles ?? []);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState(
    new Map<string, number>(),
  );
  const [localPreviewUrls, setLocalPreviewUrls] = useState(
    new Map<string, string | null>(),
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = new Map(
    Array.from(
      new Set([...files, Array.from(localPreviewUrls).map(([key]) => key)]),
    )
      .map((key) => {
        if (typeof key !== "string") return null;

        const localPreviewUrl = localPreviewUrls.get(key);
        const previewUrl = localPreviewUrl
          ? localPreviewUrl
          : generateFileUrl(key);

        return [key, previewUrl];
      })
      .filter((pair): pair is [string, string] => Boolean(pair)),
  );
  const acceptedTypes = accept
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!localPreviewUrls.size) return;

    return () =>
      localPreviewUrls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [localPreviewUrls]);

  useEffect(() => {
    if (!files.length) return;

    console.log(previewUrls);
    console.log(files);

    setLocalPreviewUrls(new Map());
  }, [files]);

  const validateFiles = useCallback(
    (incomingFiles: File[]) => {
      if (files.length + incomingFiles.length > maxFileLimit) {
        setError(`Max file limit reached: ${maxFileLimit}`);
        return false;
      }

      if (accept !== "*") {
        const allowedTypes = accept
          .split(",")
          .map((type) => type.trim())
          .filter(Boolean);
        const allValid = Array.from(incomingFiles).every((file) =>
          allowedTypes.some(
            (type) =>
              file.type === type ||
              (type.endsWith("/*") &&
                file.type.startsWith(type.replace("/*", "/"))) ||
              file.name.toLowerCase().endsWith(type.toLowerCase()),
          ),
        );
        if (!allValid) {
          setError(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
          return false;
        }
      }
      setError("");
      return true;
    },
    [accept, maxFileLimit, files.length],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const fileArray = Array.from(files);

      if (!validateFiles(fileArray) || !session?.user.id) return;

      const fileKeyMap = new Map(
        fileArray.map((file) => [
          createFileKey(file, keyPrefix, session.user.id),
          file,
        ]),
      );
      const fileKeys = Array.from(fileKeyMap).map(([key]) => key);

      const filesToUpload = new Map(
        fileKeys.map((key) => {
          const file = fileKeyMap.get(key);

          if (file) return [key, URL.createObjectURL(file)];
          return [key, null];
        }),
      );

      const prevLocalPreviewUrls = localPreviewUrls;
      const prevUploadProgresses = uploadProgresses;

      setLocalPreviewUrls((prev) => new Map([...prev, ...filesToUpload]));
      setIsUploading(true);
      setUploadProgresses(
        (prev) =>
          new Map([...prev, ...new Map(fileKeys.map((key) => [key, 0]))]),
      );

      try {
        const presignedPayloads = (await Promise.all(
          fileKeys.map((key) =>
            fetch("/api/s3/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key }),
            })
              .then((res) => res.json())
              .then((data) => ({ ...data, key })),
          ),
        )) as (ApiResponse<{ url: string }> & { key: string })[];

        const presignedUrls = presignedPayloads
          .map(({ data, key }) => ({
            url: data?.url,
            key,
            file: fileKeyMap.get(key),
          }))
          .filter(
            (
              presignedUrl,
            ): presignedUrl is { url: string; key: string; file: File } =>
              Boolean(presignedUrl.url) && Boolean(presignedUrl.file),
          );

        if (
          fileKeys.length !== presignedPayloads.length ||
          presignedPayloads.some((payload) => payload.error) ||
          fileKeys.length !== presignedUrls.length
        )
          throw new Error(
            presignedPayloads.find((payload) => payload.error)?.message ||
              "Failed to get upload URL.",
          );

        await Promise.all(
          presignedUrls.map(({ url, key, file }) =>
            uploadFileWithProgress(url, file, (value) =>
              setUploadProgresses((prev) => {
                const next = new Map(prev);
                next.set(key, value);
                return next;
              }),
            ),
          ),
        );

        setFiles((prev) => [...prev, ...presignedUrls.map(({ key }) => key)]);
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
    [
      keyPrefix,
      setFiles,
      validateFiles,
      session,
      localPreviewUrls,
      uploadProgresses,
    ],
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

  const removeFileFromState = (key: string) => {
    setLocalPreviewUrls((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    setFiles((prev) => prev.filter((k) => k === key));
    setUploadProgresses((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  const handleRemoveFile = async (key: string) => {
    if (!files.find((k) => k === key)) {
      removeFileFromState(key);
      return;
    }

    setIsDeleting(false);

    try {
      const presignedResponse = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const presignedPayload = (await presignedResponse.json()) as ApiResponse<{
        url: string;
      }>;
      const presignedUrl = presignedPayload.data?.url;

      if (!presignedResponse.ok || presignedPayload.error || !presignedUrl)
        throw new Error(
          presignedPayload.message || "Failed to get delete URL.",
        );

      const deleteResponse = await fetch(presignedUrl, { method: "DELETE" });
      if (!deleteResponse.ok)
        throw new Error("Failed to delete file from storage.");

      removeFileFromState(key);
      toast.success(deleteMessage);
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
  };
};
