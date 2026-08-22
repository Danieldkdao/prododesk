import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

export const OverviewSuspenseEmptyData = ({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) => {
  return (
    <Card className={cn("border", className)}>
      <CardContent className="h-full w-full flex items-center justify-center">
        <div className="w-full flex flex-col items-center justify-center gap-2">
          <Icon className="size-15" />
          <h2 className="text-3xl font-semibold text-center">{title}</h2>
          <p className="text-muted-foreground text-lg text-center max-w-150">
            {description}
          </p>
          <div className="max-w-150 w-full">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
};
