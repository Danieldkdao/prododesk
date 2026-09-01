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
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import { Textarea } from "@/components/ui/textarea";
import { TaskSelectType } from "@/db/schema";
import { MilestoneCommandSelect } from "@/features/milestones/components/milestone-command-select";
import { ProjectCommandSelect } from "@/features/projects/components/project-command-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, subDays } from "date-fns";
import { SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTaskAction, updateTaskAction } from "../actions/actions";
import { taskSchema, TaskSchemaType } from "../actions/schemas";
import { TaskFormDefaultValues } from "../lib/types";
import { TaskPrioritySelect } from "./task-priority-select";
import { TaskStatusSelect } from "./task-status-select";

export const TaskForm = ({
  defaultValues,
  existingTask,
  afterAction,
}: {
  defaultValues?: TaskFormDefaultValues;
  existingTask?: TaskSelectType;
  afterAction?: () => void | Promise<void>;
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
      milestoneId: defaultValues?.milestone?.id ?? null,
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
      await afterAction?.();
      router.refresh();
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
            <FieldLabel htmlFor="task-name-input">Name</FieldLabel>
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
                  id="task-name-input"
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
            <FieldLabel htmlFor="task-priority-input">Priority</FieldLabel>
            <FieldContent>
              <TaskPrioritySelect
                value={value}
                onValueChange={onChange}
                {...props}
                triggerProps={{
                  id: "task-priority-input",
                  "aria-invalid": !!fieldState.error,
                }}
              />
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
            <FieldLabel htmlFor="task-description-input">
              Description
            </FieldLabel>
            <FieldContent>
              <Textarea
                placeholder="Task details and description goes here"
                id="task-description-input"
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
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="task-status-input">Status</FieldLabel>
            <FieldContent>
              <TaskStatusSelect
                value={value}
                onValueChange={onChange}
                {...props}
                triggerProps={{
                  id: "task-status-input",
                  "aria-invalid": !!fieldState.error,
                }}
              />
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="projectId"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="task-project-input">Project</FieldLabel>
            <FieldContent>
              <ProjectCommandSelect
                id="task-project-input"
                fieldError={!!fieldState.error}
                initialProject={defaultValues?.project}
                value={field.value}
                onValueChange={field.onChange}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="milestoneId"
        render={({ field, fieldState }) => {
          const projectIdValue = form.watch("projectId");

          return (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="task-milestone-input">Milestone</FieldLabel>
              <FieldContent>
                <MilestoneCommandSelect
                  id="task-milestone-input"
                  fieldError={!!fieldState.error}
                  initialValue={defaultValues?.milestone}
                  value={field.value}
                  onValueChange={field.onChange}
                  projectId={projectIdValue}
                />
              </FieldContent>
              <FieldDescription>
                Only enabled when you have a project ID selected.
              </FieldDescription>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="scheduledAt"
          render={({ field: { value, onChange, ...props }, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="task-scheduled-at-input">
                Scheduled at
              </FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  id="task-scheduled-at-input"
                  fieldError={!!fieldState.error}
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
              <FieldLabel htmlFor="task-due-at-input">Due at</FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  id="task-due-at-input"
                  fieldError={!!fieldState.error}
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
