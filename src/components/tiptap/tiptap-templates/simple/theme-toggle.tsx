"use client";

// --- UI Primitives ---
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap/tiptap-icons/moon-star-icon";
import { SunIcon } from "@/components/tiptap/tiptap-icons/sun-icon";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeToggle() {
  const isMounted = useIsMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  if (!isMounted || !resolvedTheme) return null;

  const toggleDarkMode = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      variant="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  );
}
