"use client";

import {
  createContext,
  useCallback,
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
  signOut: () => Promise<void>;
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

function withLocalPreview(session: SessionUser | null) {
  if (session?.source !== "preview") return session;
  ensureLocalSeed();
  return getLocalAccount(session.id)?.user ?? session;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function apply(session: SessionUser | null) {
      if (!active) return;
      setUser(withLocalPreview(session));
      setLoading(false);
    }

    async function refresh() {
      try {
        const session = isSupabaseConfigured() ? await loadSupabaseSession() : await loadPreviewSession();
        await apply(session);
      } catch {
        await apply(null);
      }
    }

    void refresh();

    const supabase = createBrowserSupabase();
    const { data } = supabase?.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") {
        void apply(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void refresh();
      }
    }) ?? { data: { subscription: { unsubscribe() {} } } };

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabase();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) await supabase.auth.signOut({ scope: "local" });
    }
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // 画面上のログイン状態は消す
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, setUser, signOut }), [user, loading, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
