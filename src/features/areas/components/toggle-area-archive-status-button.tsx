"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toggleAreaArchiveStatusAction } from "../actions/actions";
import { toast } from "sonner";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const ToggleAreaArchiveStatusButton = ({
  areaId,
  newArchiveStatus,
  children,
  disabled,
  ...props
}: { areaId: string; newArchiveStatus: boolean; children: ReactNode } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Archive Status Update",
    `Are you sure you want to ${newArchiveStatus ? "archive this area? You will be unable to use it until you reactivate it." : "reactivate this area?"}`,
  );

  const handleUpdate = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await toggleAreaArchiveStatusAction(
        areaId,
        newArchiveStatus,
      );
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        router.refresh();
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        {...props}
        disabled={disabled || isPending}
        onClick={handleUpdate}
      >
        <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
