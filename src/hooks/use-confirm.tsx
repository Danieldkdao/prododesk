import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ReactElement, useState } from "react";

export const useConfirm = (
  title: string,
  description: string,
  confirmInput?: string,
): [ReactElement, () => Promise<boolean>] => {
  const [confirmInputValue, setConfirmInputValue] = useState("");
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const canAction = confirmInput?.length
    ? confirmInput === confirmInputValue
    : true;

  const confirm = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    if (!canAction) return;

    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const confirmationDialog = (
    <Dialog
      open={promise !== null}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {confirmInput?.length && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">
              To confirm this action, please enter &quot;
              <span className="text-foreground font-medium">
                {confirmInput}
              </span>
              &quot; in the input below.
            </span>
            <Input
              className="text-lg md:text-lg"
              value={confirmInputValue}
              onChange={(e) => setConfirmInputValue(e.target.value)}
            />
          </div>
        )}
        <div className="pt-4 w-full flex flex-col-reverse gap-y-2 lg:flex-row gap-x-2 items-center justify-end">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full lg:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canAction}
            className="w-full lg:w-auto"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return [confirmationDialog, confirm];
};
