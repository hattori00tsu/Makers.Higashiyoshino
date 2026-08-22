"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/account/types";
import { ensureLocalSeed, getLocalAccount } from "@/lib/account/local";

export function useSession() {
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

  return { user, loading, setUser };
}
