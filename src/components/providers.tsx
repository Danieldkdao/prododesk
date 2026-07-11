"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "./ui/sonner";
import { ReactNode, useState } from "react";
import { TooltipProvider } from "./ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableColorScheme
          disableTransitionOnChange
        >
          <Toaster />
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
};
