"use client";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import { MilestoneCommandSelect } from "@/features/milestones/components/milestone-command-select";
import { ProjectCommandSelect } from "@/features/projects/components/project-command-select";
import { TaskPrioritySelect } from "@/features/tasks/components/task-priority-select";
import { TaskStatusSelect } from "@/features/tasks/components/task-status-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, formatISO, parseISO, subDays } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import {
  triageSuggestionFieldsSchema,
  TriageSuggestionFieldsSchemaType,
} from "../actions/schemas";
import { TriageSuggestion } from "../lib/types";

export const TriageSuggestionEditor = ({
  triageSuggestion: { task, ...suggestion },
}: {
  triageSuggestion: TriageSuggestion;
}) => {
  const today = new Date();

  const form = useForm<TriageSuggestionFieldsSchemaType>({
    resolver: zodResolver(triageSuggestionFieldsSchema),
    defaultValues: {
      suggestedName: suggestion.suggestedName ?? task.name,
      suggestedStatus: suggestion.suggestedStatus ?? task.status,
      suggestedPriority: suggestion.suggestedPriority ?? task.priority,
      suggestedProjectId:
        suggestion.suggestedProjectId ?? task.projectId ?? undefined,
      suggestedMilestoneId:
        suggestion.suggestedMilestoneId ?? task.milestoneId ?? undefined,
      suggestedScheduledAt:
        suggestion.suggestedScheduledAt ??
        (task.scheduledAt ? formatISO(task.scheduledAt) : undefined),
      suggestedDueAt:
        suggestion.suggestedDueAt ??
        (task.dueAt ? formatISO(task.dueAt) : undefined),
    },
  });

  const handleSave = async (data: TriageSuggestionFieldsSchemaType) => {
    console.log(data);
  };

  const suggestedScheduledAtValue = form.watch("suggestedScheduledAt");
  const suggestedDueAtValue = form.watch("suggestedDueAt");

  return (
    <div className="grid grid-cols-2 gap-4">
      <Controller
        control={form.control}
        name="suggestedName"
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
        name="suggestedStatus"
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
        name="suggestedPriority"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="suggested-priority-input" className="text-sm">
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
        name="suggestedProjectId"
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
        name="suggestedMilestoneId"
        render={({ field, fieldState }) => {
          const projectIdValue = form.watch("suggestedProjectId");

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
        name="suggestedScheduledAt"
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
                value={value ? parseISO(value) : undefined}
                onValueChange={onChange}
                withTime
                disabled={{
                  before: today,
                  after: suggestedDueAtValue
                    ? subDays(suggestedDueAtValue, 1)
                    : undefined,
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
        name="suggestedDueAt"
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
                value={value ? parseISO(value) : undefined}
                onValueChange={onChange}
                disabled={{
                  before: suggestedScheduledAtValue
                    ? addDays(suggestedScheduledAtValue, 1)
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
  );
};
