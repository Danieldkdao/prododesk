import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactElement, useState } from "react";
import { PasswordForm } from "./password-form";

export const PasswordDialog = ({
  hasPasswordAccount,
  children,
}: {
  hasPasswordAccount: boolean;
  children: ReactElement;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Set/Update Password</DialogTitle>
          <DialogDescription>Set/Update Password</DialogDescription>
        </DialogHeader>
        <PasswordForm
          hasPasswordAccount={hasPasswordAccount}
          afterAction={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
