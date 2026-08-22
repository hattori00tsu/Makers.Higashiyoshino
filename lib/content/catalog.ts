import {
  artists,
  events as seedEvents,
  isPublished,
  isTopLevel,
  childEventsOf,
  eventsForArtist,
  normalizeEvent,
  normalizeSpot,
  spots as seedSpots,
  validParentCandidates,
  type EventItem,
  type SpotItem,
} from "@/data/site";
import { listLocalAccounts } from "@/lib/account/local";

const EVENTS_KEY = "hy-events-v8";
const NEWS_KEY = "hy-news-v3";
const SPOTS_KEY = "hy-spots-v3";

export type NewsItem = {
  slug: string;
  title: string;
  body: string;
  publishedAt: string;
  status: "draft" | "published";
};

export const seedNews: NewsItem[] = [];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
  window.localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadEvents(): EventItem[] {
  return readJson<Record<string, unknown>[]>(EVENTS_KEY, seedEvents as unknown as Record<string, unknown>[]).map(
    (item) => normalizeEvent(item),
  );
}

export function saveEvents(items: EventItem[]) {
  writeJson(EVENTS_KEY, items);
}

export function publishedEvents() {
  return loadEvents().filter(isPublished);
}

export function publishedTopLevel() {
  return publishedEvents().filter(isTopLevel);
}

export function catalogChildren(parentSlug: string) {
  return childEventsOf(parentSlug, loadEvents());
}

export function findCatalogEvent(slug: string) {
  return loadEvents().find((event) => event.slug === slug);
}

export function upsertEvent(next: EventItem, previousSlug?: string) {
  const parentSlug = next.parentSlug && next.parentSlug !== next.slug ? next.parentSlug : undefined;
  let items = loadEvents().filter(
    (event) => event.slug !== next.slug && event.slug !== previousSlug,
  );
  if (previousSlug && previousSlug !== next.slug) {
    items = items.map((event) =>
      event.parentSlug === previousSlug ? { ...event, parentSlug: next.slug } : event,
    );
  }
  const payload: EventItem = { ...next, parentSlug };
  const withCurrent = [...items, payload];
  if (
    parentSlug &&
    !validParentCandidates(payload, withCurrent).some((item) => item.slug === parentSlug)
  ) {
    payload.parentSlug = undefined;
  }
  saveEvents(withCurrent.map((event) => (event.slug === payload.slug ? payload : event)));
}

export function deleteEvent(slug: string) {
  saveEvents(
    loadEvents()
      .filter((event) => event.slug !== slug)
      .map((event) => (event.parentSlug === slug ? { ...event, parentSlug: undefined } : event)),
  );
}

export function loadNews(): NewsItem[] {
  return readJson(NEWS_KEY, seedNews);
}

export function saveNews(items: NewsItem[]) {
  writeJson(NEWS_KEY, items);
}

export function publishedNews() {
  return loadNews()
    .filter((item) => item.status === "published")
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function findNews(slug: string) {
  return loadNews().find((item) => item.slug === slug);
}

export function upsertNews(next: NewsItem, previousSlug?: string) {
  const items = loadNews().filter((item) => item.slug !== next.slug && item.slug !== previousSlug);
  saveNews([...items, next]);
}

export function deleteNews(slug: string) {
  saveNews(loadNews().filter((item) => item.slug !== slug));
}

export function loadSpots(): SpotItem[] {
  return readJson<unknown[]>(SPOTS_KEY, seedSpots).map(normalizeSpot);
}

export function saveSpots(items: SpotItem[]) {
  writeJson(SPOTS_KEY, items);
}

export function linkableArtists() {
  const map = new Map<string, { slug: string; name: string; genre: string }>();
  for (const artist of artists) {
    map.set(artist.slug, { slug: artist.slug, name: artist.name, genre: artist.genre });
  }
  if (typeof window !== "undefined") {
    for (const account of listLocalAccounts()) {
      if (account.user.artistStatus === "approved" && account.artist?.slug) {
        map.set(account.artist.slug, {
          slug: account.artist.slug,
          name: account.artist.name,
          genre: account.artist.genre,
        });
      }
    }
  }
  return [...map.values()];
}

export function eventsForArtistSlug(slug: string) {
  return eventsForArtist(slug, publishedEvents());
}
