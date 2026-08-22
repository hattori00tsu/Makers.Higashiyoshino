import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PREVIEW_COOKIE, previewSession, type SessionUser } from "@/lib/account/types";
import { cookies } from "next/headers";

export async function getServerSession(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      if (!supabase) return null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: adminFlag } = await supabase.rpc("is_admin");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: artist } = await supabase
        .from("artists")
        .select("status, name, slug")
        .eq("profile_id", user.id)
        .maybeSingle();

      const role = adminFlag === true || profile?.role === "admin" ? "admin" : (profile?.role ?? "visitor");
      return {
        id: user.id,
        email: user.email ?? "",
        name: artist?.name || profile?.display_name || user.email || "ユーザー",
        role,
        artistStatus: artist ? (artist.status as SessionUser["artistStatus"]) : "none",
        artistSlug: artist?.slug ? String(artist.slug) : undefined,
        source: "supabase",
      };
    } catch {
      return null;
    }
  }

  const jar = await cookies();
  const preview = jar.get(PREVIEW_COOKIE)?.value;
  return preview ? previewSession(preview) : null;
}
