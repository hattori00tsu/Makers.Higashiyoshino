import type { Artist, EventItem } from "@/data/site";
import { isPublished } from "@/data/site";
import { publicEventLists } from "@/lib/calendar";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const homeEventLimit = 3;

export type HomeEventsMode = "upcoming" | "manual" | "random";
export type HomeArtistsMode = "default" | "manual" | "random";

export type HomeDisplay = {
  eventsMode: HomeEventsMode;
  eventSlugs: string[];
  artistsMode: HomeArtistsMode;
  artistSlugs: string[];
};

export const defaultHomeDisplay = (): HomeDisplay => ({
  eventsMode: "upcoming",
  eventSlugs: [],
  artistsMode: "default",
  artistSlugs: [],
});

const KEY = "hy-home-display-v1";
export const homeDisplayCatalogId = "home";

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function asEventsMode(value: unknown): HomeEventsMode {
  if (value === "manual" || value === "random") return value;
  return "upcoming";
}

function asArtistsMode(value: unknown): HomeArtistsMode {
  if (value === "manual" || value === "random") return value;
  return "default";
}

export function normalizeHomeDisplay(value: Partial<HomeDisplay> | null | undefined): HomeDisplay {
  const fallback = defaultHomeDisplay();
  if (!value || Array.isArray(value)) return fallback;
  return {
    eventsMode: asEventsMode(value.eventsMode),
    eventSlugs: asStringArray(value.eventSlugs).slice(0, homeEventLimit),
    artistsMode: asArtistsMode(value.artistsMode),
    artistSlugs: asStringArray(value.artistSlugs),
  };
}

export function shuffleItems<T>(items: T[]) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickBySlug<T extends { slug: string }>(items: T[], slugs: string[]) {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is T => Boolean(item));
}

export function arrangeHomeEvents(items: EventItem[], display: HomeDisplay) {
  const published = items.filter(isPublished);
  if (display.eventsMode === "manual") {
    return pickBySlug(published, display.eventSlugs).slice(0, homeEventLimit);
  }
  const { ongoing, upcoming } = publicEventLists(published);
  const pool = ongoing.length > 0 ? ongoing : upcoming;
  return shuffleItems(pool).slice(0, homeEventLimit);
}

export function arrangeHomeArtists(items: Artist[], display: HomeDisplay) {
  if (display.artistsMode !== "manual") return items;
  const ordered = pickBySlug(items, display.artistSlugs);
  const rest = items.filter((item) => !display.artistSlugs.includes(item.slug));
  return [...ordered, ...rest];
}

export function parseHomeDisplay(items: unknown): HomeDisplay {
  if (!items || typeof items !== "object" || Array.isArray(items)) return defaultHomeDisplay();
  return normalizeHomeDisplay(items as Partial<HomeDisplay>);
}

export function loadLocalHomeDisplay(): HomeDisplay {
  if (typeof window === "undefined") return defaultHomeDisplay();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultHomeDisplay();
    return parseHomeDisplay(JSON.parse(raw));
  } catch {
    return defaultHomeDisplay();
  }
}

export function saveLocalHomeDisplay(display: HomeDisplay) {
  window.localStorage.setItem(KEY, JSON.stringify(normalizeHomeDisplay(display)));
}

export async function loadHomeDisplay(preview?: boolean): Promise<HomeDisplay> {
  if (preview || !isSupabaseConfigured()) return loadLocalHomeDisplay();
  const supabase = createBrowserSupabase();
  if (!supabase) return defaultHomeDisplay();
  const { data, error } = await supabase
    .from("event_catalogs")
    .select("items")
    .eq("id", homeDisplayCatalogId)
    .maybeSingle();
  if (error || !data) return defaultHomeDisplay();
  return parseHomeDisplay((data as { items?: unknown }).items);
}

export async function saveHomeDisplay(display: HomeDisplay, preview?: boolean) {
  const next = normalizeHomeDisplay(display);
  if (preview || !isSupabaseConfigured()) {
    saveLocalHomeDisplay(next);
    return;
  }
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("event_catalogs").upsert(
    { id: homeDisplayCatalogId, items: next, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) throw error;
}
