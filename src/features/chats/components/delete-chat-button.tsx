import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { ComponentProps, ReactNode, useTransition } from "react";
import { deleteChatAction } from "../actions/actions";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const DeleteChatButton = ({
  chatId,
  children,
  disabled,
  innerClassName,
  ...props
}: { chatId: string; children?: ReactNode; innerClassName?: string } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure you want to delete this chat? This will cause a permanent loss of data and cannot be undone.",
  );
  const pathname = usePathname();

  const handleDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteChatAction(chatId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        if (pathname.includes(chatId)) {
          router.push("/dashboard/ai/new");
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
        disabled={isPending || disabled}
        onClick={handleDeletion}
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
