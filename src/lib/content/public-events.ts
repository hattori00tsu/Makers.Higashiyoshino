import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { childEventsOf, eventLineage, getEvent, programsUnder, venueChildren, type EventItem } from "@/data/site";
import { eventsInSeries } from "@/lib/calendar";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { loadEventItemsForArtist, loadEventRows, mapEvent } from "@/lib/content/remote";
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

export const loadPublicEvent = unstable_cache(
  async (slug: string) => {
    if (!slug) return getEvent(slug) ?? null;
    if (!isSupabaseConfigured()) return getEvent(slug) ?? null;
    try {
      const supabase = createPublicSupabase();
      if (!supabase) return getEvent(slug) ?? null;
      const rows = await loadEventRows(supabase, { slug, publishedOnly: true });
      return rows?.[0] ? mapEvent(rows[0]) : getEvent(slug) ?? null;
    } catch (error) {
      unstable_rethrow(error);
      return getEvent(slug) ?? null;
    }
  },
  ["public-event"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: ["public-events"],
  },
);

async function fetchPublicEventsForArtist(slug: string) {
  if (!isSupabaseConfigured() || !slug) return [];
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    return (await loadEventItemsForArtist(supabase, slug, { publishedOnly: true })) ?? [];
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export const loadPublicEventsForArtist = unstable_cache(fetchPublicEventsForArtist, ["public-events-artist"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-events"],
});

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
