import { ComponentProps, ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const TooltipWrapper = ({
  content,
  children,
  ...triggerProps
}: {
  content: ReactNode;
  children: ReactElement;
} & Omit<ComponentProps<typeof TooltipTrigger>, "children" | "render">) => {
  return (
    <Tooltip>
      <TooltipTrigger {...triggerProps} render={children} />
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
};
