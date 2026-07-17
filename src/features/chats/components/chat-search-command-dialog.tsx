import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemLink,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { ReactElement } from "react";
import { ChatList } from "./chat-list";

export const ChatSearchCommandDialog = ({
  children,
}: {
  children: ReactElement;
}) => {
  return (
    <>
      <CommandDialog
        title="Search chats"
        description="Search chats"
        trigger={children}
      >
        <Command title="Search chats" shouldFilter={false}>
          <CommandInput
            useDebouncedSearch
            placeholder="Search chats by name..."
          />
          <CommandList>
            <CommandGroup>
              <CommandItemLink href="/dashboard/ai/new">
                <PlusIcon />
                New chat
              </CommandItemLink>
            </CommandGroup>
            <CommandGroup heading="Chats">
              <ChatList
                variant="search"
                useSearch
                skeleton={
                  <CommandItem>
                    <Skeleton className="mx-3 my-2 h-4 w-full rounded-none" />
                  </CommandItem>
                }
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};
