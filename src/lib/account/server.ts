import { cache } from "react";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { getAuthIdentity } from "@/lib/supabase/identity";
import { sessionFromParts, type SessionSnapshot } from "@/lib/account/session-user";
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

      const { data: snapshot, error } = await supabase.rpc("session_snapshot");
      if (!error && snapshot && typeof snapshot === "object") {
        return sessionFromParts(user, snapshot as SessionSnapshot);
      }

      const [{ data: adminFlag }, { data: profile }, { data: artist }] = await Promise.all([
        supabase.rpc("is_admin"),
        supabase.from("profiles").select("role, display_name").eq("id", user.id).maybeSingle(),
        supabase.from("artists").select("status, name, slug").eq("profile_id", user.id).maybeSingle(),
      ]);

      return sessionFromParts(user, {
        role: profile?.role,
        display_name: profile?.display_name,
        is_admin: adminFlag === true,
        artist_status: artist?.status,
        artist_slug: artist?.slug,
        artist_name: artist?.name,
      });
    } catch {
      return null;
    }
  }

  const preview = jar.get(PREVIEW_COOKIE)?.value;
  return preview ? previewSession(preview) : null;
}

export const getServerSession = cache(readServerSession);
