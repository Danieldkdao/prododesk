import { useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth/auth-client";

export const useAuthSession = () => {
  return useSyncExternalStore(
    (callback) => authClient.useSession.subscribe(() => callback()),
    () => authClient.useSession.get(),
    () => authClient.useSession.get(),
  );
};
