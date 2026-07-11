"use client";

import { VerifyAccount } from "@/components/auth/verify-account";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  PasswordInput,
  PasswordInputStrengthChecker,
} from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/auth-client";
import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaGithub, FaGoogle } from "react-icons/fa6";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter your name." }),
  email: z.email({ error: "Please enter a valid email." }),
  password: z.string().min(8, { error: "Please enter at least 8 characters." }),
});

type FormType = z.infer<typeof formSchema>;

const SignUpPage = () => {
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [isSocialSignIn, setIsSocialSignIn] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = async (data: FormType) => {
    await authClient.signUp.email({
      ...data,
      callbackURL: "/dashboard",
      fetchOptions: {
        onSuccess: async () => {
          toast.success("Account created successfully!");
          setVerifyEmail(data.email);
        },
        onError: (error) => {
          toast.error(error.error.message || GENERAL_ERROR_MESSAGE);
        },
      },
    });
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    setIsSocialSignIn(true);
    await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard",
      fetchOptions: {
        onError: (error) => {
          setIsSocialSignIn(false);
          toast.error(error.error.message || GENERAL_ERROR_MESSAGE);
        },
      },
    });
  };

  const signUpPending = form.formState.isSubmitting || isSocialSignIn;

  if (verifyEmail) {
    return <VerifyAccount email={verifyEmail} setEmail={setVerifyEmail} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 items-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-semibold text-center">Get Started</h1>
          <p className="text-base text-muted-foreground text-center">
            Enter your credentials below to continue.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignIn("google")}
            disabled={signUpPending}
          >
            <LoadingSwap isLoading={isSocialSignIn}>
              <FaGoogle />
            </LoadingSwap>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignIn("github")}
            disabled={signUpPending}
          >
            <LoadingSwap isLoading={isSocialSignIn}>
              <FaGithub />
            </LoadingSwap>
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <Separator className="flex-1" />
          <span className="text-muted-foreground">Or continue with</span>
          <Separator className="flex-1" />
        </div>

        <form
          onSubmit={form.handleSubmit(handleSignUp)}
          className="w-full space-y-4"
        >
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={fieldState.error && "name-input-invalid"}>
                  Name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Enter your name here..."
                    id={fieldState.error && "name-input-invalid"}
                    aria-invalid={!!fieldState.error}
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={fieldState.error && "email-input-invalid"}>
                  Email
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Enter your email here..."
                    id={fieldState.error && "email-input-invalid"}
                    aria-invalid={!!fieldState.error}
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel
                  htmlFor={fieldState.error && "password-input-invalid"}
                >
                  Password
                </FieldLabel>
                <FieldContent>
                  <PasswordInput
                    {...field}
                    placeholder="••••••••••••"
                    id={fieldState.error && "password-input-invalid"}
                    aria-invalid={!!fieldState.error}
                  >
                    <PasswordInputStrengthChecker />
                  </PasswordInput>
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Button type="submit" className="w-full" disabled={signUpPending}>
            <LoadingSwap isLoading={form.formState.isSubmitting}>
              Create Account
            </LoadingSwap>
          </Button>
        </form>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-muted-foreground"
        >
          Already have an account? Click here to sign in.
        </Link>
      </CardContent>
    </Card>
  );
};

export default SignUpPage;
