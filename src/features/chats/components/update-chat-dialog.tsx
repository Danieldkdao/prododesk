"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatTableSelectType } from "@/db/schema";
import { SetterType } from "@/lib/types";
import { UpdateChatForm } from "./update-chat-form";

export const UpdateChatDialog = ({
  existingChat,
  open,
  setOpen,
}: {
  existingChat: ChatTableSelectType;
  open: boolean;
  setOpen: SetterType<boolean>;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Update chat</DialogTitle>
        <DialogDescription>Update your chat</DialogDescription>
      </DialogHeader>
      <DialogContent>
        <UpdateChatForm
          existingChat={existingChat}
          afterAction={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
