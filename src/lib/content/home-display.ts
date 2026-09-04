import type { Artist, EventItem, EventKind } from "@/data/site";
import { inferEventKind, isPublished } from "@/data/site";
import { homeEventLists, homeVenueLists } from "@/lib/calendar";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const homeEventLimit = 3;
export const homeVillageLimit = 8;
export const villageSlideIntervalMs = 20_000;
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
  sideLabelEn: string;
  titleEn: string;
  leadEn: string;
};

export type HomeVillage = {
  id?: string;
  image: string;
  title: string;
  schedule: string;
  summary: string;
  titleEn: string;
  scheduleEn: string;
  summaryEn: string;
};

export type AboutConcept = {
  image: string;
  heading: string;
  title: string;
  body: string;
  headingEn: string;
  titleEn: string;
  bodyEn: string;
};

export type HomeDisplay = {
  hero: HomeHero;
  villages: HomeVillage[];
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
  sideLabelEn: "Higashiyoshino, Nara",
  titleEn: "Records of makers\nrooted in the mountains.",
  leadEn: "Deep in the mountains, far from the noise.\nMakers rooted in Higashiyoshino, Nara. Curated by Okuyama House.",
});

export const defaultHomeVillage = (): HomeVillage => ({
  image: defaultVillageImage,
  title: "",
  schedule: "",
  summary: "",
  titleEn: "",
  scheduleEn: "",
  summaryEn: "",
});

export function newHomeVillage(): HomeVillage {
  return { ...defaultHomeVillage(), id: crypto.randomUUID() };
}

export const defaultAboutConcept = (): AboutConcept => ({
  image: defaultAboutImage,
  heading: "コンセプト",
  title: "空の器",
  body: "催しや作家などの情報を掲載します。",
  headingEn: "Concept",
  titleEn: "An empty vessel",
  bodyEn: "We share events, makers, and notes from the village.",
});

export const defaultHomeDisplay = (): HomeDisplay => ({
  hero: defaultHomeHero(),
  villages: [defaultHomeVillage()],
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
    sideLabelEn: asText(row.sideLabelEn) || fallback.sideLabelEn,
    titleEn: asText(row.titleEn) || fallback.titleEn,
    leadEn: typeof row.leadEn === "string" ? row.leadEn.trim() : fallback.leadEn,
  };
}

function normalizeVillage(value: unknown): HomeVillage {
  const fallback = defaultHomeVillage();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const row = value as Partial<HomeVillage>;
  return {
    id: asText(row.id) || undefined,
    image: asText(row.image) || fallback.image,
    title: asText(row.title),
    schedule: asText(row.schedule),
    summary: typeof row.summary === "string" ? row.summary.trim() : "",
    titleEn: asText(row.titleEn),
    scheduleEn: asText(row.scheduleEn),
    summaryEn: typeof row.summaryEn === "string" ? row.summaryEn.trim() : "",
  };
}

function normalizeVillages(villages: unknown, legacyVillage: unknown): HomeVillage[] {
  if (Array.isArray(villages)) {
    return villages.map(normalizeVillage).slice(0, homeVillageLimit);
  }
  if (legacyVillage) return [normalizeVillage(legacyVillage)];
  return [defaultHomeVillage()];
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
    headingEn: asCopy(row.headingEn, fallback.headingEn),
    titleEn: asCopy(row.titleEn, fallback.titleEn),
    bodyEn: asCopy(row.bodyEn, fallback.bodyEn),
  };
}

export function normalizeHomeDisplay(
  value: (Partial<HomeDisplay> & { heroImage?: unknown; village?: unknown }) | null | undefined,
): HomeDisplay {
  const fallback = defaultHomeDisplay();
  if (!value || Array.isArray(value)) return fallback;
  return {
    hero: normalizeHero(value.hero, value.heroImage),
    villages: normalizeVillages(value.villages, value.village),
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

function arrangeHomeLayer(items: EventItem[], display: HomeDisplay, kind: EventKind) {
  const published = items.filter(isPublished);
  const ofKind = (event: EventItem) => inferEventKind(event, published) === kind;
  if (display.eventsMode === "manual") {
    const picked = pickBySlug(published, display.eventSlugs).filter(ofKind);
    if (picked.length > 0) return picked.slice(0, homeEventLimit);
  }
  const { ongoing, upcoming } = kind === "venue" ? homeVenueLists(published) : homeEventLists(published);
  const pool = ongoing.length > 0 ? ongoing : upcoming;
  return shuffleItems(pool).slice(0, homeEventLimit);
}

export function arrangeHomeEvents(items: EventItem[], display: HomeDisplay) {
  return arrangeHomeLayer(items, display, "program");
}

export function arrangeHomeVenues(items: EventItem[], display: HomeDisplay) {
  return arrangeHomeLayer(items, display, "venue");
}

export function arrangeHomeArtists(items: Artist[], display: HomeDisplay) {
  if (display.artistsMode !== "manual") return items;
  const ordered = pickBySlug(items, display.artistSlugs);
  const rest = items.filter((item) => !display.artistSlugs.includes(item.slug));
  return [...ordered, ...rest];
}

export function parseHomeDisplay(items: unknown): HomeDisplay {
  if (!items || typeof items !== "object" || Array.isArray(items)) return defaultHomeDisplay();
  return normalizeHomeDisplay(items as Partial<HomeDisplay> & { heroImage?: unknown; village?: unknown });
}

export function hasPendingHomeImage(display: HomeDisplay) {
  return (
    display.hero.image.startsWith("blob:") ||
    display.visitImage.startsWith("blob:") ||
    display.about.image.startsWith("blob:") ||
    display.villages.some((item) => item.image.startsWith("blob:"))
  );
}

export function withVillageIds(display: HomeDisplay): HomeDisplay {
  return {
    ...display,
    villages: display.villages.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
    })),
  };
}

export function homeVillages(display: HomeDisplay & { village?: HomeVillage }): HomeVillage[] {
  if (Array.isArray(display.villages)) return display.villages;
  if (display.village) return [display.village];
  return [defaultHomeVillage()];
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
  if (hasPendingHomeImage(next)) {
    throw new Error("image");
  }
  if (preview || !isSupabaseConfigured()) {
    saveLocalHomeDisplay(next);
    return next;
  }
  const [heroImage, visitImage, aboutImage, ...villageImages] = await Promise.all([
    ensureHomeImage(next.hero.image),
    ensureHomeImage(next.visitImage),
    ensureHomeImage(next.about.image),
    ...next.villages.map((item) => ensureHomeImage(item.image)),
  ]);
  const payload: HomeDisplay = {
    ...next,
    hero: { ...next.hero, image: heroImage },
    visitImage,
    villages: next.villages.map((item, index) => ({
      ...item,
      image: villageImages[index] ?? item.image,
    })),
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
