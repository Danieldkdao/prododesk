export const socialProviders = ["google", "github"] as const;
export type SocialProvider = (typeof socialProviders)[number];
