import { cache } from "react";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { getAuthIdentity } from "@/lib/supabase/identity";
import { loadSessionFromSupabase } from "@/lib/account/session-user";
import { PREVIEW_COOKIE, previewSession, type SessionUser } from "@/lib/account/types";

async function readServerSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  if (isSupabaseConfigured()) {
    try {
      if (!hasSupabaseAuthCookie(jar.getAll())) return null;
      const supabase = await createServerSupabase();
      if (!supabase) return null;
      const user = await getAuthIdentity(supabase);
      if (!user) return null;
      return loadSessionFromSupabase(supabase, user);
    } catch {
      return null;
    }
  }

  const preview = jar.get(PREVIEW_COOKIE)?.value;
  return preview ? previewSession(preview) : null;
}

export const getServerSession = cache(readServerSession);
