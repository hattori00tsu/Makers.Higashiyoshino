import { unstable_rethrow } from "next/navigation";
import { normalizeSpot, type SpotItem } from "@/data/site";
import { createPublicSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadPublicSpots(): Promise<SpotItem[]> {
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
