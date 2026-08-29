import { createBrowserSupabase } from "@/lib/supabase/client";
import { forget, remember } from "@/lib/content/client-cache";
import {
  emptyDraft,
  formatArtistGenres,
  normalizeArtistDraft,
  serializeArtistLinks,
  type ArtistDraft,
  type WorkDraft,
} from "@/lib/account/types";

function slugOf(name: string, slug: string) {
  if (slug.trim()) return slug.trim();
  return `artist-${Date.now().toString(36)}`;
}

function rowToDraft(row: Record<string, unknown>): ArtistDraft {
  return normalizeArtistDraft({
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    reading: String(row.reading ?? ""),
    genre: row.genre,
    area: String(row.area ?? ""),
    bio: String(row.bio ?? ""),
    profile: String(row.profile ?? ""),
    studioName: String(row.studio_address ?? ""),
    studioMapUrl: String(row.studio_query ?? ""),
    studioVisit: String(row.studio_visit ?? ""),
    studioLat: row.studio_lat == null ? "" : String(row.studio_lat),
    studioLng: row.studio_lng == null ? "" : String(row.studio_lng),
    instagram: String(row.instagram ?? ""),
    instagramPermalink: String(row.instagram_permalink ?? ""),
    facebook: String(row.facebook ?? ""),
    links: row.links,
    image: String(row.cover_path ?? ""),
    x: String(row.x_url ?? ""),
    shop: String(row.shop ?? ""),
    status: (row.status as ArtistDraft["status"]) ?? "pending",
  });
}

export const artistListColumns = "id, profile_id, slug, name, genre, area, status, i18n_enabled, name_en, area_en";
export const artistDetailColumns =
  "id, profile_id, slug, name, reading, genre, area, bio, profile, cover_path, studio_address, studio_query, studio_visit, studio_lat, studio_lng, instagram, instagram_permalink, facebook, links, x_url, shop, status, i18n_enabled, name_en, area_en, bio_en, profile_en, studio_visit_en";
export const artistWorkColumns = "id, artist_id, image_path, title, sort_order";

export async function fetchRemoteArtist(userId: string) {
  return remember(`artist:${userId}`, 30_000, () => loadRemoteArtist(userId));
}

async function loadRemoteArtist(userId: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) return { artist: null as ArtistDraft | null, works: [] as WorkDraft[], artistId: null as string | null };
  const { data } = await supabase.from("artists").select(artistDetailColumns).eq("profile_id", userId).maybeSingle();
  if (!data) return { artist: null, works: [], artistId: null };
  const { data: works } = await supabase
    .from("artist_works")
    .select(artistWorkColumns)
    .eq("artist_id", data.id)
    .order("sort_order");
  return {
    artist: rowToDraft(data),
    artistId: data.id as string,
    works:
      works?.map((work: Record<string, unknown>) => ({
        id: work.id as string,
        src: work.image_path as string,
        title: (work.title as string) ?? "",
      })) ?? [],
  };
}

function formatRemoteError(error: { message?: string; details?: string; hint?: string }) {
  return [error.message, error.details, error.hint].filter(Boolean).join(" ");
}

async function ensureCoverPath(userId: string, image: string) {
  const value = image.trim();
  if (!value || value.startsWith("blob:")) return "";
  if (!value.startsWith("data:")) return value;
  const supabase = createBrowserSupabase();
  if (!supabase) return value;
  const blob = await (await fetch(value)).blob();
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: blob.type || "image/webp",
  });
  if (error) {
    const retry = await supabase.storage.from("works").upload(path, blob, {
      contentType: blob.type || "image/webp",
    });
    if (retry.error) throw new Error(formatRemoteError(retry.error));
    return supabase.storage.from("works").getPublicUrl(path).data.publicUrl;
  }
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function upsertRemoteArtist(userId: string, draft: ArtistDraft) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const extra = serializeArtistLinks(draft.links);
  const coverPath = await ensureCoverPath(userId, draft.image);
  const payload = {
    profile_id: userId,
    slug: slugOf(draft.name, draft.slug),
    name: draft.name,
    reading: draft.reading,
    genre: formatArtistGenres(draft.genre),
    area: draft.area,
    bio: draft.bio,
    profile: draft.profile,
    cover_path: coverPath || null,
    studio_address: draft.studioName,
    studio_query: draft.studioMapUrl || draft.studioName,
    studio_visit: draft.studioVisit,
    studio_lat: draft.studioLat ? Number(draft.studioLat) : null,
    studio_lng: draft.studioLng ? Number(draft.studioLng) : null,
    instagram: draft.instagram,
    instagram_permalink: draft.instagramPermalink,
    facebook: draft.facebook,
    x_url: null,
    shop: extra.length ? JSON.stringify(extra) : null,
    i18n_enabled: Boolean(draft.i18nEnabled),
    name_en: draft.nameEn.trim() || null,
    area_en: draft.areaEn.trim() || null,
    bio_en: draft.bioEn.trim() || null,
    profile_en: draft.profileEn.trim() || null,
    studio_visit_en: draft.studioVisitEn.trim() || null,
  };
  const existing = await supabase.from("artists").select("id").eq("profile_id", userId).maybeSingle();
  const withoutI18n = (({
    i18n_enabled: _a,
    name_en: _b,
    area_en: _c,
    bio_en: _d,
    profile_en: _e,
    studio_visit_en: _f,
    ...rest
  }) => rest)(payload);
  let lastError: { message?: string; details?: string; hint?: string } | null = null;
  for (const row of [payload, withoutI18n]) {
    const { error } = existing.data
      ? await supabase.from("artists").update(row).eq("profile_id", userId)
      : await supabase.from("artists").insert({ ...row, status: "rejected" as const });
    if (!error) {
      forget(`artist:${userId}`);
      return;
    }
    lastError = error;
  }
  throw new Error(formatRemoteError(lastError ?? { message: "supabase" }));
}

