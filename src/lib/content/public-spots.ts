import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { normalizeSpot, type SpotItem } from "@/data/site";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { createPublicSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function fetchPublicSpots(): Promise<SpotItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from("spots").select("*");
    if (error || !data) return [];
    return data.map((row) => normalizeSpot(row));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export const loadPublicSpots = unstable_cache(fetchPublicSpots, ["public-spots"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-spots"],
});
