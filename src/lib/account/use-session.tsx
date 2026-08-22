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
import { sessionFromParts, type SessionSnapshot } from "@/lib/account/session-user";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAuthIdentity } from "@/lib/supabase/identity";

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  setUser: Dispatch<SetStateAction<SessionUser | null>>;
};

const SessionContext = createContext<SessionState | null>(null);

async function loadPreviewSession(): Promise<SessionUser | null> {
  const response = await fetch("/api/me");
  const text = await response.text();
  if (!text) return null;
  return (JSON.parse(text) as { session: SessionUser | null }).session ?? null;
}

async function loadSupabaseSession(): Promise<SessionUser | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const identity = await getAuthIdentity(supabase);
  if (!identity) return null;
  const { data: snapshot, error } = await supabase.rpc("session_snapshot");
  if (!error && snapshot && typeof snapshot === "object") {
    return sessionFromParts(identity, snapshot as SessionSnapshot);
  }
  return sessionFromParts(identity, {});
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      let session: SessionUser | null = null;
      try {
        session = isSupabaseConfigured() ? await loadSupabaseSession() : await loadPreviewSession();
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
