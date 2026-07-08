"use client";

import { useIsMounted } from "@/hooks/use-is-mounted";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { ComponentProps } from "react";

export const ThemeToggle = (props: ComponentProps<typeof Button>) => {
  const isMounted = useIsMounted();
  const { setTheme, resolvedTheme, theme } = useTheme();

  const activeTheme = theme == "system" ? theme : (resolvedTheme ?? theme);

  if (!isMounted || !activeTheme) return null;

  const themes = [
    { label: "Light", theme: "light", icon: SunIcon },
    { label: "Dark", theme: "dark", icon: MoonIcon },
    {
      label: "System",
      theme: "system",
      icon: LaptopIcon,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" {...props}>
            {activeTheme === "system" ? (
              <LaptopIcon />
            ) : activeTheme === "dark" ? (
              <MoonIcon />
            ) : (
              <SunIcon />
            )}
          </Button>
        }
      />
      <DropdownMenuContent>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.theme}
            onClick={() => setTheme(theme.theme)}
          >
            <theme.icon />
            <span>{theme.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
