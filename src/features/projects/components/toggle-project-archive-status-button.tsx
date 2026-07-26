import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { toggleProjectArchiveStatusAction } from "@/features/projects/actions/actions";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";

export const ToggleProjectArchiveStatusButton = ({
  projectId,
  newArchiveStatus,
  children,
  disabled,
  ...props
}: { projectId: string; newArchiveStatus: boolean; children: ReactNode } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Archive Status Update",
    `Are you sure you want to ${newArchiveStatus ? "archive this project? It will be considered inactive and won't appear on your usual lists." : "reactivate this project?"}`,
  );

  const handleUpdate = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await toggleProjectArchiveStatusAction(
        projectId,
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
