import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PREVIEW_COOKIE, previewSession, type ArtistStatus, type SessionUser, type UserRole } from "@/lib/account/types";
import { cookies } from "next/headers";

type SessionSnapshot = {
  role?: string | null;
  display_name?: string | null;
  is_admin?: boolean | null;
  artist_status?: string | null;
  artist_slug?: string | null;
  artist_name?: string | null;
};

function sessionFromParts(
  user: { id: string; email?: string | null },
  snapshot: SessionSnapshot,
): SessionUser {
  const role: UserRole =
    snapshot.is_admin === true || snapshot.role === "admin" ? "admin" : ((snapshot.role as UserRole) ?? "visitor");
  return {
    id: user.id,
    email: user.email ?? "",
    name: snapshot.artist_name || snapshot.display_name || user.email || "ユーザー",
    role,
    artistStatus: snapshot.artist_status ? (snapshot.artist_status as ArtistStatus) : "none",
    artistSlug: snapshot.artist_slug ? String(snapshot.artist_slug) : undefined,
    source: "supabase",
  };
}

export async function getServerSession(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      if (!supabase) return null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  const jar = await cookies();
  const preview = jar.get(PREVIEW_COOKIE)?.value;
  return preview ? previewSession(preview) : null;
}