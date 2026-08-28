"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { authClient } from "@/lib/auth/auth-client";
import { ComponentProps, useTransition } from "react";
import { toast } from "sonner";
import { resetAccountDataAction } from "../actions/actions";

export const DeleteAccountButton = ({
  children,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick">) => {
  const [ConfirmationDialog, confirm] = useConfirm(
    "Delete Account",
    "Are you sure you want to delete your account? This action cannot be undone.",
    "DELETE MY ACCOUNT",
  );
  const [isPending, startTransition] = useTransition();

  const handleAccountDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await resetAccountDataAction();
      if (response.error) {
        toast.error(response.message);
        return;
      }

      const { data, error } = await authClient.deleteUser({
        callbackURL: "/",
      });

      if (error) {
        toast.error(error.message || "Failed to request account deletion.");
        return;
      }

      if (data?.message === "Verification email sent") {
        toast.success("Check your email to confirm account deletion.");
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
