import {
  events as seedEvents,
  eventsManagedByArtist,
  isPublished,
  needsReservation,
  sessionCapacity,
  spots as seedSpots,
  type EventItem,
  type SpotItem,
} from "@/data/site";
import {
  addApplication,
  applicationsForUser,
  cancelOwnApplication,
  loadApplications,
  remainingSeats,
  type Application,
} from "@/lib/content/applications";
import {
  deleteEvent,
  findCatalogEvent,
  findNews,
  loadEvents,
  loadNews,
  loadSpots,
  publishedEvents,
  publishedNews,
  saveNews,
  saveSpots,
  seedNews,
  upsertEvent,
  type NewsItem,
  linkableArtists,
} from "@/lib/content/catalog";
import {
  deleteRemoteEvent,
  fetchLinkableRemoteArtists,
  fetchOccupiedSeats,
  fetchOccupiedSeatsBySlugs,
  fetchMyRemoteApplications,
  fetchRemoteApplications,
  fetchRemoteEvent,
  fetchRemoteEvents,
  fetchRemoteNews,
  fetchRemoteSpots,
  saveRemoteNews,
  saveRemoteSpots,
  cancelRemoteApplication,
  submitRemoteApplication,
  upsertRemoteEvent,
} from "@/lib/content/remote";
import { createLocalArtist, findLocalArtist, listLocalArtists, saveLocalDraft } from "@/lib/account/local";
import {
  createRemoteArtistForAdmin,
  fetchRemoteArtistForAdmin,
  fetchRemoteArtistsForAdmin,
  updateRemoteArtistForAdmin,
  type AdminArtistRecord,
} from "@/lib/account/remote";
import type { ArtistDraft } from "@/lib/account/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type { AdminArtistRecord };

export function useLocalContent(preview?: boolean) {
  return Boolean(preview) || !isSupabaseConfigured();
}

export async function loadEventsLive(preview?: boolean) {
  if (useLocalContent(preview)) return loadEvents();
  try {
    return (await fetchRemoteEvents()) ?? [];
  } catch {
    return [];
  }
}

export async function publishedEventsLive(preview?: boolean) {
  if (useLocalContent(preview)) return publishedEvents();
  const items = await loadEventsLive(preview);
  return items.filter(isPublished);
}

export async function findEventLive(slug: string, preview?: boolean) {
  if (useLocalContent(preview)) return findCatalogEvent(slug);
  try {
    return (await fetchRemoteEvent(slug)) ?? undefined;
  } catch {
    return undefined;
  }
}

export async function saveEventLive(event: EventItem, previousSlug?: string, preview?: boolean) {
  if (useLocalContent(preview)) {
    upsertEvent(event, previousSlug);
    return;
  }
  await upsertRemoteEvent(event, previousSlug);
}

export async function deleteEventLive(slug: string, preview?: boolean) {
  if (useLocalContent(preview)) {
    deleteEvent(slug);
    return;
  }
  await deleteRemoteEvent(slug);
}

export async function loadNewsLive(preview?: boolean) {
  if (useLocalContent(preview)) return loadNews();
  try {
    return (await fetchRemoteNews()) ?? [];
  } catch {
    return [];
  }
}

