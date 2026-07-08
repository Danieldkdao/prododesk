"use client";

import { useAuthSession } from "@/hooks/use-auth-session";
import { authClient } from "@/lib/auth/auth-client";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { SidebarFooter } from "../ui/sidebar";
import { UserAvatar } from "../user-avatar";

export const SidebarProfile = () => {
  const router = useRouter();
  const { data: session } = useAuthSession();

  return session ? (
    <SidebarFooter className="w-full min-w-0">
      <DropdownMenu>
        <DropdownMenuTrigger className="border shadow-sm p-2 hover:bg-muted transition-all duration-200">
          <div className="flex items-center gap-2 w-full min-w-0">
            <UserAvatar
              name={session.user.name}
              image={session.user.image}
              className="size-12"
            />
            <div className="flex flex-col gap-0.5 flex-1 w-full min-w-0">
              <h3 className="text-xl font-semibold truncate text-start">
                {session.user.name}
              </h3>
              <span className="text-muted-foreground truncate text-start">
                {session.user.email}
              </span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="right"
          alignOffset={20}
          className="border flex flex-col gap-2"
        >
          <div className="flex flex-col gap-0.5 items-start p-2">
            <h3 className="text-xl font-semibold text-start">
              {session.user.name}
            </h3>
            <span className="text-muted-foreground text text-start">
              {session.user.email}
            </span>
          </div>
          <Separator />
          <div className="w-full">
            <DropdownMenuItem>
              <SettingsIcon />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      toast.success("Signed out successfully!");
                      router.push("/sign-in");
                    },
                    onError: (error) => {
                      toast.error(
                        error.error.message ||
                          "Something went wrong. Please try again.",
                      );
                    },
                  },
                });
              }}
              variant="destructive"
            >
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  ) : null;
};
