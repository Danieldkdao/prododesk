import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus, taskStatuses } from "@/db/shared";
import { ComponentProps } from "react";
import { formatTaskStatus } from "../lib/formatters";

export const TaskStatusSelect = ({
  triggerProps,
  valueProps,
  contentProps,
  ...props
}: ComponentProps<typeof Select> & {
  triggerProps?: ComponentProps<typeof SelectTrigger>;
  valueProps?: ComponentProps<typeof SelectValue>;
  contentProps?: ComponentProps<typeof SelectContent>;
}) => {
  const formattedStatus = props.value
    ? formatTaskStatus(props.value as TaskStatus)
    : null;

  return (
    <Select {...props}>
      <SelectTrigger className="w-full" {...triggerProps}>
        <SelectValue placeholder="Select a status" {...valueProps}>
          {formattedStatus ? (
            <div className="flex items-center gap-2">
              <formattedStatus.icon />
              {formattedStatus.label}
            </div>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent {...contentProps}>
        {taskStatuses.map((status) => {
          const { label, icon: Icon } = formatTaskStatus(status);

          return (
            <SelectItem key={status} value={status}>
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
