import {
  events as seedEvents,
  eventsManagedByArtist,
  spots as seedSpots,
  type EventItem,
  type SpotItem,
} from "@/data/site";
import {
  applicationsForUser,
  cancelOwnApplication,
  loadApplications,
  type Application,
} from "@/lib/content/applications";
import {
  deleteEvent,
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
import { forget, remember } from "@/lib/content/client-cache";
import {
  deleteRemoteEvent,
  fetchLinkableRemoteArtists,
  fetchMyRemoteApplications,
  fetchRemoteApplicationNotify,
  fetchRemoteApplications,
  fetchRemoteCounts,
  fetchRemoteEvents,
  fetchRemoteEventsBySlugs,
  fetchRemoteEventsForArtist,
  fetchRemoteNews,
  fetchRemoteNewsItem,
  fetchRemoteSpots,
  saveRemoteNews,
  saveRemoteSpots,
  cancelRemoteApplication,
  setRemoteApplicationNotify,
  upsertRemoteEvent,
} from "@/lib/content/remote";
import {
  localApplicationNotifyMap,
  setLocalApplicationNotify,
} from "@/lib/content/application-notify";
import { createLocalArtist, findLocalArtist, listLocalArtists, saveLocalDraft } from "@/lib/account/local";
import {
  createRemoteArtistForAdmin,
  fetchRemoteArtistForAdmin,
  fetchRemoteArtistsForAdmin,
  updateRemoteArtistForAdmin,
  type AdminArtistRecord,
} from "@/lib/account/remote";
import type { ArtistDraft } from "@/lib/account/types";
import { useLocalContent } from "@/lib/content/live-public";

export type { AdminArtistRecord };
export {
  addApplicationLive,
  eventsNeedingLiveSeats,
  findEventLive,
  liveSeatKey,
  publishedEventsLive,
  remainingSeatsLive,
  remainingSeatsMapLive,
  useLocalContent,
} from "@/lib/content/live-public";

const EVENTS_TTL = 15_000;

function eventsCacheKey(preview: boolean | undefined, extra = "all") {
  return `events:${preview ? "local" : "remote"}:${extra}`;
}

export async function loadEventsLive(preview?: boolean) {
  return remember(eventsCacheKey(preview), EVENTS_TTL, async () => {
    if (useLocalContent(preview)) return loadEvents();
    try {
      return (await fetchRemoteEvents()) ?? [];
    } catch {
      return [];
    }
  });
}

export async function loadEventsBySlugsLive(slugs: string[], preview?: boolean) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [] as EventItem[];
  if (useLocalContent(preview)) {
    const all = loadEvents();
    const wanted = new Set(unique);
    return all.filter((event) => wanted.has(event.slug));
  }
  try {
    return (await fetchRemoteEventsBySlugs(unique)) ?? [];
  } catch {
    return [];
  }
}

export async function loadEventsForArtistLive(
  artistSlug: string,
  preview?: boolean,
  options?: { publishedOnly?: boolean },
) {
  if (!artistSlug) return [] as EventItem[];
  const publishedOnly = options?.publishedOnly ?? false;
  return remember(
    eventsCacheKey(preview, `artist:${artistSlug}:${publishedOnly ? "pub" : "all"}`),
    EVENTS_TTL,
    async () => {
      if (useLocalContent(preview)) {
        const items = publishedOnly ? publishedEvents() : loadEvents();
        const managed = eventsManagedByArtist(artistSlug, items);
        const parents = managed
          .map((event) => event.parentSlug)
          .filter((slug): slug is string => Boolean(slug));
        const extra = items.filter((event) => parents.includes(event.slug));
        const bySlug = new Map(managed.map((event) => [event.slug, event]));
        for (const event of extra) bySlug.set(event.slug, event);
        return [...bySlug.values()];
      }
      try {
        return (await fetchRemoteEventsForArtist(artistSlug, { publishedOnly })) ?? [];
      } catch {
        return [];
      }
    },
  );
}

export async function saveEventLive(event: EventItem, previousSlug?: string, preview?: boolean) {
  if (useLocalContent(preview)) {
    upsertEvent(event, previousSlug);
    forget("events");
    return;
  }
  await upsertRemoteEvent(event, previousSlug);
  forget("events");
}

export async function deleteEventLive(slug: string, preview?: boolean) {
  if (useLocalContent(preview)) {
    deleteEvent(slug);
    forget("events");
    return;
  }
  await deleteRemoteEvent(slug);
  forget("events");
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
  try {
    return (await fetchRemoteNewsItem(slug)) ?? undefined;
  } catch {
    return undefined;
  }
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

export async function loadMyApplicationsLive(userId: string, preview?: boolean): Promise<Application[]> {
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
  const events = await loadEventsForArtistLive(artistSlug, preview);
  const slugs = eventsManagedByArtist(artistSlug, events).map((event) => event.slug);
  if (useLocalContent(preview)) {
    const wanted = new Set(slugs);
    return {
      events,
      applications: loadApplications().filter((item) => wanted.has(item.eventSlug)),
      notifyBySlug: localApplicationNotifyMap(artistSlug),
    };
  }
  try {
    const [applications, notifyBySlug] = await Promise.all([
      fetchRemoteApplications(slugs),
      fetchRemoteApplicationNotify().catch(() => ({})),
    ]);
    return {
      events,
      applications: applications ?? [],
      notifyBySlug,
    };
  } catch {
    return { events, applications: [] as Application[], notifyBySlug: {} as Record<string, boolean> };
  }
}

export async function setApplicationNotifyLive(
  artistSlug: string,
  eventSlug: string,
  notify: boolean,
  preview?: boolean,
) {
  if (useLocalContent(preview)) {
    setLocalApplicationNotify(artistSlug, eventSlug, notify);
    return;
  }
  await setRemoteApplicationNotify(eventSlug, notify);
}

export async function loadAdminCounts(preview?: boolean) {
  if (useLocalContent(preview)) {
    const [events, artists, applications] = await Promise.all([
      loadEventsLive(preview),
      loadArtistsForAdmin(preview),
      loadApplicationsLive(preview),
    ]);
    return {
      events: events.length,
      artists: artists.length,
      applications: applications.filter((item) => item.status !== "cancelled").length,
    };
  }
  try {
    return (await fetchRemoteCounts()) ?? { events: 0, artists: 0, applications: 0 };
  } catch {
    return { events: 0, artists: 0, applications: 0 };
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
  return remember(`admin-artists:${preview ? "local" : "remote"}`, 15_000, async () => {
    if (useLocalContent(preview)) return listLocalArtists();
    return fetchRemoteArtistsForAdmin();
  });
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
    forget("admin-artists");
    return;
  }
  await updateRemoteArtistForAdmin(artist, draft);
  forget("admin-artists");
  forget("artist");
}

export async function createArtistForAdmin(draft: ArtistDraft, preview?: boolean) {
  forget("admin-artists");
  if (useLocalContent(preview)) return createLocalArtist(draft);
  return createRemoteArtistForAdmin(draft);
}

export { seedEvents, seedNews, seedSpots };
export type { NewsItem };
export { loadEventOptions, saveEventOptions, loadSpotCategories, saveSpotCategories } from "@/lib/content/options";
