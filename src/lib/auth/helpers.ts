import { headers } from "next/headers";
import { auth } from "./auth";

export const getCurrentUser = async ({ allData = false } = {}) => {
  const session = await auth.api.getSession({ headers: await headers() });

  return {
    userId: session?.user.id ?? null,
    user: allData ? (session ?? null) : null,
  };
};
