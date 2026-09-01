import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskPriorities, TaskPriority } from "@/db/shared";
import { formatTaskPriority } from "../lib/formatters";
import { ComponentProps } from "react";

export const TaskPrioritySelect = ({
  triggerProps,
  valueProps,
  contentProps,
  ...props
}: ComponentProps<typeof Select> & {
  triggerProps?: ComponentProps<typeof SelectTrigger>;
  valueProps?: ComponentProps<typeof SelectValue>;
  contentProps?: ComponentProps<typeof SelectContent>;
}) => {
  const formattedPriority = props.value
    ? formatTaskPriority(props.value as TaskPriority)
    : null;

  return (
    <Select {...props}>
      <SelectTrigger className="w-full" {...triggerProps}>
        <SelectValue placeholder="Select task priority" {...valueProps}>
          {formattedPriority ? (
            <div className="flex items-center gap-2">
              <formattedPriority.icon />
              <span>{formattedPriority.label}</span>
            </div>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...contentProps}>
        {taskPriorities.map((priority) => {
          const { label, icon: Icon } = formatTaskPriority(priority);

          return (
            <SelectItem key={priority} value={priority}>
              <div className="flex items-center gap-2">
                <Icon />
                <span>{label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
