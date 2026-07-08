"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "./ui/sonner";
import { ReactNode } from "react";
import { TooltipProvider } from "./ui/tooltip";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableColorScheme
      disableTransitionOnChange
    >
      <Toaster />
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
};
