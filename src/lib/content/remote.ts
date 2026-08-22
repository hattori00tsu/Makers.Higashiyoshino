import { normalizeSpot, type EventItem, type SpotItem } from "@/data/site";
import { normalizeEvent } from "@/data/site";
import type { NewsItem } from "@/lib/content/catalog";
import type { Application, ApplicationStatus } from "@/lib/content/applications";
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
  });
}

const eventColumns =
  "id, slug, title, category, summary, description, venue, access, parking, image_path, is_outdoor, capacity, requires_reservation, status, map_lat, map_lng, map_query, parent_slug";

export const eventSelect = `${eventColumns}, price, gallery_paths, kind, owner_artist_slug, series, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`;

const eventSelectFallbacks = [
  eventSelect,
  `${eventColumns}, price, gallery_paths, kind, owner_artist_slug, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, gallery_paths, kind, owner_artist_slug, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, kind, owner_artist_slug, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, event_sessions ( starts_at, ends_at, capacity ), event_artists ( artist_slug )`,
  `${eventColumns}, event_sessions ( starts_at, ends_at ), event_artists ( artist_slug )`,
  `${eventColumns}, event_sessions ( starts_at, ends_at )`,
];

export async function loadEventRows(
  supabase: { from: (table: string) => { select: (columns: string) => any } },
  options?: { slug?: string; publishedOnly?: boolean },
): Promise<EventRow[] | null> {
  let lastError: { message?: string } | null = null;
  for (const select of eventSelectFallbacks) {
    let query = supabase.from("events").select(select);
    if (options?.publishedOnly) query = query.eq("status", "published");
    const result = options?.slug ? await query.eq("slug", options.slug).maybeSingle() : await query;
    if (!result.error) {
      if (!result.data) return [];
      return (Array.isArray(result.data) ? result.data : [result.data]) as EventRow[];
    }
    lastError = result.error;
  }
  if (lastError) throw lastError;
  return null;
}

export async function fetchRemoteEvents() {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const rows = await loadEventRows(supabase);
  return rows ? rows.map(mapEvent) : null;
}

export async function fetchRemoteEvent(slug: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const rows = await loadEventRows(supabase, { slug });
  return rows?.[0] ? mapEvent(rows[0]) : null;
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
    updated_at: new Date().toISOString(),
  };

  const auth = await getAuthIdentity(supabase);
  let eventId = existing?.id as string | undefined;
  const payloads = [
    payload,
    (({ series: _series, ...rest }) => rest)(payload),
    (({ series: _series, price: _price, ...rest }) => rest)(payload),
    (({ series: _series, price: _price, gallery_paths: _gallery, ...rest }) => rest)(payload),
    (({ series: _series, price: _price, gallery_paths: _gallery, kind: _kind, owner_artist_slug: _owner, ...rest }) => rest)(payload),
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

export async function fetchRemoteNews(): Promise<NewsItem[] | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("news").select("*").order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    slug: String(row.slug),
    title: String(row.title),
    body: String(row.body),
    publishedAt: String(row.published_at),
    status: row.status === "published" ? "published" : "draft",
  }));
}

export async function saveRemoteNews(items: NewsItem[]) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { data: existing } = await supabase.from("news").select("slug");
  const keep = new Set(items.map((item) => item.slug));
  for (const row of existing ?? []) {
    if (!keep.has(String(row.slug))) {
      const { error } = await supabase.from("news").delete().eq("slug", row.slug);
      if (error) throw error;
    }
  }
  for (const item of items) {
    const { error } = await supabase.from("news").upsert(
      {
        slug: item.slug,
        title: item.title,
        body: item.body,
        published_at: item.publishedAt,
        status: item.status,
      },
      { onConflict: "slug" },
    );
    if (error) throw error;
  }
}

export async function fetchRemoteSpots(): Promise<SpotItem[] | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("spots").select("*");
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

export async function fetchRemoteApplications(): Promise<Application[] | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("event_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapApplication(row));
}

function mapApplication(row: Record<string, unknown>): Application {
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

export async function fetchMyRemoteApplications() {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const auth = await getAuthIdentity(supabase);
  const userId = auth?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("event_applications")
    .select("*")
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
