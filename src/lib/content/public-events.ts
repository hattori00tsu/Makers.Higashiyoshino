import { childEventsOf, eventLineage, getEvent, programsUnder, venueChildren, type EventItem } from "@/data/site";
import { eventsInSeries } from "@/lib/calendar";
import { loadEventRows, mapEvent } from "@/lib/content/remote";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function loadPublicEvents(): Promise<EventItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      if (supabase) {
        const rows = await loadEventRows(supabase, { publishedOnly: true });
        if (rows) return rows.map(mapEvent);
      }
    } catch {
      /* fall through */
    }
  }
  return [];
}

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
