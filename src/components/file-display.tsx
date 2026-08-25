import { XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaFilePdf } from "react-icons/fa6";
import { Button } from "./ui/button";
import { ProgressRing } from "./ui/progress-ring";

export const FileDisplay = ({
  url,
  name,
  type,
  handleRemoveFile,
  uploadProgress,
}: {
  url: string | null;
  name: string;
  type?: string;
  handleRemoveFile?: () => void;
  uploadProgress?: number;
}) => {
  let elementToReturn = null;

  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  if (type?.startsWith("image/") && url) {
    elementToReturn = (
      <>
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 p-4 bg-black/20 backdrop-blur-xs">
            <ProgressRing
              value={uploadProgress === 0 ? null : uploadProgress}
              formatValue={() => ""}
            />
          </div>
        ) : null}
        <div className="relative size-full">
          <Image src={url} alt={`file-${name}`} fill className="object-cover" />
        </div>
      </>
    );
  }

  if (type === "application/pdf" && url) {
    elementToReturn = (
      <div className="flex h-full min-h-20 w-full min-w-0 cursor-pointer items-center gap-2 border bg-card p-4">
        {isUploading ? (
          <ProgressRing
            value={uploadProgress === 0 ? null : uploadProgress}
            formatValue={() => ""}
          />
        ) : (
          <FaFilePdf className="size-8 shrink-0 text-destructive" />
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <span className="truncate text-base font-medium leading-none">
            {name}
          </span>
          <span className="text-sm font-medium leading-none text-muted-foreground">
            PDF
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative h-full min-h-0 w-full">
      {handleRemoveFile && (
        <Button
          variant="destructive"
          size="icon-xs"
          className="absolute -top-1 -right-1 z-10 hidden group-hover:flex bg-destructive text-white hover:bg-destructive/90 hover:text-white"
          onClick={handleRemoveFile}
        >
          <XIcon />
        </Button>
      )}
      {url && !isUploading ? (
        <Link href={url} target="_blank">
          {elementToReturn}
        </Link>
      ) : (
        elementToReturn
      )}
    </div>
  );
};
