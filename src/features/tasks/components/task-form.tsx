"use client";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { EmojiPickerPopover } from "@/components/ui/emoji-picker-popover";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorities, TaskSelectType, taskStatuses } from "@/db/schema";
import { ProjectCommandSelect } from "@/features/projects/components/project-command-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, subDays } from "date-fns";
import { SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTaskAction, updateTaskAction } from "../actions/actions";
import { taskSchema, TaskSchemaType } from "../actions/schemas";
import { formatTaskPriority, formatTaskStatus } from "../lib/formatters";
import { TaskFormDefaultValues } from "../lib/types";

export const TaskForm = ({
  defaultValues,
  existingTask,
  afterAction,
}: {
  defaultValues?: TaskFormDefaultValues;
  existingTask?: TaskSelectType;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: existingTask ?? {
      name: "",
      priority: defaultValues?.priority ?? "low",
      status: defaultValues?.status ?? "not_started",
      description: "",
      emoji: "",
      projectId: defaultValues?.project?.id ?? null,
      scheduledAt: defaultValues?.day ?? null,
      dueAt: null,
    },
  });

  const today = new Date();
  const scheduledAtValue = form.watch("scheduledAt");
  const dueAtValue = form.watch("dueAt");

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
        render={({ field: { value, onChange, ...props }, fieldState }) => {
          const { label, icon: Icon } = formatTaskPriority(value);

          return (
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
                      <div className="flex items-center gap-2">
                        <Icon />
                        <span>{label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {taskPriorities.map((priority) => {
                      const { label, icon: Icon } =
                        formatTaskPriority(priority);

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
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
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
      <Controller
        control={form.control}
        name="status"
        render={({ field: { value, onChange, ...props }, fieldState }) => {
          const { label, icon: Icon } = formatTaskStatus(value);

          return (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Status</FieldLabel>
              <FieldContent>
                <Select value={value} onValueChange={onChange} {...props}>
                  <SelectTrigger
                    aria-invalid={!!fieldState.error}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select a status">
                      <div className="flex items-center gap-2">
                        <Icon />
                        {label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
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
              </FieldContent>
            </Field>
          );
        }}
      />
      <Controller
        control={form.control}
        name="projectId"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Project</FieldLabel>
            <FieldContent>
              <ProjectCommandSelect
                initialProject={defaultValues?.project}
                projectId={field.value}
                onProjectIdChange={field.onChange}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="scheduledAt"
          render={({ field: { value, onChange, ...props }, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Scheduled at</FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  mode="single"
                  value={value}
                  onValueChange={onChange}
                  withTime
                  disabled={{
                    before: today,
                    after: dueAtValue ? subDays(dueAtValue, 1) : undefined,
                  }}
                  {...props}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="dueAt"
          render={({ field: { value, onChange, ...props }, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Due at</FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  mode="single"
                  value={value}
                  onValueChange={onChange}
                  disabled={{
                    before: scheduledAtValue
                      ? addDays(scheduledAtValue, 1)
                      : today,
                  }}
                  withTime
                  {...props}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
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
