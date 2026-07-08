"use client";

import { ComponentProps, ReactNode } from "react";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
