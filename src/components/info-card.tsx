import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

export const InfoCard = ({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
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
      <CardContent className="flex flex-col gap-2 items-center [&_svg]:text-primary [&_svg]:size-10">
        {icon ?? <InfoIcon />}
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
