import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { childEventsOf, eventLineage, getEvent, programsUnder, venueChildren, type EventItem } from "@/data/site";
import { eventsInSeries } from "@/lib/calendar";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { loadEventRows, mapEvent } from "@/lib/content/remote";
import { createPublicSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function fetchPublicEvents(): Promise<EventItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    const rows = await loadEventRows(supabase, { publishedOnly: true });
    return rows ? rows.map(mapEvent) : [];
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export const loadPublicEvents = unstable_cache(fetchPublicEvents, ["public-events"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-events"],
});

export async function loadPublicEvent(slug: string) {
  const all = await loadPublicEvents();
  return all.find((event) => event.slug === slug) ?? getEvent(slug) ?? null;
}

export function eventViewModel(event: EventItem | null, all: EventItem[]) {
  const venues = event ? venueChildren(event.slug, all) : [];
  const programs = event ? programsUnder(event.slug, all) : [];
  const children = event ? childEventsOf(event.slug, all) : [];
  const parent = event?.parentSlug ? (all.find((item) => item.slug === event.parentSlug) ?? null) : null;
  const lineage = event ? eventLineage(event, all) : [];
  const nestedByParent = Object.fromEntries(
    venues.map((child) => [child.slug, programsUnder(child.slug, all)]),
  );
  const seriesPeers = event ? eventsInSeries(event, all) : [];
  return { programs, venues, parent, lineage, nestedByParent, children, seriesPeers };
}
