"use client";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { EmojiPickerPopover } from "@/components/ui/emoji-picker-popover";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorities, TaskTableSelectType } from "@/db/schema";
import { mergeDateTime } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, startOfDay } from "date-fns";
import { CalendarIcon, ClockIcon, SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTaskAction, updateTaskAction } from "../actions/actions";
import { taskSchema, TaskSchemaType } from "../actions/schemas";
import { formatTaskPriority } from "../lib/formatters";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export const TaskForm = ({
  defaultDay,
  existingTask,
  afterAction,
}: {
  defaultDay?: Date;
  existingTask?: TaskTableSelectType;
  afterAction?: () => void;
}) => {
  const today = startOfDay(new Date());
  const dayToUse = defaultDay ?? today;
  const router = useRouter();
  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: existingTask
      ? {
          name: existingTask.name,
          description: existingTask.description,
          emoji: existingTask.emoji,
          priority: existingTask.priority,
          startAt: existingTask.startAt
            ? format(existingTask.startAt, "HH:mm:ss")
            : null,
          endAt: existingTask.endAt
            ? format(existingTask.endAt, "HH:mm:ss")
            : null,
          range: {
            from: parse(existingTask.day, "yyyy-MM-dd", new Date()),
            to: undefined,
          },
        }
      : {
          name: "",
          priority: "low",
          description: "",
          emoji: "",
          startAt: null,
          endAt: null,
          range: {
            from: dayToUse,
            to: undefined,
          },
        },
  });

  const handleSubmission = async (data: TaskSchemaType) => {
    const action = existingTask
      ? updateTaskAction(existingTask.id, data)
      : createTaskAction(data);
    const response = await action;
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      form.reset();
      router.refresh();
      afterAction?.();
    }
  };

  const dayValue = form.watch("range.from");

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmission)}
      className="w-full flex flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="range"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel
              htmlFor={fieldState.error && "invalid-recurring-range-input"}
            >
              Date
            </FieldLabel>
            <FieldContent>
              <Popover>
                <PopoverTrigger
                  id={fieldState.error && "invalid-recurring-range-input"}
                  aria-invalid={!!fieldState.error}
                  className="flex items-start gap-2 cursor-pointer border-b py-2"
                >
                  <CalendarIcon className="size-4 mt-0.4" />
                  {format(field.value.from, "PP")}
                  {field.value.to && `  -  ${format(field.value.to, "PP")}`}
                </PopoverTrigger>
                <PopoverContent>
                  {existingTask ? (
                    <Calendar
                      mode="single"
                      selected={field.value.from}
                      onSelect={(date) =>
                        field.onChange({ from: date, to: undefined })
                      }
                      disabled={{
                        before: today,
                      }}
                      className="bg-card! border shadow-sm"
                    />
                  ) : (
                    <Calendar
                      mode="range"
                      defaultMonth={dayToUse}
                      selected={field.value ?? undefined}
                      onSelect={(range) => {
                        const newValue: DateRange | undefined = !range
                          ? undefined
                          : !range.to || !range.from
                            ? range
                            : format(range.from, "yyyy-MM-dd") ===
                                format(range.to, "yyyy-MM-dd")
                              ? { from: range.from, to: undefined }
                              : range;
                        field.onChange(newValue);
                      }}
                      numberOfMonths={existingTask ? 1 : 2}
                      disabled={{
                        before: dayToUse,
                      }}
                      className="bg-card! border shadow-sm"
                    />
                  )}
                </PopoverContent>
              </Popover>
            </FieldContent>
            {!existingTask && (
              <FieldDescription>
                You can select either one day or multiple days to make the task
                recurring.
              </FieldDescription>
            )}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor={fieldState.error && "name-input-invalid"}>
              Name
            </FieldLabel>
            <FieldContent>
              <div className="w-full flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="emoji"
                  render={({ field }) => (
                    <Field className="w-fit">
                      <FieldContent>
                        <EmojiPickerPopover
                          onEmojiSelect={(emoji) => {
                            field.onChange(emoji.emoji);
                          }}
                        >
                          <TooltipWrapper content="Select an emoji">
                            <Button variant="ghost" size="icon-xs">
                              {field.value ? (
                                <span>{field.value}</span>
                              ) : (
                                <SmilePlusIcon className="text-foreground!" />
                              )}
                            </Button>
                          </TooltipWrapper>
                        </EmojiPickerPopover>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Input
                  placeholder="Task name goes here"
                  id={fieldState.error && "name-input-invalid"}
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
              </div>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="priority"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel
              htmlFor={fieldState.error && "task-priority-input-invalid"}
            >
              Priority
            </FieldLabel>
            <FieldContent>
              <Select value={value} onValueChange={onChange} {...props}>
                <SelectTrigger
                  id={fieldState.error && "task-priority-input-invalid"}
                  aria-invalid={!!fieldState.error}
                  className="w-full"
                >
                  <SelectValue placeholder="Select task priority">
                    <span>{formatTaskPriority(value)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {taskPriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {formatTaskPriority(priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field: { value, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel
              htmlFor={fieldState.error && "description-input-invalid"}
            >
              Description
            </FieldLabel>
            <FieldContent>
              <Textarea
                placeholder="Task details and description goes here"
                id={fieldState.error && "description-input-invalid"}
                aria-invalid={!!fieldState.error}
                value={value ?? ""}
                {...props}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="startAt"
          render={({ field: { value, onChange, ...props }, fieldState }) => {
            const mergedDateTime = value
              ? mergeDateTime(dayValue, value)
              : null;

            return (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel
                  htmlFor={fieldState.error && "start-at-input-invalid"}
                >
                  Start at
                </FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupInput
                      type="time"
                      placeholder="Select a time"
                      id={fieldState.error && "start-at-input-invalid"}
                      aria-invalid={!!fieldState.error}
                      value={value ?? ""}
                      onChange={(e) => {
                        onChange(e.target.value || null);
                      }}
                      step="1"
                      className="w-full appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      {...props}
                    />
                    <InputGroupAddon>
                      <ClockIcon />
                    </InputGroupAddon>
                  </InputGroup>
                </FieldContent>
                <FieldDescription>
                  {mergedDateTime
                    ? format(mergedDateTime, "PPpp")
                    : "No time selected"}
                </FieldDescription>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />
        <Controller
          control={form.control}
          name="endAt"
          render={({ field: { value, onChange, ...props }, fieldState }) => {
            const mergedDateTime = value
              ? mergeDateTime(dayValue, value)
              : null;

            return (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel
                  htmlFor={fieldState.error && "end-at-input-invalid"}
                >
                  End at
                </FieldLabel>
                <FieldContent>
                  <InputGroup>
                    <InputGroupInput
                      type="time"
                      placeholder="Select a time"
                      id={fieldState.error && "end-at-input-invalid"}
                      aria-invalid={!!fieldState.error}
                      value={value ?? ""}
                      onChange={(e) => {
                        onChange(e.target.value || null);
                      }}
                      step="1"
                      className="w-full appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      {...props}
                    />
                    <InputGroupAddon>
                      <ClockIcon />
                    </InputGroupAddon>
                  </InputGroup>
                </FieldContent>
                <FieldDescription>
                  {mergedDateTime
                    ? format(mergedDateTime, "PPpp")
                    : "No time selected"}
                </FieldDescription>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingTask ? "Save changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
