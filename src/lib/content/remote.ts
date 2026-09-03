import { normalizeSpot, type EventItem, type SpotItem } from "@/data/site";
import { normalizeEvent } from "@/data/site";
import type { NewsItem } from "@/lib/content/catalog";
import type { Application, ApplicationStatus } from "@/lib/content/applications";
import { notifyMapFromRows } from "@/lib/content/application-notify";
import { i18nWriteColumns, isI18nColumnError, omitI18nColumns } from "@/lib/i18n/write";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { getAuthIdentity } from "@/lib/supabase/identity";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  description: string | null;
  venue: string | null;
  access: string | null;
  parking: string | null;
  image_path: string | null;
  gallery_paths?: string[] | null;
  price?: string | null;
  is_outdoor: boolean;
  capacity: number | null;
  requires_reservation: boolean;
  status: EventItem["status"];
  map_lat: number | null;
  map_lng: number | null;
  map_query: string | null;
  parent_slug: string | null;
  kind?: EventItem["kind"] | null;
  series?: string | null;
  owner_artist_slug?: string | null;
  event_sessions?: { starts_at: string; ends_at: string; capacity?: number | null }[];
  event_artists?: { artist_slug: string }[];
  i18n_enabled?: boolean | null;
  title_en?: string | null;
  summary_en?: string | null;
  description_en?: string | null;
  access_en?: string | null;
  price_en?: string | null;
};

export function mapEvent(row: EventRow): EventItem {
  const sessions = (row.event_sessions ?? [])
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .map((session) => ({
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      capacity: typeof session.capacity === "number" ? session.capacity : null,
    }));
  return normalizeEvent({
    slug: row.slug,
    title: row.title,
    categories: row.category,
    summary: row.summary ?? "",
    description: row.description ?? "",
    venues: row.venue ?? "",
    access: row.access ?? "",
    parkings: row.parking ?? "",
    image: row.image_path || "",
    gallery: row.gallery_paths ?? [],
    price: row.price ?? "",
    isOutdoor: row.is_outdoor,
    capacity: row.capacity,
    requiresReservation: row.requires_reservation,
    status: row.status ?? "published",
    map: row.map_query || "",
    sessions: sessions.length ? sessions : [{ startsAt: "", endsAt: "" }],
    artistSlugs: (row.event_artists ?? []).map((item) => item.artist_slug),
    parentSlug: row.parent_slug ?? undefined,
    kind: row.kind ?? undefined,
    series: row.series ?? undefined,
    ownerArtistSlug: row.owner_artist_slug ?? undefined,
    i18nEnabled: Boolean(row.i18n_enabled),
    titleEn: row.title_en ?? "",
    summaryEn: row.summary_en ?? "",
    descriptionEn: row.description_en ?? "",
    accessEn: row.access_en ?? "",
    priceEn: row.price_en ?? "",
  });
}

const eventColumns =
  "id, slug, title, category, summary, description, venue, access, parking, image_path, is_outdoor, capacity, requires_reservation, status, map_lat, map_lng, map_query, parent_slug";

const eventI18nColumns = "i18n_enabled, title_en, summary_en, description_en, access_en, price_en";

const eventSelectShapes = [
  `${eventColumns}, price, gallery_paths, kind, owner_artist_slug, series, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, price, gallery_paths, kind, owner_artist_slug, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, gallery_paths, kind, owner_artist_slug, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, kind, owner_artist_slug, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, event_sessions ( starts_at, ends_at ), event_artists ( artist_slug )`,
  `${eventColumns}, event_sessions ( starts_at, ends_at )`,
];

function attachEventI18n(select: string) {
  const nested = select.indexOf(", event_sessions");
  if (nested === -1) return `${select}, ${eventI18nColumns}`;
  return `${select.slice(0, nested)}, ${eventI18nColumns}${select.slice(nested)}`;
}

export const eventSelect = attachEventI18n(eventSelectShapes[0]);

