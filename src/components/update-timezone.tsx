"use client";

import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export const UpdateTimezone = () => {
  const router = useRouter();

  const handleUpdateTimezone = useCallback(async () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const session = await authClient.getSession();
      if (!session.data || session.error) throw new Error("Not authenticated");

      if (session.data.user.timeZone === timeZone) return;

      const response = await authClient.updateUser({
        timeZone,
      });
      if (response.error) throw new Error("Failed to update timezone.");

      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }, [router]);

  useEffect(() => {
    void handleUpdateTimezone();
  }, [handleUpdateTimezone]);

  return null;
};
