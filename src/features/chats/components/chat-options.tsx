"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIcon, Trash2Icon } from "lucide-react";
import { ComponentProps, ReactElement, useState } from "react";
import { UpdateChatDialog } from "./update-chat-dialog";
import { ChatTableSelectType } from "@/db/schema";
import { DeleteChatButton } from "./delete-chat-button";

export const ChatOptions = ({
  chat,
  children,
  ...props
}: { chat: ChatTableSelectType; children: ReactElement } & ComponentProps<
  typeof DropdownMenuContent
>) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UpdateChatDialog existingChat={chat} open={open} setOpen={setOpen} />
      <DropdownMenu>
        <DropdownMenuTrigger render={children} />
        <DropdownMenuContent {...props}>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <EditIcon />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton
            variant="destructive"
            render={
              <DeleteChatButton
                chatId={chat.id}
                variant="destructive"
                className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
              >
                <Trash2Icon />
                Delete
              </DeleteChatButton>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
