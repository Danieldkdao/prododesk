"use client";

import { authClient } from "@/lib/auth/auth-client";
import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import { SetterType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Card, CardContent } from "../ui/card";
import { Field, FieldContent, FieldError } from "../ui/field";
import { OTPInput } from "../otp-input";
import { Button } from "../ui/button";
import { LoadingSwap } from "../ui/loading-swap";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  otp: z.string().length(6, { error: "OTP must be 6 characters long." }),
});

type FormType = z.infer<typeof formSchema>;

type VerifyAccountProps = {
  email: string;
  setEmail: SetterType<string | null>;
};

export const VerifyAccount = ({ email, setEmail }: VerifyAccountProps) => {
  const router = useRouter();
  const [timeToResend, setTimeToResend] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (timeToResend <= 0) return;
    const interval = setInterval(() => {
      if (timeToResend <= 0) return;
      setTimeToResend((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeToResend]);

  const handleVerification = async (data: FormType) => {
    await authClient.emailOtp.verifyEmail({
      email,
      ...data,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Account verified successfully!");
          router.push("/dashboard");
        },
        onError: (error) => {
          toast.error(error.error.message || GENERAL_ERROR_MESSAGE);
        },
      },
    });
  };

  const handleResend = async () => {
    if (timeToResend > 0 || isResending) return;
    setIsResending(true);
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
      fetchOptions: {
        onSuccess: () => {
          setTimeToResend(30);
          toast.success("OTP email resent successfully!");
        },
        onError: (error) => {
          toast.error(error.error.message || GENERAL_ERROR_MESSAGE);
        },
      },
    });
    setIsResending(false);
  };

  const handleBack = () => {
    setEmail(null);
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 items-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-semibold text-center">Verify Account</h1>
          <p className="text-base text-muted-foreground text-center">
            We have sent a 6-digit verification code to{" "}
            <span className="font-semibold">{email}</span>. Enter the code below
            to verify your email.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(handleVerification)}
          className="space-y-4 w-full"
        >
          <Controller
            name="otp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldContent>
                  <OTPInput {...field} />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Button
            className="w-full"
            type="submit"
            disabled={isResending || form.formState.isSubmitting}
          >
            <LoadingSwap isLoading={form.formState.isSubmitting}>
              Continue
            </LoadingSwap>
          </Button>
        </form>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Didn&apos;t receive a code?
          </span>
          <Button
            variant="ghost"
            className="tabular-nums"
            disabled={
              form.formState.isSubmitting || timeToResend > 0 || isResending
            }
            onClick={handleResend}
          >
            <LoadingSwap isLoading={isResending}>
              {timeToResend > 0
                ? `Resend (${timeToResend.toString().padStart(2, "0")})`
                : "Resend"}
            </LoadingSwap>
          </Button>
        </div>
        <Button className="w-full" variant="outline" onClick={handleBack}>
          Change email
        </Button>
      </CardContent>
    </Card>
  );
};
