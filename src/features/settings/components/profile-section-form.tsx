"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ReadUserProfileActionReturnType,
  updateUserProfileAction,
} from "../actions/actions";
import { profileSchema, ProfileSchemaType } from "../actions/schemas";

export const ProfileSectionForm = ({
  userProfile,
}: {
  userProfile: ReadUserProfileActionReturnType;
}) => {
  const router = useRouter();
  const form = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.name,
      description: userProfile.settings?.description ?? "",
      email: userProfile.email,
    },
  });

  const handleSubmission = async (data: ProfileSchemaType) => {
    const response = await updateUserProfileAction(data);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.refresh();
      form.reset();
    }
  };

  return (
    <Card className="w-full min-w-0 border">
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleSubmission)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label>Profile Picture</Label>
            <UserAvatar
              name={userProfile.name}
              image={userProfile.image}
              className="size-20"
            />
          </div>
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
                    placeholder="Enter your name"
                    {...field}
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={fieldState.error && "invalid-email-input"}>
                  Email
                </FieldLabel>
                <FieldContent>
                  <Input
                    id={fieldState.error && "invalid-email-input"}
                    aria-invalid={!!fieldState.error}
                    placeholder="Enter your email"
                    type="email"
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
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel
                  htmlFor={fieldState.error && "invalid-description-input"}
                >
                  Description
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id={fieldState.error && "invalid-description-input"}
                    aria-invalid={!!fieldState.error}
                    placeholder="Enter a short description about yourself"
                    {...field}
                  />
                </FieldContent>
                <FieldDescription>
                  This description will help our AI understand you better so it
                  can produce better output. You can include preferences, things
                  to avoid, and some general context it should know about you.
                </FieldDescription>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            <LoadingSwap isLoading={form.formState.isSubmitting}>
              Save changes
            </LoadingSwap>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
