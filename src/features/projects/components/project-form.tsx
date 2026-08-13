import { ColorPicker } from "@/components/color-picker";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProjectSelectType, projectStatuses } from "@/db/schema";
import { AreaCommandSelect } from "@/features/areas/components/area-command-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, parse, subDays } from "date-fns";
import { SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProjectAction, updateProjectAction } from "../actions/actions";
import { projectSchema, ProjectSchemaType } from "../actions/schemas";
import { formatProjectStatus } from "../lib/formatters";
import { ProjectFormDefaultValues } from "../lib/types";

export const ProjectForm = ({
  existingProject,
  defaultValues,
  afterAction,
}: {
  existingProject?: ProjectSelectType;
  defaultValues?: ProjectFormDefaultValues;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const form = useForm<ProjectSchemaType>({
    resolver: zodResolver(projectSchema),
    defaultValues: existingProject
      ? {
          ...existingProject,
          icon: existingProject.icon ?? "",
          startAt: existingProject.startAt
            ? parse(existingProject.startAt, "yyyy-MM-dd", new Date())
            : undefined,
          endAt: existingProject.endAt
            ? parse(existingProject.endAt, "yyyy-MM-dd", new Date())
            : undefined,
        }
      : {
          name: "",
          outcome: "",
          areaId: undefined,
          status: "active",
          color: "cyan",
          icon: "",
          isArchived: false,
          startAt: undefined,
          endAt: undefined,
        },
  });

  const dateToUse = new Date();
  const startAtValue = form.watch("startAt");
  const endAtValue = form.watch("endAt");

  const handleProjectMutations = async (data: ProjectSchemaType) => {
    const action = existingProject
      ? updateProjectAction(existingProject.id, data)
      : createProjectAction(data);
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
      onSubmit={form.handleSubmit(handleProjectMutations)}
      className="w-full flex flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel
              htmlFor={fieldState.error && "project-name-input-invalid"}
            >
              Name
            </FieldLabel>
            <FieldContent>
              <div className="w-full flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <Field className="w-fit">
                      <FieldContent>
                        <EmojiPickerPopover
                          onEmojiSelect={(emoji) => field.onChange(emoji.emoji)}
                        >
                          <TooltipWrapper content="Select an icon">
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
                  id={fieldState.error && "project-name-input-invalid"}
                  placeholder="Enter the project name here"
                  aria-invalid={!!fieldState.error}
                  className="flex-1"
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
        name="outcome"
        render={({ field: { value, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel
              htmlFor={fieldState.error && "project-outcome-input-invalid"}
            >
              Outcome
            </FieldLabel>
            <FieldContent>
              <Textarea
                id={fieldState.error && "project-outcome-input-invalid"}
                placeholder="Enter the project outcome here"
                aria-invalid={!!fieldState.error}
                value={value ?? ""}
                {...props}
              />
            </FieldContent>
            <FieldDescription>
              Describe any details about the project, its goals, and the
              outcome.
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="status"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <Select value={value} onValueChange={onChange} {...props}>
                <SelectTrigger
                  aria-invalid={!!fieldState.error}
                  className="w-full"
                >
                  <SelectValue>
                    {value ? (
                      (() => {
                        const { text, icon: Icon } = formatProjectStatus(value);

                        return (
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            <span>{text}</span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground">
                        No status selected
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => {
                    const { text, icon: Icon } = formatProjectStatus(status);

                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span>{text}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="color"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Color</FieldLabel>
            <FieldContent>
              <ColorPicker
                value={field.value}
                onValueChange={field.onChange}
                fieldError={!!fieldState.error}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="areaId"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Area</FieldLabel>
            <FieldContent>
              <AreaCommandSelect
                initialValue={defaultValues?.area}
                value={field.value}
                onValueChange={field.onChange}
              />
            </FieldContent>
            <FieldDescription>
              Associate this project with an existing area.
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={form.control}
          name="startAt"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel
                htmlFor={fieldState.error && "invalid-project-start-at-input"}
              >
                Start at
              </FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  mode="single"
                  value={field.value}
                  fieldError={!!fieldState.error}
                  errorStateId="invalid-project-start-at-input"
                  onValueChange={(date) => field.onChange(date)}
                  disabled={{
                    before: dateToUse,
                    after: endAtValue ? subDays(endAtValue, 1) : undefined,
                  }}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="endAt"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel
                htmlFor={fieldState.error && "invalid-project-end-at-input"}
              >
                End at
              </FieldLabel>
              <FieldContent>
                <PopoverCalendar
                  mode="single"
                  value={field.value}
                  fieldError={!!fieldState.error}
                  errorStateId="invalid-project-end-at-input"
                  onValueChange={(date) => field.onChange(date)}
                  disabled={{
                    before: startAtValue ? addDays(startAtValue, 1) : dateToUse,
                  }}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="isArchived"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <label
              id="project-is-archived-input-invalid"
              className="flex flex-col gap-2 p-4 border cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                <FieldLabel
                  htmlFor={
                    fieldState.error && "project-is-archived-input-invalid"
                  }
                  onClick={() => onChange(!value)}
                >
                  Archived
                </FieldLabel>
                <Checkbox
                  id="project-is-archived-input-invalid"
                  aria-invalid={!!fieldState.error}
                  checked={value}
                  onCheckedChange={(checked) => onChange(checked)}
                  {...props}
                />
              </div>
              <FieldDescription>
                Archived projects are in a saved but non-active state. This
                project is{" "}
                <span className="text-foreground font-medium">
                  {value ? "" : "not "}archived.
                </span>
              </FieldDescription>
            </label>
          </Field>
        )}
      />
      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingProject ? "Save changes" : "Create project"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
