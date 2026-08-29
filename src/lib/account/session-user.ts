import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArtistStatus, SessionUser, UserRole } from "@/lib/account/types";

export type SessionSnapshot = {
  role?: string | null;
  display_name?: string | null;
  is_admin?: boolean | null;
  artist_status?: string | null;
  artist_slug?: string | null;
  artist_name?: string | null;
};

export function sessionFromParts(
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

export async function loadSessionFromSupabase(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<SessionUser> {
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
}
