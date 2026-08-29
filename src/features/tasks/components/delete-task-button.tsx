import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { deleteTaskAction } from "../actions/actions";

export const DeleteTaskButton = ({
  children,
  taskId,
  onClick,
  disabled,
  innerClassName,
  afterAction,
  ...props
}: {
  children?: ReactNode;
  taskId: string;
  innerClassName?: string;
  afterAction?: () => void | Promise<void>;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure that you want to delete this task? This action cannot be undone.",
  );
  const [isPending, startTransition] = useTransition();

  const handleDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteTaskAction(taskId);
      if (response.error || !response.deletedTask) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        await afterAction?.();
        router.refresh();
      }
    });
  };

  return (
    <>
      {ConfirmationDialog}
      <Button
        disabled={isPending || disabled}
        onClick={handleDeletion ?? onClick}
        {...props}
      >
        <LoadingSwap
          isLoading={isPending}
          className={cn("flex items-center gap-2", innerClassName)}
        >
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