export type LoadEventRowOptions = {
  slug?: string;
  slugs?: string[];
  ids?: string[];
  publishedOnly?: boolean;
  ownerArtistSlug?: string;
};

type EventQueryClient = { from: (table: string) => { select: (columns: string) => any } };

export async function loadEventRows(
  supabase: EventQueryClient,
  options?: LoadEventRowOptions,
): Promise<EventRow[] | null> {
  if (options?.slugs && options.slugs.length === 0) return [];
  if (options?.ids && options.ids.length === 0) return [];

  const run = async (select: string) => {
    let query = supabase.from("events").select(select);
    if (options?.publishedOnly) query = query.eq("status", "published");
    if (options?.ownerArtistSlug) query = query.eq("owner_artist_slug", options.ownerArtistSlug);
    if (options?.slugs?.length) query = query.in("slug", options.slugs);
    if (options?.ids?.length) query = query.in("id", options.ids);
    return options?.slug ? await query.eq("slug", options.slug).maybeSingle() : await query;
  };
  const asRows = (data: unknown): EventRow[] => {
    if (!data) return [];
    return (Array.isArray(data) ? data : [data]) as EventRow[];
  };

  let lastError: { message?: string } | null = null;
  for (const shape of eventSelectShapes) {
    const withI18n = attachEventI18n(shape);
    let result = await run(withI18n);
    if (!result.error) return asRows(result.data);
    lastError = result.error;
    if (!isI18nColumnError(result.error)) continue;
    result = await run(shape);
    if (!result.error) return asRows(result.data);
    lastError = result.error;
  }
  if (lastError) throw lastError;
  return null;
}

export async function loadEventItemsForArtist(
  supabase: EventQueryClient,
  artistSlug: string,
  options?: { publishedOnly?: boolean },
): Promise<EventItem[] | null> {
  const ownedRows = await loadEventRows(supabase, { ...options, ownerArtistSlug: artistSlug });
  const { data: links } = await supabase.from("event_artists").select("event_id").eq("artist_slug", artistSlug);
  const ids = [...new Set(((links ?? []) as { event_id?: string }[]).map((row) => String(row.event_id ?? "")))].filter(
    Boolean,
  );
  const linkedRows = await loadEventRows(supabase, { ...options, ids });
  const bySlug = new Map<string, EventItem>();
  for (const row of [...(ownedRows ?? []), ...(linkedRows ?? [])]) {
    const event = mapEvent(row);
    bySlug.set(event.slug, event);
  }
  const parentSlugs = [...bySlug.values()]
    .map((event) => event.parentSlug)
    .filter((value): value is string => typeof value === "string" && value.length > 0 && !bySlug.has(value));
  if (parentSlugs.length) {
    const parents = await loadEventRows(supabase, { slugs: parentSlugs, publishedOnly: options?.publishedOnly });
    for (const row of parents ?? []) {
      const event = mapEvent(row);
      bySlug.set(event.slug, event);
    }
  }
  return [...bySlug.values()];
}

export async function fetchRemoteEvents(options?: { publishedOnly?: boolean }) {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const rows = await loadEventRows(supabase, options);
  return rows ? rows.map(mapEvent) : null;
}

export async function fetchRemoteEventsBySlugs(slugs: string[], options?: { publishedOnly?: boolean }) {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return [];
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const rows = await loadEventRows(supabase, { ...options, slugs: unique });
  return rows ? rows.map(mapEvent) : null;
}

export async function fetchRemoteEventsForArtist(artistSlug: string, options?: { publishedOnly?: boolean }) {
  if (!artistSlug) return [];
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  return loadEventItemsForArtist(supabase, artistSlug, options);
}

export async function fetchRemoteEvent(slug: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const rows = await loadEventRows(supabase, { slug });
  return rows?.[0] ? mapEvent(rows[0]) : null;
}

