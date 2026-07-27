import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

export const InfoCard = ({
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
        "ring-0 border-4 border-dashed border-primary w-full",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 items-center">
        <InfoIcon className="text-primary size-10" />
        <h2 className="text-2xl font-semibold text-center text-primary">
          {title}
        </h2>
        <p className="text-primary text-lg text-center max-w-150">
          {description}
        </p>
        {children}
      </CardContent>
    </Card>
  );
};
