"use client";

import { Session, SessionQueryParams } from "better-auth";
import { createContext, ReactNode, useContext } from "react";
import { useAuthSession } from "./use-auth-session";
import { User } from "@/lib/auth/auth";

type AuthSyncContextType = {
  session: {
    session: Session;
    user: User;
  } | null;
  refetch: (
    queryParams?:
      | {
          query?: SessionQueryParams;
        }
      | undefined,
  ) => Promise<void>;
};

const AuthSyncContext = createContext<AuthSyncContextType | null>(null);

export const AuthSyncProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, refetch } = useAuthSession();

  const values: AuthSyncContextType = {
    session,
    refetch,
  };

  return (
    <AuthSyncContext.Provider value={values}>
      {children}
    </AuthSyncContext.Provider>
  );
};

export const useAuthSync = () => {
  const context = useContext(AuthSyncContext);
  if (!context)
    throw new Error(
      "Auth sync context must be used inside of the auth sync context provider.",
    );

  return context;
};
