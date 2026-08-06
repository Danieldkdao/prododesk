import { formatCalendarValue } from "@/lib/formatters";
import { cn, formatTimeInput, mergeDateTime } from "@/lib/utils";
import { CalendarIcon, Clock2Icon } from "lucide-react";
import { ComponentProps } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "./calendar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type PopoverCalendarProps =
  | {
      mode: "single";
      value?: Date | null | undefined;
      onValueChange: (date: Date | null | undefined) => void;
      withTime?: boolean;
    }
  | {
      mode: "multiple";
      value?: Date[] | null | undefined;
      onValueChange: (dates: Date[] | null | undefined) => void;
    }
  | {
      mode: "range";
      value?: DateRange | null | undefined;
      onValueChange: (range: DateRange | null | undefined) => void;
    };

export const PopoverCalendar = ({
  fieldError,
  errorStateId,
  className,
  ...props
}: {
  fieldError?: boolean;
  errorStateId?: string;
  withTime?: boolean;
} & Omit<
  ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect" | "required"
> &
  PopoverCalendarProps) => {
  const calendarClassName = cn("border bg-card! shadow-sm", className);

  let calendar;

  if (props.mode === "single") {
    const { mode, value, onValueChange, withTime, ...calendarProps } = props;

    const handleDateSelect = (selected: Date | undefined) => {
      if (!selected) {
        onValueChange?.(undefined);
        return;
      }

      const nextDate = value
        ? new Date(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
            value.getHours(),
            value.getMinutes(),
            value.getSeconds(),
            value.getMilliseconds(),
          )
        : selected;

      onValueChange?.(nextDate);
    };

    const handleTimeChange = (time: string) => {
      if (!value || !time) return;

      const nextDate = mergeDateTime(value, time);

      onValueChange?.(nextDate);
    };

    calendar = (
      <div className="flex flex-col w-full">
        <Calendar
          {...calendarProps}
          mode={mode}
          selected={value ?? undefined}
          required={false}
          onSelect={handleDateSelect}
          className={cn(calendarClassName, "border-none")}
        />
        <div className="pb-5 px-5">
          {withTime && (
            <InputGroup>
              <InputGroupInput
                id="time-from"
                type="time"
                step="1"
                value={value ? formatTimeInput(value) : ""}
                onChange={(e) => {
                  handleTimeChange(e.target.value);
                }}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          )}
        </div>
      </div>
    );
  } else if (props.mode === "multiple") {
    const { mode, value, onValueChange, ...calendarProps } = props;

    const handleDatesSelect = (dates: Date[] | undefined) => {
      if (!dates) {
        onValueChange?.(undefined);
        return;
      }

      onValueChange(dates);
    };

    calendar = (
      <Calendar
        {...calendarProps}
        mode={mode}
        selected={value ?? undefined}
        required={false}
        onSelect={handleDatesSelect}
        className={calendarClassName}
      />
    );
  } else {
    const { mode, value, onValueChange, ...calendarProps } = props;

    const handleDateRangeSelect = (dateRange: DateRange | undefined) => {
      if (!dateRange) {
        onValueChange?.(undefined);
        return;
      }

      onValueChange?.(dateRange);
    };

    calendar = (
      <Calendar
        {...calendarProps}
        mode={mode}
        selected={value ?? undefined}
        required={false}
        onSelect={handleDateRangeSelect}
        className={calendarClassName}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        id={fieldError ? errorStateId : undefined}
        aria-invalid={!!fieldError}
        className="flex items-start gap-2 cursor-pointer border-b py-2"
      >
        <CalendarIcon className="size-4 mt-0.4" />
        <span>{formatCalendarValue(props.value, props.withTime)}</span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-auto overflow-hidden p-0",
          props.mode === "single" && "border bg-card",
        )}
      >
        {calendar}
      </PopoverContent>
    </Popover>
  );
};
