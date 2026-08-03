"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { usePathname, useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { deleteDocumentAction } from "../actions/actions";
import { toast } from "sonner";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const DeleteDocumentButton = ({
  documentId,
  children,
  disabled,
  ...props
}: { documentId: string; children: ReactNode } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Deletion",
    "Are you sure that you want to delete this document?",
  );

  const handleDeletion = async () => {
    const confirmation = await confirm();
    if (!confirmation) return;

    startTransition(async () => {
      const response = await deleteDocumentAction(documentId);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        if (pathname && pathname.includes(documentId)) {
          router.push("/dashboard/documents");
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
