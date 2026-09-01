"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import { MilestoneCommandSelect } from "@/features/milestones/components/milestone-command-select";
import { ProjectCommandSelect } from "@/features/projects/components/project-command-select";
import { updateTaskAction } from "@/features/tasks/actions/actions";
import { taskSchema, TaskSchemaType } from "@/features/tasks/actions/schemas";
import { TaskPrioritySelect } from "@/features/tasks/components/task-priority-select";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, parseISO, subDays } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { TriageSuggestion } from "../lib/types";

export const TriageSuggestionEditor = ({
  triageSuggestion: { task, ...suggestion },
  onDiscard,
  onSave,
}: {
  triageSuggestion: TriageSuggestion;
  onDiscard: () => void;
  onSave: () => void;
}) => {
  const today = new Date();

  const form = useForm<TaskSchemaType>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: suggestion.suggestedName ?? task.name,
      status: suggestion.suggestedStatus ?? task.status,
      priority: suggestion.suggestedPriority ?? task.priority,
      projectId: suggestion.suggestedProjectId ?? task.projectId ?? undefined,
      milestoneId:
        suggestion.suggestedMilestoneId ?? task.milestoneId ?? undefined,
      scheduledAt: suggestion.suggestedScheduledAt
        ? parseISO(suggestion.suggestedScheduledAt)
        : undefined,
      dueAt: suggestion.suggestedDueAt
        ? parseISO(suggestion.suggestedDueAt)
        : undefined,
    },
  });

  const handleSave = async (data: TaskSchemaType) => {
    const response = await updateTaskAction(suggestion.taskId, data);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success("Task updated successfully!");
      onSave();
    }
  };

  const scheduledAtValue = form.watch("scheduledAt");
  const dueAtValue = form.watch("dueAt");

  return (
    <div className="w-full flex flex-col gap-4 min-w-0">
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field: { value, ...props }, fieldState }) => (
            <Field data-invalid={!!fieldState.error} className="col-span-2">
              <FieldLabel htmlFor="suggested-name-input" className="text-sm">
                Name
              </FieldLabel>
              <FieldContent>
                <Input
                  id="suggested-name-input"
                  aria-invalid={!!fieldState.error}
                  placeholder="Name goes here..."
                  value={value ?? ""}
                  className="text-base md:text-base"
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
              <FieldLabel htmlFor="suggested-status-input" className="text-sm">
                Status
              </FieldLabel>
              <FieldContent>
                <TaskStatusSelect
                  value={value}
                  onValueChange={onChange}
                  {...props}
                  triggerProps={{
                    id: "suggested-status-input",
                    "aria-invalid": !!fieldState.error,
                  }}
                  valueProps={{
                    className: "text-base [&_svg]:size-4.5!",
                  }}
                />
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
                htmlFor="suggested-priority-input"
                className="text-sm"
              >
                Priority
              </FieldLabel>
              <FieldContent>
                <TaskPrioritySelect
                  value={value}
                  onValueChange={onChange}
                  {...props}
                  triggerProps={{
                    id: "suggested-priority-input",
                    "aria-invalid": !!fieldState.error,
                  }}
                  valueProps={{
                    className: "text-base [&_svg]:size-4.5!",
                  }}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="projectId"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel
                htmlFor="suggested-project-id-input"
                className="text-sm"
              >
                Project
              </FieldLabel>
              <FieldContent>
                <ProjectCommandSelect
                  id="suggested-project-id-input"
                  fieldError={!!fieldState.error}
                  initialProject={suggestion.project}
                  value={field.value}
                  onValueChange={field.onChange}
                  className="text-base! [&_svg]:size-4.5!"
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
                <FieldLabel
                  htmlFor="suggested-milestone-id-input"
                  className="text-sm"
                >
                  Milestone
                </FieldLabel>
                <FieldContent>
                  <MilestoneCommandSelect
                    id="suggested-milestone-id-input"
                    fieldError={!!fieldState.error}
                    initialValue={suggestion.milestone}
                    value={field.value}
                    onValueChange={field.onChange}
                    projectId={projectIdValue}
                    triggerClassName="text-base! [&_svg]:size-4.5!"
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />
        <Controller
          control={form.control}
          name="scheduledAt"
          render={({ field: { value, onChange, ...props }, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel
                htmlFor="suggested-scheduled-at-input"
                className="text-sm"
              >
                Scheduled at
              </FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  id="suggested-scheduled-at-input"
                  fieldError={!!fieldState.error}
                  mode="single"
                  value={value}
                  onValueChange={onChange}
                  withTime
                  disabled={{
                    before: today,
                    after: dueAtValue ? subDays(dueAtValue, 1) : undefined,
                  }}
                  triggerClassName="text-base! [&_svg]:size-4.5! flex items-center"
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
              <FieldLabel htmlFor="suggested-due-at-input" className="text-sm">
                Due at
              </FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  id="suggested-due-at-input"
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
                  triggerClassName="text-base! [&_svg]:size-4.5! flex items-center"
                  {...props}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="flex items-center gap-2 justify-between">
        <Button
          variant="ghost"
          disabled={form.formState.isSubmitting}
          onClick={onDiscard}
        >
          Discard edits
        </Button>
        <Button
          type="button"
          disabled={form.formState.isSubmitting}
          onClick={() => form.handleSubmit(handleSave)()}
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            Save and continue
          </LoadingSwap>
        </Button>
      </div>
    </div>
  );
};
