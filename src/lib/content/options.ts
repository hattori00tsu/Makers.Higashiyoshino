import {
  defaultArtistGenres,
  defaultEventCategories,
  defaultSpotCategories,
  parsePlaceList,
  type PlaceOption,
} from "@/data/site";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type NamedOption = {
  name: string;
  nameEn: string;
};

export type EventOptions = {
  categories: NamedOption[];
  genres: NamedOption[];
  series: NamedOption[];
  venues: PlaceOption[];
  parkings: PlaceOption[];
};

export const eventOptionCatalogIds = ["categories", "genres", "series", "venues", "parkings"] as const;

const defaultCategoryEn: Record<string, string> = {
  開放: "Open studio",
  展示: "Exhibition",
  ワークショップ: "Workshop",
  音楽: "Music",
};

const defaultGenreEn: Record<string, string> = {
  陶芸: "Ceramics",
  木工: "Woodwork",
  染色: "Dyeing",
  写真: "Photography",
  和紙: "Washi",
  絵画: "Painting",
  その他: "Other",
};

export const emptyNamedOption = (): NamedOption => ({ name: "", nameEn: "" });

export function optionNames(items: NamedOption[]): string[] {
  return items.map((item) => item.name);
}

function namedDefaults(names: string[], enMap: Record<string, string>): NamedOption[] {
  return names.map((name) => ({ name, nameEn: enMap[name] ?? "" }));
}

export const defaultEventOptions = (): EventOptions => ({
  categories: namedDefaults(defaultEventCategories, defaultCategoryEn),
  genres: namedDefaults(defaultArtistGenres, defaultGenreEn),
  series: [],
  venues: [],
  parkings: [],
});

const KEY = "hy-event-options-v2";

function parseNamedList(value: unknown, fallback: NamedOption[], enMap: Record<string, string> = {}): NamedOption[] {
  const rows: NamedOption[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") {
        const name = item.trim();
        if (name) rows.push({ name, nameEn: "" });
        continue;
      }
      if (!item || typeof item !== "object") continue;
      const rec = item as { name?: unknown; nameEn?: unknown; title?: unknown; titleEn?: unknown };
      const name = String(rec.name ?? rec.title ?? "").trim();
      if (!name) continue;
      rows.push({ name, nameEn: String(rec.nameEn ?? rec.titleEn ?? "").trim() });
    }
  }
  const seen = new Set<string>();
  const unique = rows.filter((row) => {
    if (seen.has(row.name)) return false;
    seen.add(row.name);
    return true;
  });
  const items = unique.length ? unique : fallback;
  return items.map((item) => ({
    name: item.name,
    nameEn: item.nameEn.trim() || enMap[item.name] || "",
  }));
}

function parsePlaces(value: unknown, fallback: PlaceOption[]): PlaceOption[] {
  if (!Array.isArray(value)) return fallback;
  const parsed = parsePlaceList(value);
  return parsed.length || value.length === 0 ? parsed : fallback;
}

export function normalizeEventOptions(value: {
  categories?: unknown;
  genres?: unknown;
  series?: unknown;
  venues?: unknown;
  parkings?: unknown;
} | null | undefined): EventOptions {
  const fallback = defaultEventOptions();
  return {
    categories: parseNamedList(value?.categories, fallback.categories, defaultCategoryEn),
    genres: parseNamedList(value?.genres, fallback.genres, defaultGenreEn),
    series: parseNamedList(value?.series, fallback.series),
    venues: parsePlaces(value?.venues, fallback.venues),
    parkings: parsePlaces(value?.parkings, fallback.parkings),
  };
}

export function optionsFromCatalogRows(data: { id: string; items: unknown }[] | null | undefined): EventOptions {
  if (!data?.length) return defaultEventOptions();
  const rows = Object.fromEntries(data.map((row) => [row.id, row.items]));
  return normalizeEventOptions({
    categories: rows.categories,
    genres: rows.genres,
    series: rows.series,
    venues: rows.venues,
    parkings: rows.parkings,
  });
}

export function loadLocalEventOptions(): EventOptions {
  if (typeof window === "undefined") return defaultEventOptions();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultEventOptions();
    return normalizeEventOptions(JSON.parse(raw) as Record<string, unknown>);
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
  const { data, error } = await supabase
    .from("event_catalogs")
    .select("id, items")
    .in("id", [...eventOptionCatalogIds]);
  if (error || !data?.length) return defaultEventOptions();
  return optionsFromCatalogRows(data as { id: string; items: unknown }[]);
}

export async function saveEventOptions(options: EventOptions, preview?: boolean) {
  const next = normalizeEventOptions(options);
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
