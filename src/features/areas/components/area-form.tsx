"use client";

import { ColorPicker } from "@/components/color-picker";
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
import { Textarea } from "@/components/ui/textarea";
import { AreaSelectType } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createAreaAction, updateAreaAction } from "../actions/actions";
import { areaSchema, AreaSchemaType } from "../actions/schemas";

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
            <FieldLabel htmlFor="area-name-input">
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
                  id="area-name-input"
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
            <FieldLabel htmlFor="area-description-input">
              Description
            </FieldLabel>
            <FieldContent>
              <Textarea
                id="area-description-input"
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
            <FieldLabel htmlFor="area-color-input">Color</FieldLabel>
            <FieldContent>
              <ColorPicker
                id="area-color-input"
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
