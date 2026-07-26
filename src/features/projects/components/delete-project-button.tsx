"use client";

import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { usePathname, useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { deleteProjectAction } from "../actions/actions";

export const DeleteProjectButton = ({
  projectId,
  children,
  disabled,
  ...props
}: { projectId: string; children: ReactNode } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) => {
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure that you want to delete this project? All data associated with this project will be permanently deleted.",
  );

  const handleDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteProjectAction(projectId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        if (pathname && pathname.includes(projectId)) {
          router.push("/dashboard/projects");
        } else {
          router.refresh();
        }
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        {...props}
        disabled={disabled || isPending}
        onClick={handleDeletion}
      >
        <LoadingSwap isLoading={isPending} className="flex items-center gap-2">
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
