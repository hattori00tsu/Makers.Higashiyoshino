import { isPublished, needsReservation, sessionCapacity, type EventItem } from "@/data/site";
import { addApplication, remainingSeats, type Application } from "@/lib/content/applications";
import { findCatalogEvent, publishedEvents } from "@/lib/content/catalog";
import { remember } from "@/lib/content/client-cache";
import {
  fetchOccupiedSeats,
  fetchOccupiedSeatsBySlugs,
  fetchRemoteEvent,
  fetchRemoteEvents,
  submitRemoteApplication,
} from "@/lib/content/remote";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function useLocalContent(preview?: boolean) {
  return Boolean(preview) || !isSupabaseConfigured();
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
            taken == null ? null : Math.max(0, item.capacity - taken);
        } catch {
          result[liveSeatKey(item.event.slug, item.sessionStartsAt)] = null;
        }
      }),
    );
    return result;
  }
}

export async function findEventLive(slug: string, preview?: boolean) {
  if (useLocalContent(preview)) return findCatalogEvent(slug);
  try {
    return (await fetchRemoteEvent(slug)) ?? undefined;
  } catch {
    return undefined;
  }
}

export async function addApplicationLive(
  input: Omit<Application, "id" | "createdAt" | "status">,
  preview?: boolean,
) {
  if (useLocalContent(preview)) return addApplication(input);
  await submitRemoteApplication(input);
}

export async function publishedEventsLive(preview?: boolean) {
  return remember(`events:${preview ? "local" : "remote"}:published`, 15_000, async () => {
    if (useLocalContent(preview)) return publishedEvents();
    try {
      const items = await fetchRemoteEvents({ publishedOnly: true });
      return (items ?? []).filter(isPublished);
    } catch {
      return [];
    }
  });
}
