"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { ComponentProps, useTransition } from "react";
import { removePasswordAccountAction } from "../actions/actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const RemovePasswordAccountButton = ({
  children,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick">) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Removal",
    "You will no longer be able to sign in with your email and password. You can continue signing with other social providers.",
  );
  const [isPending, startTransition] = useTransition();

  const handleRemovePasswordAccount = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await removePasswordAccountAction();
      if (response.error) {
        toast.error(response.message || "Failed to remove password account.");
      } else {
        toast.success(
          response.message || "Password account removed successfully.",
        );
        void queryClient.invalidateQueries({ queryKey: ["socials"] });
        router.refresh();
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={disabled || isPending}
        onClick={handleRemovePasswordAccount}
        {...props}
      >
        <LoadingSwap
          isLoading={isPending}
          className="flex items-center justify-center gap-2"
        >
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
