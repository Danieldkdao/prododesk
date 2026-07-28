import { headers } from "next/headers";
import { auth } from "./auth";

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  return {
    userId: session?.user.id ?? null,
    user: session?.user ?? null,
  };
};
