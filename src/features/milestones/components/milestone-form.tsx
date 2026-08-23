"use client";

import { Controller, useForm } from "react-hook-form";
import { milestoneSchema, MilestoneSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { MilestoneSelectType, milestoneStatuses } from "@/db/schema";
import { parse } from "date-fns";
import {
  createMilestoneAction,
  updateMilestoneAction,
} from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMilestoneStatus } from "../lib/formatters";
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const MilestoneForm = ({
  projectId,
  existingMilestone,
  afterAction,
}: {
  projectId: string;
  existingMilestone?: MilestoneSelectType;
  afterAction?: () => void;
}) => {
  const today = new Date();
  const router = useRouter();
  const form = useForm<MilestoneSchemaType>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: existingMilestone
      ? {
          ...existingMilestone,
          dueAt: existingMilestone.dueAt
            ? parse(existingMilestone.dueAt, "yyyy-MM-dd", new Date())
            : null,
        }
      : {
          name: "",
          description: "",
          status: "not_started",
          dueAt: null,
          projectId,
        },
  });

  const handleSubmission = async (data: MilestoneSchemaType) => {
    const action = existingMilestone
      ? updateMilestoneAction(existingMilestone.id, data)
      : createMilestoneAction(data);
    const response = await action;
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.refresh();
      afterAction?.();
    }
  };

  return (
    <form
      className="w-full flex flex-col gap-4"
      onSubmit={form.handleSubmit(handleSubmission)}
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="milestone-name-input">
              Name
            </FieldLabel>
            <FieldContent>
              <Input
                id="milestone-name-input"
                aria-invalid={!!fieldState.error}
                placeholder="Enter milestone name"
                {...field}
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
            <FieldLabel htmlFor="milestone-description-input">
              Description
            </FieldLabel>
            <FieldContent>
              <Textarea
                id="milestone-description-input"
                aria-invalid={!!fieldState.error}
                placeholder="Optional description explaining expected milestone results and outcome"
                value={value || ""}
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
          const { label, icon: Icon } = formatMilestoneStatus(value);

          return (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="milestone-status-input">
                Status
              </FieldLabel>
              <FieldContent>
                <Select value={value} onValueChange={onChange} {...props}>
                  <SelectTrigger
                    id="milestone-status-input"
                    aria-invalid={!!fieldState.error}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select a status">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5" />
                        <span>{label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {milestoneStatuses.map((status) => {
                      const { label, icon: Icon } =
                        formatMilestoneStatus(status);

                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <Icon className="size-5" />
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
        name="dueAt"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="milestone-due-at-input">Due At</FieldLabel>
            <FieldContent>
              <PopoverCalendar
                id="milestone-due-at-input"
                fieldError={!!fieldState.error}
                mode="single"
                value={value}
                onValueChange={onChange}
                disabled={{
                  before: today,
                }}
                {...props}
              />
            </FieldContent>
          </Field>
        )}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingMilestone ? "Save changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
