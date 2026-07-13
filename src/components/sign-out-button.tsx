"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export const SignOutButton = ({
  children,
  onClick,
  ...props
}: { children?: ReactNode } & ComponentProps<typeof Button>) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully!");
          router.push("/sign-in");
        },
        onError: (error) => {
          toast.error(
            error.error.message || "Something went wrong. Please try again.",
          );
        },
      },
    });
  };

  return (
    <Button onClick={handleSignOut} {...props}>
      {children}
    </Button>
  );
};
