"use client";

import { createContext, useContext } from "react";
import type { User } from "@/types/domain";

// Carries the server-resolved session user into the client tree (set by the (app) layout).
const SessionContext = createContext<User | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser(): User {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("useSessionUser must be used inside <SessionProvider> (the (app) layout).");
  }
  return user;
}
