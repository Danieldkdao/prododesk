"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { ComponentProps, useTransition } from "react";
import { resetAccountDataAction } from "./actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const ResetAccountDataButton = ({
  children,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick">) => {
  const [ConfirmationDialog, confirm] = useConfirm(
    "Reset Account Data",
    "Are you sure you want reset your account data? This action cannot be undone.",
    "RESET ACCOUNT DATA",
  );
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccountDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await resetAccountDataAction();
      if (response.error) {
        toast.error(response.message || "Failed to reset account data.");
      } else {
        toast.success(response.message || "Account data reset successfully.");
        router.refresh();
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={isPending || disabled}
        onClick={handleAccountDeletion}
        {...props}
      >
        <LoadingSwap isLoading={isPending}>{children}</LoadingSwap>
      </Button>
    </>
  );
};
