"use client";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { taskPriorities, TaskTableSelectType } from "@/db/schema";
import { mergeDateTime } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTaskAction, updateTaskAction } from "../actions/actions";
import { taskSchema, TaskSchemaType } from "../actions/schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTaskPriority } from "../lib/formatters";

export const TaskForm = ({
  day,
  existingTask,
  afterAction,
}: {
  day: Date;
  existingTask?: TaskTableSelectType;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: existingTask
      ? {
          ...existingTask,
          startAt: existingTask.startAt
            ? format(existingTask.startAt, "HH:mm:ss")
            : null,
          endAt: existingTask.endAt
            ? format(existingTask.endAt, "HH:mm:ss")
            : null,
          day,
        }
      : {
          name: "",
          priority: "low",
          description: "",
          emoji: "",
          startAt: null,
          endAt: null,
          day,
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

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmission)}
      className="w-full flex flex-col gap-4"
    >
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
            const mergedDateTime = value ? mergeDateTime(day, value) : null;

            return (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel
                  htmlFor={fieldState.error && "start-at-input-invalid"}
                >
                  Start at
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="time"
                    placeholder="Select a time"
                    id={fieldState.error && "start-at-input-invalid"}
                    aria-invalid={!!fieldState.error}
                    value={value ?? ""}
                    onChange={onChange}
                    step="1"
                    className="w-full appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    {...props}
                  />
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
            const mergedDateTime = value ? mergeDateTime(day, value) : null;

            return (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel
                  htmlFor={fieldState.error && "end-at-input-invalid"}
                >
                  End at
                </FieldLabel>
                <FieldContent>
                  <Input
                    type="time"
                    placeholder="Select a time"
                    id={fieldState.error && "end-at-input-invalid"}
                    aria-invalid={!!fieldState.error}
                    value={value ?? ""}
                    onChange={(e) => {
                      onChange(e.target.value);
                      console.log(e.target.value);
                    }}
                    step="1"
                    className="w-full appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    {...props}
                  />
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
