import { FileDisplay } from "@/components/file-display";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@/services/ai/types";

export const ChatMessageAttachments = ({
  attachments,
}: {
  attachments: FileAttachment[];
}) => {
  const onlyImages =
    attachments.length > 0 &&
    attachments.every((att) => att.mediaType.startsWith("image/"));

  return (
    <div className="flex w-full min-w-0 max-w-full items-stretch gap-2 overflow-x-auto p-1 scrollbar-none scroll-fade-x">
      {attachments.map((attachment, index) => {
        const isImage = attachment.mediaType?.startsWith("image/");

        return (
          <div
            key={
              attachment.providerMetadata?.prododesk?.storageKey ??
              `${attachment.url}-${index}`
            }
            className={cn(
              "shrink-0",
              isImage
                ? onlyImages
                  ? "size-40"
                  : "min-h-20 self-stretch aspect-square"
                : "min-h-20 w-64 self-stretch",
              index === 0 && "ml-auto",
            )}
          >
            <FileDisplay
              name={attachment.filename || "Unknown file"}
              url={attachment.url}
              type={attachment.mediaType}
            />
          </div>
        );
      })}
    </div>
  );
};
