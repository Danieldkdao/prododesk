import { cn } from "@/lib/utils";
import { ComponentProps, ReactElement } from "react";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
} from "./emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export const EmojiPickerPopover = ({
  children,
  className,
  ...props
}: { children: ReactElement } & ComponentProps<typeof EmojiPicker>) => {
  return (
    <Popover>
      <PopoverTrigger render={children} />
      <PopoverContent align="center">
        <EmojiPicker className={cn("max-h-96", className)} {...props}>
          <EmojiPickerSearch />
          <EmojiPickerContent />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
};
