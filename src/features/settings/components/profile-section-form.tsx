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
import { authClient } from "@/lib/auth/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmailChangeOtpDialog } from "./email-change-otp-dialog";
import {
  ReadUserProfileActionReturnType,
  updateUserSettingsAction,
} from "../actions/actions";
import { profileSchema, ProfileSchemaType } from "../actions/schemas";

export const ProfileSectionForm = ({
  userProfile,
}: {
  userProfile: ReadUserProfileActionReturnType;
}) => {
  const router = useRouter();
  const [emailChangeDialogOpen, setEmailChangeDialogOpen] = useState(false);
  const form = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.name,
      description: userProfile.settings?.description ?? "",
      email: userProfile.email,
    },
  });

  const emailValue = form.watch("email");

  const handleSubmission = async (data: ProfileSchemaType) => {
    const { name, email, description } = data;
    let errorOccurred = false;
    let otherFieldsChanged = false;
    const hasEmailChanged = email.trim() !== userProfile.email.trim();

    const promises = [];

    if (name !== userProfile.name) {
      promises.push(
        authClient.updateUser({
          name,
          fetchOptions: {
            onSuccess: () => {
              otherFieldsChanged = true;
            },
            onError: () => {
              errorOccurred = true;
            },
          },
        }),
      );
    }

    if (hasEmailChanged) {
      promises.push(
        authClient.emailOtp.requestEmailChange({
          newEmail: email,
          fetchOptions: {
            onSuccess: () => {
              setEmailChangeDialogOpen(true);
            },
            onError: () => {
              errorOccurred = true;
            },
          },
        }),
      );
    }

    if (description !== userProfile.settings?.description) {
      promises.push(
        updateUserSettingsAction({ description }).then((response) => {
          if (response.error) {
            errorOccurred = true;
          } else {
            otherFieldsChanged = true;
          }
        }),
      );
    }

    await Promise.all(promises);

    if (errorOccurred) {
      toast.error("Some changes could not be saved. Please try again.");
    } else {
      if (otherFieldsChanged) {
        toast.success("Profile updated successfully!");
        router.refresh();
        form.reset({ name, email, description });
      }
    }
  };

  return (
    <>
      <Card className="w-full min-w-0 border">
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmission)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label className="text-lg">Profile Picture</Label>
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
                  <FieldLabel className="text-base" htmlFor="profile-name-input">
                    Name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      className="text-lg md:text-lg"
                      id="profile-name-input"
                      aria-invalid={!!fieldState.error}
                      placeholder="Enter your name"
                      {...field}
                    />
                  </FieldContent>
                  {fieldState.error && (
                    <FieldError
                      className="text-lg"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel
                    className="text-base"
                    htmlFor="profile-email-input"
                  >
                    Email
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      className="text-lg md:text-lg"
                      id="profile-email-input"
                      aria-invalid={!!fieldState.error}
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                    />
                  </FieldContent>
                  {fieldState.error && (
                    <FieldError
                      className="text-lg"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel
                    className="text-base"
                    htmlFor="profile-description-input"
                  >
                    Description
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      className="text-lg md:text-lg"
                      id="profile-description-input"
                      aria-invalid={!!fieldState.error}
                      placeholder="Enter a short description about yourself"
                      {...field}
                    />
                  </FieldContent>
                  <FieldDescription className="text-lg">
                    This description will help our AI understand you better so
                    it can produce better output. You can include preferences,
                    things to avoid, or some general context it should know
                    about you. Cannot exceed 500 characters. This is optional
                    and can be left blank.
                  </FieldDescription>
                  {fieldState.error && (
                    <FieldError
                      className="text-lg"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            <Button
              type="submit"
              className="w-full text-base! h-12"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
              <LoadingSwap isLoading={form.formState.isSubmitting}>
                Save changes
              </LoadingSwap>
            </Button>
          </form>
        </CardContent>
      </Card>
      <EmailChangeOtpDialog
        open={emailChangeDialogOpen}
        setOpen={setEmailChangeDialogOpen}
        email={emailValue}
        afterEmailChange={() =>
          form.reset({
            name: form.getValues("name"),
            email: emailValue,
            description: form.getValues("description"),
          })
        }
      />
    </>
  );
};
