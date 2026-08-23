import { SocialProvider } from "./constants";
import { Github, Google } from "@lobehub/icons";

export const formatSocialProvider = (provider: SocialProvider) => {
  switch (provider) {
    case "github":
      return {
        label: "GitHub",
        icon: Github,
        color: Github.colorPrimary,
        survivesDarkMode: false,
      };
    case "google":
      return {
        label: "Google",
        icon: Google.Color,
        survivesDarkMode: true,
      };
    default:
      throw new Error(`Unknown social provider: ${provider satisfies never}`);
  }
};