export async function fetchRemoteCounts() {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const [events, artists, applications] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("artists").select("id", { count: "exact", head: true }),
    supabase.from("event_applications").select("id", { count: "exact", head: true }).neq("status", "cancelled"),
  ]);
  return {
    events: events.count ?? 0,
    artists: artists.count ?? 0,
    applications: applications.count ?? 0,
  };
}

async function ensureImagePath(image: string) {
  if (!image || image === "/images/event-fair.jpg") return "";
  if (!image.startsWith("data:")) return image;
  const supabase = createBrowserSupabase();
  if (!supabase) return image;
  const blob = await (await fetch(image)).blob();
  const path = `covers/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("events").upload(path, blob, {
    contentType: blob.type || "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return supabase.storage.from("events").getPublicUrl(path).data.publicUrl;
}

export async function upsertRemoteEvent(next: EventItem, previousSlug?: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const imagePath = await ensureImagePath(next.image);
  const galleryPaths = (
    await Promise.all((next.gallery ?? []).slice(0, 4).map((src) => ensureImagePath(src)))
  ).filter(Boolean);
  const lookup = previousSlug || next.slug;
  const { data: existing } = await supabase.from("events").select("id").eq("slug", lookup).maybeSingle();

  const payload = {
    slug: next.slug,
    title: next.title,
    category: JSON.stringify(next.categories),
    summary: next.summary,
    description: next.description,
    venue: JSON.stringify(next.venues),
    access: next.access,
    parking: JSON.stringify(next.parkings),
    image_path: imagePath || null,
    gallery_paths: galleryPaths,
    price: next.price?.trim() || null,
    is_outdoor: next.isOutdoor,
    capacity: next.capacity,
    requires_reservation: Boolean(next.requiresReservation),
    status: next.status ?? "draft",
    map_lat: null,
    map_lng: null,
    map_query: JSON.stringify(next.venues[0] ?? null),
    parent_slug: next.parentSlug || null,
    kind: next.kind ?? "program",
    series: next.series?.trim() || null,
    owner_artist_slug: next.ownerArtistSlug || null,
    ...i18nWriteColumns(Boolean(next.i18nEnabled), {
      title_en: next.titleEn,
      summary_en: next.summaryEn,
      description_en: next.descriptionEn,
      access_en: next.accessEn,
      price_en: next.priceEn,
    }),
    updated_at: new Date().toISOString(),
  };

  const auth = await getAuthIdentity(supabase);
  let eventId = existing?.id as string | undefined;
  const withoutI18n = omitI18nColumns(payload);
  const payloads = [
    payload,
    withoutI18n,
    (({ series: _series, ...rest }) => rest)(withoutI18n),
    (({ series: _series, price: _price, ...rest }) => rest)(withoutI18n),
    (({ series: _series, price: _price, gallery_paths: _gallery, ...rest }) => rest)(withoutI18n),
    (({ series: _series, price: _price, gallery_paths: _gallery, kind: _kind, owner_artist_slug: _owner, ...rest }) => rest)(withoutI18n),
  ];
  if (eventId) {
    let lastError: { message?: string } | null = null;
    for (const row of payloads) {
      const { error } = await supabase.from("events").update(row).eq("id", eventId);
      if (!error) {
        lastError = null;
        break;
      }
      lastError = error;
    }
    if (lastError) throw lastError;
  } else {
    let lastError: { message?: string } | null = null;
    for (const row of payloads) {
      const { data, error } = await supabase
        .from("events")
        .insert({ ...row, created_by: auth?.id ?? null })
        .select("id")
        .single();
      if (!error && data) {
        eventId = data.id as string;
        lastError = null;
        break;
      }
      lastError = error;
    }
    if (lastError) throw lastError;
  }

  const { error: sessionDelete } = await supabase.from("event_sessions").delete().eq("event_id", eventId);
  if (sessionDelete) throw sessionDelete;
  if (next.sessions.length) {
    const rows = next.sessions.map((session) => ({
      event_id: eventId,
      starts_at: session.startsAt,
      ends_at: session.endsAt,
      capacity: session.capacity ?? null,
    }));
    const inserted = await supabase.from("event_sessions").insert(rows);
    if (inserted.error) {
      const { error } = await supabase.from("event_sessions").insert(
        rows.map(({ capacity: _capacity, ...row }) => row),
      );
      if (error) throw error;
    }
  }

  const { error: artistDelete } = await supabase.from("event_artists").delete().eq("event_id", eventId);
  if (artistDelete) throw artistDelete;
  if (next.artistSlugs.length) {
    const { error } = await supabase.from("event_artists").insert(
      next.artistSlugs.map((artist_slug) => ({ event_id: eventId, artist_slug })),
    );
    if (error) throw error;
  }
}

export async function deleteRemoteEvent(slug: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("events").delete().eq("slug", slug);
  if (error) throw error;
}

export const newsListColumns = "slug, title, published_at, status";
export const newsDetailColumns = "slug, title, body, published_at, status";

export function mapNews(row: Record<string, unknown>): NewsItem {
  return {
    slug: String(row.slug),
    title: String(row.title),
    body: String(row.body ?? ""),
    publishedAt: String(row.published_at),
    status: row.status === "published" ? "published" : "draft",
  };
}

export async function fetchRemoteNews(): Promise<NewsItem[] | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("news")
    .select(newsDetailColumns)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapNews(row));
}

export async function fetchRemoteNewsItem(slug: string): Promise<NewsItem | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("news").select(newsDetailColumns).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapNews(data as Record<string, unknown>) : null;
}

export async function saveRemoteNews(items: NewsItem[]) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const keep = new Set(items.map((item) => item.slug));
  const { data: existing, error: existingError } = await supabase.from("news").select("slug");
  if (existingError) throw existingError;
  const toDelete = (existing ?? [])
    .map((row: { slug?: string }) => String(row.slug ?? ""))
    .filter((slug: string) => Boolean(slug) && !keep.has(slug));
  if (toDelete.length) {
    const { error } = await supabase.from("news").delete().in("slug", toDelete);
    if (error) throw error;
  }
  if (items.length === 0) return;
  const { error } = await supabase.from("news").upsert(
    items.map((item) => ({
      slug: item.slug,
      title: item.title,
      body: item.body,
      published_at: item.publishedAt,
      status: item.status,
    })),
    { onConflict: "slug" },
  );
  if (error) throw error;
}

const spotColumns = "category, name, note, query, maps_url";

export async function fetchRemoteSpots(): Promise<SpotItem[] | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("spots").select(spotColumns);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => normalizeSpot(row));
}

export async function saveRemoteSpots(items: SpotItem[]) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error: clearError } = await supabase.from("spots").delete().not("id", "is", null);
  if (clearError) throw clearError;
  if (items.length === 0) return;
  const { error } = await supabase.from("spots").insert(
    items.map((item) => ({
      category: item.category,
      name: item.name,
      note: item.note,
      query: item.place,
      maps_url: item.mapsUrl,
    })),
  );
  if (error) throw error;
}

export const applicationColumns =
  "id, event_slug, session_starts_at, name, email, phone, party_size, note, status, created_at, user_id";

export async function fetchRemoteApplications(eventSlugs?: string[]): Promise<Application[] | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  if (eventSlugs && eventSlugs.length === 0) return [];
  let query = supabase.from("event_applications").select(applicationColumns).order("created_at", { ascending: false });
  if (eventSlugs) query = query.in("event_slug", eventSlugs);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapApplication(row));
}

export function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: String(row.id),
    eventSlug: String(row.event_slug),
    sessionStartsAt: String(row.session_starts_at),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    partySize: Number(row.party_size),
    note: String(row.note ?? ""),
    status: row.status as ApplicationStatus,
    createdAt: String(row.created_at),
    userId: row.user_id ? String(row.user_id) : undefined,
  };
}

export async function fetchMyRemoteApplications(): Promise<Application[]> {
  const supabase = createBrowserSupabase();
  if (!supabase) return [];
  const auth = await getAuthIdentity(supabase);
  const userId = auth?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("event_applications")
    .select(applicationColumns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapApplication);
}

export async function submitRemoteApplication(input: Omit<Application, "id" | "createdAt" | "status">) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.rpc("submit_application", {
    p_slug: input.eventSlug,
    p_session: input.sessionStartsAt,
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_party: input.partySize,
    p_note: input.note,
  });
  if (error) throw error;
}

export async function fetchRemoteApplicationNotify(): Promise<Record<string, boolean>> {
  const supabase = createBrowserSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.rpc("my_event_application_notify");
  if (error) throw error;
  return notifyMapFromRows(data as { event_slug?: string; notify?: boolean }[] | null);
}

export async function setRemoteApplicationNotify(eventSlug: string, notify: boolean) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.rpc("set_my_event_application_notify", {
    p_slug: eventSlug,
    p_notify: notify,
  });
  if (error) throw error;
}

export async function cancelRemoteApplication(id: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.rpc("cancel_own_application", { p_id: id });
  if (error) throw error;
}

export async function fetchOccupiedSeats(slug: string, sessionStartsAt?: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  if (sessionStartsAt) {
    const { data, error } = await supabase.rpc("occupied_session_seats", {
      p_slug: slug,
      p_session: sessionStartsAt,
    });
    if (error) throw error;
    return Number(data ?? 0);
  }
  const { data, error } = await supabase.rpc("occupied_seats", { p_slug: slug });
  if (error) throw error;
  return Number(data ?? 0);
}

export type OccupiedSeatRow = {
  event_slug: string;
  session_starts_at: string;
  taken: number;
};

const occupiedBySlugsInflight = new Map<string, Promise<OccupiedSeatRow[]>>();

export async function fetchOccupiedSeatsBySlugs(slugs: string[]) {
  const unique = [...new Set(slugs.filter(Boolean))].sort();
  if (unique.length === 0) return [] as OccupiedSeatRow[];
  const key = unique.join("\0");
  const pending = occupiedBySlugsInflight.get(key);
  if (pending) return pending;

  const supabase = createBrowserSupabase();
  if (!supabase) return [];

  const promise = (async () => {
    const { data, error } = await supabase.rpc("occupied_seats_by_sessions", {
      p_slugs: unique,
    });
    if (error) throw error;
    return ((data ?? []) as OccupiedSeatRow[]).map((row) => ({
      event_slug: String(row.event_slug),
      session_starts_at: String(row.session_starts_at),
      taken: Number(row.taken ?? 0),
    }));
  })();

  occupiedBySlugsInflight.set(key, promise);
  try {
    return await promise;
  } finally {
    setTimeout(() => occupiedBySlugsInflight.delete(key), 1500);
  }
}

type LinkableArtist = { slug: string; name: string; genre: string };

let linkableArtistsCache: { at: number; data: LinkableArtist[] } | null = null;
let linkableArtistsInflight: Promise<LinkableArtist[]> | null = null;

export async function fetchLinkableRemoteArtists() {
  const now = Date.now();
  if (linkableArtistsCache && now - linkableArtistsCache.at < 30_000) {
    return linkableArtistsCache.data;
  }
  if (linkableArtistsInflight) return linkableArtistsInflight;

  const supabase = createBrowserSupabase();
  if (!supabase) return [];

  linkableArtistsInflight = (async () => {
    const { data, error } = await supabase
      .from("artists")
      .select("slug, name, genre")
      .eq("status", "approved");
    if (error) throw error;
    const artists = (data ?? [])
      .filter((row: Record<string, unknown>) => row.slug)
      .map((row: Record<string, unknown>) => ({
        slug: String(row.slug),
        name: String(row.name),
        genre: String(row.genre ?? ""),
      }));
    linkableArtistsCache = { at: Date.now(), data: artists };
    return artists;
  })();

  try {
    return await linkableArtistsInflight;
  } finally {
    linkableArtistsInflight = null;
  }
}
