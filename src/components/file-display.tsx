import { FileQuestionMarkIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export const FileDisplay = ({
  fileKey,
  url,
  name,
  type,
  handleRemoveFile,
}: {
  fileKey: string;
  url: string | null;
  name: string;
  type?: string;
  handleRemoveFile: (key: string) => void;
}) => {
  let elementToReturn = (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      <FileQuestionMarkIcon />
      <span className="text-muted-foreground font-medium text-lg">{name}</span>
    </div>
  );
  let badgeText = "Unknown File Type";

  if (type?.startsWith("image/") && url) {
    elementToReturn = (
      <Image src={url} alt={`file-${name}`} fill className="object-cover" />
    );
    badgeText = `${type.split("/")[1].toUpperCase()} Image`;
  }

  if (type === "application/pdf" && url) {
    elementToReturn = (
      <iframe
        src={url}
        title={`file-${name}`}
        className="w-full h-full aspect-square"
      />
    );
    badgeText = "PDF Document";
  }

  return (
    <div className="relative aspect-square w-full group">
      <Button
        variant="destructive"
        size="icon"
        className="z-10 absolute top-1 right-1 hidden group-hover:flex"
        onClick={() => handleRemoveFile(fileKey)}
      >
        <Trash2Icon />
      </Button>
      {elementToReturn}
      <Badge className="bottom-2 left-2 absolute bg-primary/80 text-white py-0.5 px-1">
        {badgeText}
      </Badge>
    </div>
  );
};
