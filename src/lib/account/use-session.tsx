"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { SessionUser } from "@/lib/account/types";
import { ensureLocalSeed, getLocalAccount } from "@/lib/account/local";

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<SessionUser | null>>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      let session: SessionUser | null = null;
      try {
        const response = await fetch("/api/me");
        const text = await response.text();
        if (text) {
          session = (JSON.parse(text) as { session: SessionUser | null }).session ?? null;
        }
      } catch {
        session = null;
      }
      if (session?.source === "preview") {
        ensureLocalSeed();
        const local = getLocalAccount(session.id);
        if (local) session = local.user;
      }
      if (active) {
        setUser(session);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ user, loading, setUser }), [user, loading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
