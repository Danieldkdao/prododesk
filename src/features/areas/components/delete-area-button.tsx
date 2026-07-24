import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { usePathname, useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { deleteAreaAction } from "../actions/actions";

export const DeleteAreaButton = ({
  areaId,
  children,
  disabled,
  ...props
}: {
  areaId: string;
  children?: ReactNode;
} & Omit<ComponentProps<typeof Button>, "onClick">) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure you want to delete this area? This area along with all data associated with it will be permanently deleted.",
  );

  const handleDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteAreaAction(areaId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        if (pathname && pathname.includes(areaId)) {
          router.push("/dashboard/areas");
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
          className="w-full flex items-center gap-2"
        >
          {children}
        </LoadingSwap>
      </Button>
    </>
  );
};
