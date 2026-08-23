import { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Color, colors } from "@/db/shared";
import { cn } from "@/lib/utils";
import { formatColor } from "@/lib/formatters";

export const ColorPicker = ({
  id,
  fieldError,
  value,
  onValueChange,
  ...props
}: {
  id?: string;
  fieldError: boolean;
  value?: Color | null | undefined;
} & Omit<ComponentProps<typeof Select>, "value">) => {
  return (
    <Select value={value} onValueChange={onValueChange} {...props}>
      <SelectTrigger id={id} aria-invalid={fieldError} className="w-full">
        <SelectValue>
          {value ? (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-4 rounded-full shrink-0",
                  formatColor(value).bg,
                )}
              />
              <span>{formatColor(value).label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No color selected</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {colors.map((color) => (
          <SelectItem key={color} value={color}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-4 rounded-full shrink-0",
                  formatColor(color).bg,
                )}
              />
              <span>{formatColor(color).label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
