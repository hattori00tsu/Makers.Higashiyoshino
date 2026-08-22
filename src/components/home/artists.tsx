import { loadPublicArtists } from "@/lib/content/public-artists";
import {
  arrangeHomeArtists,
  defaultHomeDisplay,
  homeDisplayCatalogId,
  parseHomeDisplay,
} from "@/lib/content/home-display";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ArtistGridView } from "@/components/home/artist-grid-view";

async function loadHomeDisplayServer() {
  if (!isSupabaseConfigured()) return defaultHomeDisplay();
  const supabase = await createServerSupabase();
  if (!supabase) return defaultHomeDisplay();
  const { data, error } = await supabase
    .from("event_catalogs")
    .select("items")
    .eq("id", homeDisplayCatalogId)
    .maybeSingle();
  if (error || !data) return defaultHomeDisplay();
  return parseHomeDisplay((data as { items?: unknown }).items);
}

export async function ArtistGrid() {
  const [artists, display] = await Promise.all([loadPublicArtists(), loadHomeDisplayServer()]);

  return (
    <ArtistGridView
      artists={arrangeHomeArtists(artists, display)}
      shuffleOnLoad={display.artistsMode === "random"}
    />
  );
}
