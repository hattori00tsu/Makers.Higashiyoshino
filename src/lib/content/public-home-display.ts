import { unstable_cache } from "next/cache";
import {
  defaultHomeDisplay,
  homeDisplayCatalogId,
  parseHomeDisplay,
  type HomeDisplay,
} from "@/lib/content/home-display";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabase } from "@/lib/supabase/server";

async function fetchPublicHomeDisplay(): Promise<HomeDisplay> {
  if (!isSupabaseConfigured()) return defaultHomeDisplay();
  const supabase = createPublicSupabase();
  if (!supabase) return defaultHomeDisplay();
  const { data, error } = await supabase
    .from("event_catalogs")
    .select("items")
    .eq("id", homeDisplayCatalogId)
    .maybeSingle();
  if (error || !data) return defaultHomeDisplay();
  return parseHomeDisplay((data as { items?: unknown }).items);
}

export const loadPublicHomeDisplay = unstable_cache(fetchPublicHomeDisplay, ["public-home-display-v4"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-home-display"],
});
