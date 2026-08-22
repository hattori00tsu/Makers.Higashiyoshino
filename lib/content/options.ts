import {
  defaultArtistGenres,
  defaultEventCategories,
  defaultSpotCategories,
  type PlaceOption,
} from "@/data/site";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type EventOptions = {
  categories: string[];
  genres: string[];
  series: string[];
  venues: PlaceOption[];
  parkings: PlaceOption[];
};

export const defaultEventOptions = (): EventOptions => ({
  categories: [...defaultEventCategories],
  genres: [...defaultArtistGenres],
  series: [],
  venues: [],
  parkings: [],
});

const KEY = "hy-event-options-v2";

function uniqueNames(value: string[] | undefined, fallback: string[]) {
  const items = [...new Set((value ?? []).map((item) => item.trim()).filter(Boolean))];
  return items.length ? items : fallback;
}

function normalizeOptions(value: Partial<EventOptions> | null | undefined): EventOptions {
  const fallback = defaultEventOptions();
  return {
    categories: uniqueNames(value?.categories, fallback.categories),
    genres: uniqueNames(value?.genres, fallback.genres),
    series: uniqueNames(value?.series, fallback.series),
    venues: value?.venues?.length ? value.venues : fallback.venues,
    parkings: value?.parkings?.length ? value.parkings : fallback.parkings,
  };
}

export function loadLocalEventOptions(): EventOptions {
  if (typeof window === "undefined") return defaultEventOptions();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultEventOptions();
    return normalizeOptions(JSON.parse(raw) as Partial<EventOptions>);
  } catch {
    return defaultEventOptions();
  }
}

export function saveLocalEventOptions(options: EventOptions) {
  window.localStorage.setItem(KEY, JSON.stringify(options));
}

export async function loadEventOptions(preview?: boolean): Promise<EventOptions> {
  if (preview || !isSupabaseConfigured()) return loadLocalEventOptions();
  const supabase = createBrowserSupabase();
  if (!supabase) return defaultEventOptions();
  const { data, error } = await supabase.from("event_catalogs").select("id, items");
  if (error || !data?.length) return defaultEventOptions();
  const rows = Object.fromEntries(
    (data as { id: string; items: unknown }[]).map((row) => [row.id, row.items]),
  );
  return normalizeOptions({
    categories: Array.isArray(rows.categories) ? (rows.categories as string[]) : undefined,
    genres: Array.isArray(rows.genres) ? (rows.genres as string[]) : undefined,
    series: Array.isArray(rows.series) ? (rows.series as string[]) : undefined,
    venues: Array.isArray(rows.venues) ? (rows.venues as PlaceOption[]) : undefined,
    parkings: Array.isArray(rows.parkings) ? (rows.parkings as PlaceOption[]) : undefined,
  });
}

export async function saveEventOptions(options: EventOptions, preview?: boolean) {
  const next = normalizeOptions(options);
  if (preview || !isSupabaseConfigured()) {
    saveLocalEventOptions(next);
    return;
  }
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const now = new Date().toISOString();
  const rows = [
    { id: "categories", items: next.categories, updated_at: now },
    { id: "genres", items: next.genres, updated_at: now },
    { id: "series", items: next.series, updated_at: now },
    { id: "venues", items: next.venues, updated_at: now },
    { id: "parkings", items: next.parkings, updated_at: now },
  ];
  const { error } = await supabase.from("event_catalogs").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

const SPOT_CATEGORIES_KEY = "hy-spot-categories-v1";
const SPOT_CATEGORIES_ID = "spot_categories";

function parseNameList(value: unknown) {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

export function loadLocalSpotCategories(): string[] {
  if (typeof window === "undefined") return [...defaultSpotCategories];
  try {
    const raw = window.localStorage.getItem(SPOT_CATEGORIES_KEY);
    if (!raw) return [...defaultSpotCategories];
    return parseNameList(JSON.parse(raw)) ?? [...defaultSpotCategories];
  } catch {
    return [...defaultSpotCategories];
  }
}

export function saveLocalSpotCategories(items: string[]) {
  window.localStorage.setItem(SPOT_CATEGORIES_KEY, JSON.stringify(parseNameList(items) ?? []));
}

export async function loadSpotCategories(preview?: boolean): Promise<string[]> {
  if (preview || !isSupabaseConfigured()) return loadLocalSpotCategories();
  const supabase = createBrowserSupabase();
  if (!supabase) return [...defaultSpotCategories];
  const { data, error } = await supabase
    .from("event_catalogs")
    .select("items")
    .eq("id", SPOT_CATEGORIES_ID)
    .maybeSingle();
  if (error || !data) return [...defaultSpotCategories];
  return parseNameList((data as { items?: unknown }).items) ?? [];
}

export async function saveSpotCategories(items: string[], preview?: boolean) {
  const next = parseNameList(items) ?? [];
  if (preview || !isSupabaseConfigured()) {
    saveLocalSpotCategories(next);
    return;
  }
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("event_catalogs").upsert(
    { id: SPOT_CATEGORIES_ID, items: next, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) throw error;
}
