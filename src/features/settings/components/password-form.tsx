import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  PasswordInput,
  PasswordInputStrengthChecker,
} from "@/components/ui/password-input";
import { authClient } from "@/lib/auth/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { setPasswordAction } from "../actions/actions";
import { getPasswordSchema, PasswordSchemaType } from "../actions/schemas";

export const PasswordForm = ({
  hasPasswordAccount,
  afterAction,
}: {
  hasPasswordAccount: boolean;
  afterAction?: () => void;
}) => {
  const queryClient = useQueryClient();
  const form = useForm<PasswordSchemaType>({
    resolver: zodResolver(getPasswordSchema(hasPasswordAccount)),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const handleSubmission = async (data: PasswordSchemaType) => {
    const { currentPassword, newPassword } = data;

    if (hasPasswordAccount) {
      if (!currentPassword || !newPassword)
        return toast.error(
          "Please fill in both current and new password fields.",
        );
      if (currentPassword.trim() === newPassword.trim())
        return toast.error(
          "New password cannot be the same as the current password.",
        );
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        toast.error(
          error.message || "Failed to change password. Please try again.",
        );
        return;
      }

      toast.success("Password changed successfully.");
    } else {
      if (!newPassword) return toast.error("Please enter a new password.");

      const response = await setPasswordAction(newPassword);
      if (response.error) {
        toast.error(
          response.message || "Failed to set password. Please try again.",
        );
        return;
      } else {
        toast.success(response.message || "Password set successfully.");
      }
      void queryClient.invalidateQueries({ queryKey: ["socials"] });
    }
    form.reset();
    afterAction?.();
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmission)}
      className="flex flex-col gap-4"
    >
      {hasPasswordAccount && (
        <Controller
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="current-password-input">
                Current Password
              </FieldLabel>
              <FieldContent>
                <PasswordInput
                  id="current-password-input"
                  aria-invalid={!!fieldState.error}
                  placeholder="Enter your current password"
                  {...field}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
      <Controller
        control={form.control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="new-password-input">
              New Password
            </FieldLabel>
            <FieldContent>
              <PasswordInput
                id="new-password-input"
                aria-invalid={!!fieldState.error}
                placeholder="Enter your new password"
                {...field}
              >
                <PasswordInputStrengthChecker />
              </PasswordInput>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {hasPasswordAccount ? "Save Password" : "Set Password"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