export type AdminArtistRecord = {
  id: string;
  profileId: string | null;
  email: string;
  draft: ArtistDraft;
};

function rowToAdminArtist(row: Record<string, unknown>, email = ""): AdminArtistRecord {
  return {
    id: String(row.id ?? ""),
    profileId: row.profile_id ? String(row.profile_id) : null,
    email,
    draft: rowToDraft(row),
  };
}

async function emailsForAdminArtists(artistIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (artistIds.length === 0) return map;
  const supabase = createBrowserSupabase();
  if (!supabase) return map;

  const batch = await supabase.rpc("admin_emails_for_artists");
  if (batch.error || !Array.isArray(batch.data)) return map;
  for (const row of batch.data as { artist_id?: string; email?: string }[]) {
    if (row.artist_id && row.email) map.set(String(row.artist_id), String(row.email));
  }
  return map;
}

async function withAdminEmails(artists: AdminArtistRecord[]): Promise<AdminArtistRecord[]> {
  const emails = await emailsForAdminArtists(artists.map((artist) => artist.id));
  return artists.map((artist) => ({ ...artist, email: emails.get(artist.id) ?? "" }));
}

export async function fetchRemoteArtistsForAdmin(): Promise<AdminArtistRecord[]> {
  const supabase = createBrowserSupabase();
  if (!supabase) return [];
  let { data, error } = await supabase.from("artists").select(artistListColumns).order("name");
  if (error) {
    ({ data, error } = await supabase.from("artists").select("id, profile_id, slug, name, genre, area, status").order("name"));
  }
  if (error) throw error;
  return withAdminEmails((data ?? []).map((row: Record<string, unknown>) => rowToAdminArtist(row)));
}

export async function fetchRemoteArtistForAdmin(slugOrId: string): Promise<AdminArtistRecord | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const bySlug = await supabase.from("artists").select(artistDetailColumns).eq("slug", slugOrId).maybeSingle();
  const row = (bySlug.data ??
    (await supabase.from("artists").select(artistDetailColumns).eq("id", slugOrId).maybeSingle()).data) as
    | Record<string, unknown>
    | null;
  if (!row) return null;
  const [artist] = await withAdminEmails([rowToAdminArtist(row)]);
  return artist;
}

function artistWritePayload(draft: ArtistDraft, coverPath: string) {
  const extra = serializeArtistLinks(draft.links);
  return {
    slug: slugOf(draft.name, draft.slug),
    name: draft.name,
    reading: draft.reading,
    genre: formatArtistGenres(draft.genre),
    area: draft.area,
    bio: draft.bio,
    profile: draft.profile,
    cover_path: coverPath || null,
    studio_address: draft.studioName,
    studio_query: draft.studioMapUrl || draft.studioName,
    studio_visit: draft.studioVisit,
    studio_lat: draft.studioLat ? Number(draft.studioLat) : null,
    studio_lng: draft.studioLng ? Number(draft.studioLng) : null,
    instagram: draft.instagram,
    instagram_permalink: draft.instagramPermalink,
    facebook: draft.facebook,
    x_url: null,
    shop: extra.length ? JSON.stringify(extra) : null,
    status: draft.status,
    i18n_enabled: Boolean(draft.i18nEnabled),
    name_en: draft.nameEn.trim() || null,
    area_en: draft.areaEn.trim() || null,
    bio_en: draft.bioEn.trim() || null,
    profile_en: draft.profileEn.trim() || null,
    studio_visit_en: draft.studioVisitEn.trim() || null,
  };
}

export async function updateRemoteArtistForAdmin(artist: AdminArtistRecord, draft: ArtistDraft) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const coverPath = await ensureCoverPath(artist.profileId || artist.id, draft.image);
  const { error } = await supabase
    .from("artists")
    .update({ ...artistWritePayload(draft, coverPath), updated_at: new Date().toISOString() })
    .eq("id", artist.id);
  if (error) throw new Error(formatRemoteError(error));
  forget("artist");
}

export async function createRemoteArtistForAdmin(draft: ArtistDraft): Promise<AdminArtistRecord> {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const ownerId = crypto.randomUUID();
  const coverPath = await ensureCoverPath(ownerId, draft.image);
  const { data, error } = await supabase
    .from("artists")
    .insert({ ...artistWritePayload(draft, coverPath), profile_id: null })
    .select(artistDetailColumns)
    .single();
  if (error) throw new Error(formatRemoteError(error));
  return rowToAdminArtist(data as Record<string, unknown>);
}

export async function fetchPendingArtists() {
  const supabase = createBrowserSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("pending_artists_for_admin");
  if (error) throw error;
  return data ?? [];
}

export async function setRemoteArtistStatus(id: string, status: "approved" | "rejected") {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("artists").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function addRemoteWork(userId: string, artistId: string, file: File, title: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { compressImage } = await import("@/lib/image/compress");
  const blob = await compressImage(file);
  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("works").upload(path, blob, {
    contentType: "image/webp",
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("works").getPublicUrl(path);
  const { error } = await supabase.from("artist_works").insert({
    artist_id: artistId,
    image_path: data.publicUrl,
    title,
  });
  if (error) throw error;
  forget(`artist:${userId}`);
}

export async function deleteRemoteWork(id: string, userId?: string) {
  const supabase = createBrowserSupabase();
  if (!supabase) throw new Error("supabase");
  const { error } = await supabase.from("artist_works").delete().eq("id", id);
  if (error) throw error;
  if (userId) forget(`artist:${userId}`);
  else forget("artist");
}

export { emptyDraft };
