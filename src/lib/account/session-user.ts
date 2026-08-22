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
