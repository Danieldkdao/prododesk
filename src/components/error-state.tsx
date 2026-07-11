import { CircleXIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export const ErrorState = ({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <Card
      className={cn(
        "ring-0 border-4 border-dashed border-destructive w-full p-4",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 items-center">
        <CircleXIcon className="text-destructive size-10" />
        <h2 className="text-2xl font-semibold text-center text-destructive">
          {title}
        </h2>
        <p className="text-destructive text-lg text-center max-w-150">
          {description}
        </p>
        <div className="w-full max-w-150">{children}</div>
      </CardContent>
    </Card>
  );
};
