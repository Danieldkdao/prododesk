"use client";

import { Controller, useForm } from "react-hook-form";
import { chatSchema, ChatSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { ChatTableSelectType } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { updateChatAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const UpdateChatForm = ({
  existingChat,
  afterAction,
}: {
  existingChat: ChatTableSelectType;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const form = useForm<ChatSchemaType>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      name: existingChat.name,
    },
  });

  const handleSubmission = async (data: ChatSchemaType) => {
    const response = await updateChatAction(existingChat.id, data);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      afterAction?.();
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
            <FieldLabel htmlFor={fieldState.error && "invalid-name-input"}>
              Name
            </FieldLabel>
            <FieldContent>
              <Input
                id={fieldState.error && "invalid-name-input"}
                aria-invalid={!!fieldState.error}
                placeholder="Enter chat name"
                {...field}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          Save changes
        </LoadingSwap>
      </Button>
    </form>
  );
};
