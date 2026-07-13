import { cn } from "@/lib/utils";
import { SearchXIcon } from "lucide-react";
import { ReactElement, ReactNode } from "react";

export const NotFound = ({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string;
  description: string;
  icon?: ReactElement;
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className={cn(
          "w-full flex flex-col items-center gap-2 p-5 max-w-200",
          className,
        )}
      >
        {icon || <SearchXIcon className="size-10" />}
        <h2 className="text-2xl font-semibold text-center">{title}</h2>
        <p className="text-lg text-muted-foreground text-center max-w-150">
          {description}
        </p>
        <div className="max-w-150 w-full flex flex-col items-center">
          {children}
        </div>
      </div>
    </div>
  );
};
