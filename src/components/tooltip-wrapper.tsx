"use client";

import { ComponentProps, ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const TooltipWrapper = ({
  content,
  children,
  contentProps,
  ...triggerProps
}: {
  content: ReactNode;
  children: ReactElement;
  contentProps?: ComponentProps<typeof TooltipContent>;
} & Omit<ComponentProps<typeof TooltipTrigger>, "children" | "render">) => {
  return (
    <Tooltip>
      <TooltipTrigger {...triggerProps} render={children} />
      <TooltipContent {...contentProps}>{content}</TooltipContent>
    </Tooltip>
  );
};