export async function publishedNewsLive(preview?: boolean) {
  if (useLocalContent(preview)) return publishedNews();
  return (await loadNewsLive(preview))
    .filter((item) => item.status === "published")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function findNewsLive(slug: string, preview?: boolean) {
  if (useLocalContent(preview)) return findNews(slug);
  const items = await loadNewsLive(preview);
  return items.find((item) => item.slug === slug);
}

export async function saveNewsLive(items: NewsItem[], preview?: boolean) {
  if (useLocalContent(preview)) {
    saveNews(items);
    return;
  }
  await saveRemoteNews(items);
}

export async function loadSpotsLive(preview?: boolean) {
  if (useLocalContent(preview)) return loadSpots();
  try {
    return (await fetchRemoteSpots()) ?? [];
  } catch {
    return [];
  }
}

export async function saveSpotsLive(items: SpotItem[], preview?: boolean) {
  if (useLocalContent(preview)) {
    saveSpots(items);
    return;
  }
  await saveRemoteSpots(items);
}

export async function loadApplicationsLive(preview?: boolean) {
  if (useLocalContent(preview)) return loadApplications();
  try {
    return (await fetchRemoteApplications()) ?? [];
  } catch {
    return [];
  }
}

export async function addApplicationLive(
  input: Omit<Application, "id" | "createdAt" | "status">,
  preview?: boolean,
) {
  if (useLocalContent(preview)) return addApplication(input);
  await submitRemoteApplication(input);
}

export async function loadMyApplicationsLive(userId: string, preview?: boolean) {
  if (useLocalContent(preview)) return applicationsForUser(userId);
  try {
    return (await fetchMyRemoteApplications()) ?? [];
  } catch {
    return [];
  }
}

export async function cancelApplicationLive(id: string, userId: string, preview?: boolean) {
  if (useLocalContent(preview)) {
    cancelOwnApplication(id, userId);
    return;
  }
  await cancelRemoteApplication(id);
}

export async function loadApplicationsForArtistLive(artistSlug: string, preview?: boolean) {
  const [applications, events] = await Promise.all([loadApplicationsLive(preview), loadEventsLive(preview)]);
  const slugs = new Set(eventsManagedByArtist(artistSlug, events).map((event) => event.slug));
  return {
    events,
    applications: applications.filter((item) => slugs.has(item.eventSlug)),
  };
}

export function liveSeatKey(slug: string, sessionStartsAt: string) {
  return `${slug}:${sessionStartsAt}`;
}

function sameInstant(left: string, right: string) {
  const a = Date.parse(left);
  const b = Date.parse(right);
  if (Number.isFinite(a) && Number.isFinite(b)) return a === b;
  return left === right;
}

export function eventsNeedingLiveSeats(events: EventItem[]) {
  const map = new Map<string, EventItem>();
  for (const event of events) {
    if (!needsReservation(event)) continue;
    map.set(event.slug, event);
  }
  return [...map.values()];
}

export async function remainingSeatsLive(
  slug: string,
  capacity: number | null,
  preview?: boolean,
  sessionStartsAt?: string,
) {
  if (!capacity) return null;
  if (useLocalContent(preview)) return remainingSeats(slug, capacity, sessionStartsAt);
  try {
    const taken = await fetchOccupiedSeats(slug, sessionStartsAt);
    if (taken == null) return remainingSeats(slug, capacity, sessionStartsAt);
    return Math.max(0, capacity - taken);
  } catch {
    return remainingSeats(slug, capacity, sessionStartsAt);
  }
}

export async function remainingSeatsMapLive(events: EventItem[], preview?: boolean) {
  const result: Record<string, number | null> = {};
  const targets = eventsNeedingLiveSeats(events);
  const keys: { event: EventItem; sessionStartsAt: string; capacity: number }[] = [];

  for (const event of targets) {
    for (const session of event.sessions) {
      const cap = sessionCapacity(session, event);
      if (!cap || !session.startsAt) continue;
      keys.push({ event, sessionStartsAt: session.startsAt, capacity: cap });
    }
  }

  if (keys.length === 0) return result;

  if (useLocalContent(preview)) {
    for (const item of keys) {
      result[liveSeatKey(item.event.slug, item.sessionStartsAt)] = remainingSeats(
        item.event.slug,
        item.capacity,
        item.sessionStartsAt,
      );
    }
    return result;
  }

  try {
    const rows = await fetchOccupiedSeatsBySlugs([...new Set(keys.map((item) => item.event.slug))]);
    for (const item of keys) {
      const taken =
        rows.find(
          (row) =>
            row.event_slug === item.event.slug && sameInstant(row.session_starts_at, item.sessionStartsAt),
        )?.taken ?? 0;
      result[liveSeatKey(item.event.slug, item.sessionStartsAt)] = Math.max(0, item.capacity - taken);
    }
    return result;
  } catch {
    await Promise.all(
      keys.map(async (item) => {
        try {
          const taken = await fetchOccupiedSeats(item.event.slug, item.sessionStartsAt);
          result[liveSeatKey(item.event.slug, item.sessionStartsAt)] =
            taken == null
              ? remainingSeats(item.event.slug, item.capacity, item.sessionStartsAt)
              : Math.max(0, item.capacity - taken);
        } catch {
          result[liveSeatKey(item.event.slug, item.sessionStartsAt)] = remainingSeats(
            item.event.slug,
            item.capacity,
            item.sessionStartsAt,
          );
        }
      }),
    );
    return result;
  }
}

export async function linkableArtistsLive(preview?: boolean) {
  if (useLocalContent(preview)) return linkableArtists();
  try {
    return await fetchLinkableRemoteArtists();
  } catch {
    return [];
  }
}

export async function loadArtistsForAdmin(preview?: boolean): Promise<AdminArtistRecord[]> {
  if (useLocalContent(preview)) return listLocalArtists();
  return fetchRemoteArtistsForAdmin();
}

export async function findArtistForAdmin(slugOrId: string, preview?: boolean) {
  if (useLocalContent(preview)) return findLocalArtist(slugOrId);
  return fetchRemoteArtistForAdmin(slugOrId);
}

export async function saveArtistForAdmin(
  artist: AdminArtistRecord,
  draft: ArtistDraft,
  preview?: boolean,
) {
  if (useLocalContent(preview)) {
    saveLocalDraft(artist.profileId || artist.id, draft);
    return;
  }
  await updateRemoteArtistForAdmin(artist, draft);
}

export async function createArtistForAdmin(draft: ArtistDraft, preview?: boolean) {
  if (useLocalContent(preview)) return createLocalArtist(draft);
  return createRemoteArtistForAdmin(draft);
}

export { seedEvents, seedNews, seedSpots };
export type { NewsItem };
export { loadEventOptions, saveEventOptions, loadSpotCategories, saveSpotCategories } from "@/lib/content/options";
