import type { Artist, EventItem } from "@/data/site";
import { isPublished } from "@/data/site";
import { publicEventLists } from "@/lib/calendar";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const homeEventLimit = 3;
export const defaultHeroImage = "/images/2.jpg";
export const defaultVillageImage = "/images/3.jpg";
export const defaultVisitImage = "/images/4.jpg";
export const defaultAboutImage = "/images/3.jpg";

export type HomeEventsMode = "upcoming" | "manual" | "random";
export type HomeArtistsMode = "default" | "manual" | "random";

export type HomeHero = {
  image: string;
  sideLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
};

export type HomeVillage = {
  image: string;
  title: string;
  schedule: string;
  summary: string;
};

export type AboutConcept = {
  image: string;
  heading: string;
  title: string;
  body: string;
};

export type HomeDisplay = {
  hero: HomeHero;
  village: HomeVillage;
  visitImage: string;
  about: AboutConcept;
  eventsMode: HomeEventsMode;
  eventSlugs: string[];
  artistsMode: HomeArtistsMode;
  artistSlugs: string[];
};

export const defaultHomeHero = (): HomeHero => ({
  image: defaultHeroImage,
  sideLabel: "奈良県東吉野村",
  eyebrow: "NARA HIGASHIYOSHINO",
  title: "奥山に根ざす、\nつくり手たちの記録。",
  lead: "Deep in the mountains, far from the noise.\nMakers rooted in Higashiyoshino, Nara. Curated by Okuyama House.",
});

export const defaultHomeVillage = (): HomeVillage => ({
  image: defaultVillageImage,
  title: "",
  schedule: "",
  summary: "",
});

export const defaultAboutConcept = (): AboutConcept => ({
  image: defaultAboutImage,
  heading: "コンセプト",
  title: "空の器",
  body: "催しや作家などの情報を掲載します。",
});

export const defaultHomeDisplay = (): HomeDisplay => ({
  hero: defaultHomeHero(),
  village: defaultHomeVillage(),
  visitImage: defaultVisitImage,
  about: defaultAboutConcept(),
  eventsMode: "upcoming",
  eventSlugs: [],
  artistsMode: "default",
  artistSlugs: [],
});

export function resolveHomeImage(src: string | undefined, fallback: string) {
  const next = src?.trim() ?? "";
  return next || fallback;
}

export function splitCopyLines(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const KEY = "hy-home-display-v1";
export const homeDisplayCatalogId = "home";

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asCopy(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function asEventsMode(value: unknown): HomeEventsMode {
  if (value === "manual" || value === "random") return value;
  return "upcoming";
}

function asArtistsMode(value: unknown): HomeArtistsMode {
  if (value === "manual" || value === "random") return value;
  return "default";
}

function normalizeHero(value: unknown, legacyImage?: unknown): HomeHero {
  const fallback = defaultHomeHero();
  const imageFallback = asText(legacyImage) || fallback.image;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...fallback, image: imageFallback };
  }
  const row = value as Partial<HomeHero>;
  return {
    image: asText(row.image) || imageFallback,
    sideLabel: asCopy(row.sideLabel, fallback.sideLabel),
    eyebrow: asCopy(row.eyebrow, fallback.eyebrow),
    title: asCopy(row.title, fallback.title),
    lead: asCopy(row.lead, fallback.lead),
  };
}

function normalizeVillage(value: unknown): HomeVillage {
  const fallback = defaultHomeVillage();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const row = value as Partial<HomeVillage>;
  return {
    image: asText(row.image) || fallback.image,
    title: asText(row.title),
    schedule: asText(row.schedule),
    summary: typeof row.summary === "string" ? row.summary.trim() : "",
  };
}

function normalizeAbout(value: unknown): AboutConcept {
  const fallback = defaultAboutConcept();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const row = value as Partial<AboutConcept>;
  return {
    image: asText(row.image) || fallback.image,
    heading: asCopy(row.heading, fallback.heading),
    title: asCopy(row.title, fallback.title),
    body: asCopy(row.body, fallback.body),
  };
}

export function normalizeHomeDisplay(
  value: (Partial<HomeDisplay> & { heroImage?: unknown }) | null | undefined,
): HomeDisplay {
  const fallback = defaultHomeDisplay();
  if (!value || Array.isArray(value)) return fallback;
  return {
    hero: normalizeHero(value.hero, value.heroImage),
    village: normalizeVillage(value.village),
    visitImage: asText(value.visitImage) || fallback.visitImage,
    about: normalizeAbout(value.about),
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
  return normalizeHomeDisplay(items as Partial<HomeDisplay> & { heroImage?: unknown });
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

async function ensureHomeImage(image: string) {
  const value = image.trim();
  if (!value.startsWith("data:")) return value;
  const supabase = createBrowserSupabase();
  if (!supabase) return value;
  const blob = await (await fetch(value)).blob();
  const path = `home/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("events").upload(path, blob, {
    contentType: blob.type || "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return supabase.storage.from("events").getPublicUrl(path).data.publicUrl;
}

export async function saveHomeDisplay(display: HomeDisplay, preview?: boolean) {
  const next = normalizeHomeDisplay(display);
  if (
    next.hero.image.startsWith("blob:") ||
    next.visitImage.startsWith("blob:") ||
    next.village.image.startsWith("blob:") ||
    next.about.image.startsWith("blob:")
  ) {
    throw new Error("image");
  }
  if (preview || !isSupabaseConfigured()) {
    saveLocalHomeDisplay(next);
    return next;
  }
  const [heroImage, visitImage, villageImage, aboutImage] = await Promise.all([
    ensureHomeImage(next.hero.image),
    ensureHomeImage(next.visitImage),
    ensureHomeImage(next.village.image),
    ensureHomeImage(next.about.image),
  ]);
  const payload: HomeDisplay = {
    ...next,
    hero: { ...next.hero, image: heroImage },
    visitImage,
    village: { ...next.village, image: villageImage },
    about: { ...next.about, image: aboutImage },
  };
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("event_catalogs").upsert(
    { id: homeDisplayCatalogId, items: payload, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) throw error;
  return payload;
}
