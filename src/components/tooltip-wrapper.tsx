import { ComponentProps, ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const TooltipWrapper = ({
  content,
  children,
  ...contentProps
}: {
  content: ReactNode;
  children: ReactElement;
} & Omit<ComponentProps<typeof TooltipContent>, "children" | "render">) => {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent {...contentProps}>{content}</TooltipContent>
    </Tooltip>
  );
};
