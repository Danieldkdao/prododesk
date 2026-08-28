"use client";

import { useAuthSync } from "@/hooks/use-auth-sync-provider";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { authClient } from "@/lib/auth/auth-client";
import {
  CheckIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { UserAvatar } from "../user-avatar";

const themes = [
  { label: "Light", theme: "light", icon: SunIcon },
  { label: "Dark", theme: "dark", icon: MoonIcon },
  {
    label: "System",
    theme: "system",
    icon: LaptopIcon,
  },
];

export const UserProfile = () => {
  const router = useRouter();
  const { session } = useAuthSync();
  const isMounted = useIsMounted();
  const { setTheme, resolvedTheme, theme } = useTheme();

  const activeTheme = theme == "system" ? theme : (resolvedTheme ?? theme);
  const selectedTheme = themes.find((theme) => theme.theme === activeTheme);

  if (!isMounted || !activeTheme || !session || !selectedTheme) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="border shadow-sm p-2 hover:bg-muted dark:hover:bg-muted/20 transition-all duration-200"
        render={
          <Button variant="ghost" size="icon-sm">
            <UserAvatar
              name={session.user.name}
              image={session.user.image}
              profileImageKey={session.user.profileImageKey}
              className="size-8"
            />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="border flex flex-col gap-2 w-auto!"
      >
        <div className="flex gap-2 items-center p-2">
          <UserAvatar
            name={session.user.name}
            image={session.user.image}
            profileImageKey={session.user.profileImageKey}
            className="size-12"
          />
          <div className="flex flex-col items-start">
            <h3 className="text-lg font-semibold text-start">
              {session.user.name}
            </h3>
            <span className="text-muted-foreground text text-start">
              {session.user.email}
            </span>
          </div>
        </div>
        <Separator />
        <div className="w-full">
          <DropdownMenuItem
            render={
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2"
              >
                <SettingsIcon />
                Settings
              </Link>
            }
          ></DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <selectedTheme.icon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {themes.map((theme) => (
                  <DropdownMenuItem
                    key={theme.theme}
                    onClick={() => setTheme(theme.theme)}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <theme.icon />
                      <span>{theme.label}</span>
                    </div>
                    {theme.theme === selectedTheme.theme && <CheckIcon />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
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
  );
};
