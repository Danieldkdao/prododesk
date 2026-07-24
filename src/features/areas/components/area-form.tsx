"use client";

import { AreaSelectType } from "@/db/schema";
import { Controller, useForm } from "react-hook-form";
import { areaSchema, AreaSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/color-picker";
import { EmojiPickerPopover } from "@/components/ui/emoji-picker-popover";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { SmilePlusIcon } from "lucide-react";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { createAreaAction, updateAreaAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const AreaForm = ({
  existingArea,
  afterAction,
}: {
  existingArea?: AreaSelectType;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const form = useForm<AreaSchemaType>({
    resolver: zodResolver(areaSchema),
    defaultValues: existingArea
      ? {
          name: existingArea.name,
          description: existingArea.description ?? "",
          icon: existingArea.icon ?? "",
          color: existingArea.color ?? "cyan",
        }
      : {
          name: "",
          description: "",
          icon: "",
          color: "cyan",
        },
  });

  const handleAreaMutations = async (data: AreaSchemaType) => {
    const action = existingArea
      ? updateAreaAction(existingArea.id, data)
      : createAreaAction(data);
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
      onSubmit={form.handleSubmit(handleAreaMutations)}
      className="w-full flex flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor={fieldState.error && "invalid-area-name-input"}>
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
                          onEmojiSelect={(emoji) => {
                            field.onChange(emoji.emoji);
                          }}
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
                  id={fieldState.error && "invalid-area-name-input"}
                  placeholder="Enter a name"
                  aria-invalid={!!fieldState.error}
                  className="flex-1 w-full"
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
        name="description"
        render={({ field: { value, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel
              htmlFor={fieldState.error && "invalid-area-description-input"}
            >
              Description
            </FieldLabel>
            <FieldContent>
              <Textarea
                id={fieldState.error && "invalid-area-description-input"}
                placeholder="Enter a description"
                aria-invalid={!!fieldState.error}
                value={value ?? ""}
                {...props}
              />
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="color"
        render={({ field: { value, onChange }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>Color</FieldLabel>
            <FieldContent>
              <ColorPicker
                value={value}
                onValueChange={onChange}
                fieldError={!!fieldState.error}
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
          {existingArea ? "Save changes" : "Create area"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
