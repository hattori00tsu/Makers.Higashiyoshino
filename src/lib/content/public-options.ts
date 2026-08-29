import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  defaultEventOptions,
  eventOptionCatalogIds,
  optionsFromCatalogRows,
  type EventOptions,
} from "@/lib/content/options";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabase } from "@/lib/supabase/server";

async function fetchPublicEventOptions(): Promise<EventOptions> {
  if (!isSupabaseConfigured()) return defaultEventOptions();
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return defaultEventOptions();
    const { data, error } = await supabase
      .from("event_catalogs")
      .select("id, items")
      .in("id", [...eventOptionCatalogIds]);
    if (error || !data?.length) return defaultEventOptions();
    return optionsFromCatalogRows(data as { id: string; items: unknown }[]);
  } catch (error) {
    unstable_rethrow(error);
    return defaultEventOptions();
  }
}

export const loadPublicEventOptions = unstable_cache(fetchPublicEventOptions, ["public-event-options"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-event-options"],
});
