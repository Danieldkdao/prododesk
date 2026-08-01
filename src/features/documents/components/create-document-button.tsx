"use client";

import { Button } from "@/components/ui/button";
import { ComponentProps, ReactNode, useTransition } from "react";
import { createDocumentAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const CreateDocumentButton = ({
  children,
  projectId,
  disabled,
  ...props
}: { children: ReactNode; projectId?: string } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCreation = () => {
    startTransition(async () => {
      const response = await createDocumentAction({ projectId });
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        router.refresh();
      }
    });
  };

  return (
    <Button
      disabled={disabled || isPending}
      onClick={handleCreation}
      {...props}
    >
      <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
        {children}
      </LoadingSwap>
    </Button>
  );
};
