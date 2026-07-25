import { formatCalendarValue } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { ComponentProps } from "react";
import { DateRange, OnSelectHandler } from "react-day-picker";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type PopoverCalendarProps =
  | {
      mode: "single";
      value?: Date | null | undefined;
      onSelect?: OnSelectHandler<Date | undefined> | undefined;
    }
  | {
      mode: "multiple";
      value?: Date[] | null | undefined;
      onSelect?: OnSelectHandler<Date[] | undefined> | undefined;
    }
  | {
      mode: "range";
      value?: DateRange | null | undefined;
      onSelect?: OnSelectHandler<DateRange | undefined> | undefined;
    };

export const PopoverCalendar = (
  props: {
    fieldError?: boolean;
    errorStateId?: string;
  } & Omit<
    ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect" | "required"
  > &
    PopoverCalendarProps,
) => {
  const { fieldError, errorStateId, className } = props;

  const calendarClassName = cn("border bg-card! shadow-sm", className);

  let calendar;

  if (props.mode === "single") {
    const {
      mode,
      value,
      onSelect,
      fieldError: _fieldError,
      errorStateId: _errorStateId,
      className: _className,
      ...calendarProps
    } = props;

    calendar = (
      <Calendar
        {...calendarProps}
        mode={mode}
        selected={value ?? undefined}
        required={false}
        onSelect={onSelect}
        className={calendarClassName}
      />
    );
  } else if (props.mode === "multiple") {
    const {
      mode,
      value,
      onSelect,
      fieldError: _fieldError,
      errorStateId: _errorStateId,
      className: _className,
      ...calendarProps
    } = props;

    calendar = (
      <Calendar
        {...calendarProps}
        mode={mode}
        selected={value ?? undefined}
        required={false}
        onSelect={onSelect}
        className={calendarClassName}
      />
    );
  } else {
    const {
      mode,
      value,
      onSelect,
      fieldError: _fieldError,
      errorStateId: _errorStateId,
      className: _className,
      ...calendarProps
    } = props;

    calendar = (
      <Calendar
        {...calendarProps}
        mode={mode}
        selected={value ?? undefined}
        required={false}
        onSelect={onSelect}
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
        <span>{formatCalendarValue(props.value)}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        {calendar}
      </PopoverContent>
    </Popover>
  );
};
