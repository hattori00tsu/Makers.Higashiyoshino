import { createServerSupabase } from "@/lib/supabase/server";

export async function artistRecipientsForEvent(slug?: string) {
  const supabase = slug ? await createServerSupabase() : null;
  if (!supabase || !slug) return [];
  const { data } = await supabase.rpc("artist_emails_for_event", { p_slug: slug });
  return ((data as { email?: string; name?: string }[] | null) ?? []).filter(
    (artist): artist is { email: string; name?: string } => Boolean(artist.email),
  );
}
