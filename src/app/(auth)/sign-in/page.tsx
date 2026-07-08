"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaGithub } from "react-icons/fa6";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getInputErrorStyle } from "@/lib/utils";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import Link from "next/link";
import { useAuthSession } from "@/hooks/use-auth-session";
import { VerifyAccount } from "@/components/auth/verify-account";

const formSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }),
  password: z.string().min(8, { error: "Please enter at least 8 characters." }),
});

type FormType = z.infer<typeof formSchema>;

const SignInPage = () => {
  const { data: session } = useAuthSession();
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [isSocialSignIn, setIsSocialSignIn] = useState(false);
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (session?.user && !session.user.emailVerified) {
      authClient.emailOtp
        .sendVerificationOtp({
          email: session.user.email,
          type: "email-verification",
        })
        .finally(() => setVerifyEmail(session.user.email));
    }
  }, []);

  const handleSignIn = async (data: FormType) => {
    await authClient.signIn.email({
      ...data,
      callbackURL: "/dashboard",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Authentication successful!");
        },
        onError: async (error) => {
          console.error(error);
          if (error.error.code === "EMAIL_NOT_VERIFIED") {
            setVerifyEmail(data.email);
            toast.error("Please verify your email to continue.");
            await authClient.emailOtp.sendVerificationOtp({
              email: data.email,
              type: "email-verification",
            });
            return;
          }
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

  const signInPending = form.formState.isSubmitting || isSocialSignIn;

  if (verifyEmail) {
    return <VerifyAccount email={verifyEmail} setEmail={setVerifyEmail} />;
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 items-center">
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-3xl font-semibold text-center">Welcome Back</h1>
          <p className="text-base text-muted-foreground text-center">
            Good to see you again! Enter your credentials to continue.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignIn("google")}
            disabled={signInPending}
          >
            <LoadingSwap isLoading={isSocialSignIn}>
              <FaGoogle />
            </LoadingSwap>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignIn("github")}
            disabled={signInPending}
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
          onSubmit={form.handleSubmit(handleSignIn)}
          className="w-full space-y-4"
        >
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    placeholder="Enter your email here..."
                    className={getInputErrorStyle(fieldState.error)}
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
              <Field>
                <FieldLabel>Password</FieldLabel>
                <FieldContent>
                  <PasswordInput
                    {...field}
                    placeholder="••••••••••••"
                    className={getInputErrorStyle(fieldState.error)}
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Button type="submit" className="w-full" disabled={signInPending}>
            <LoadingSwap isLoading={form.formState.isSubmitting}>
              Sign in
            </LoadingSwap>
          </Button>
        </form>
        <Link
          href="/sign-up"
          className="text-sm font-medium text-muted-foreground"
        >
          Don&apos;t have an account? Click here to sign up.
        </Link>
      </CardContent>
    </Card>
  );
};

export default SignInPage;
