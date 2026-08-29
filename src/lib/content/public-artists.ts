import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { village, type Artist } from "@/data/site";
import { normalizeArtistDraft, serializeArtistLinks } from "@/lib/account/types";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { createPublicSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type WorkRow = {
  artist_id?: string;
  image_path: string;
  title: string | null;
  sort_order?: number | null;
};

function publicArtistFromRow(row: Record<string, unknown>, works: WorkRow[]): Artist {
  const draft = normalizeArtistDraft({
    slug: row.slug,
    name: row.name,
    reading: row.reading,
    genre: row.genre,
    area: row.area,
    bio: row.bio,
    profile: row.profile,
    studioName: row.studio_address,
    studioMapUrl: row.studio_query,
    studioVisit: row.studio_visit,
    studioLat: row.studio_lat,
    studioLng: row.studio_lng,
    instagram: row.instagram,
    instagramPermalink: row.instagram_permalink,
    facebook: row.facebook,
    links: row.links,
    image: row.cover_path,
    x: row.x_url,
    shop: row.shop,
    status: row.status,
    i18nEnabled: row.i18n_enabled,
    nameEn: row.name_en,
    areaEn: row.area_en,
    bioEn: row.bio_en,
    profileEn: row.profile_en,
    studioVisitEn: row.studio_visit_en,
  });
  const lat = Number(draft.studioLat);
  const lng = Number(draft.studioLng);
  return {
    slug: draft.slug,
    name: draft.name,
    reading: draft.reading,
    genre: draft.genre,
    area: draft.area,
    bio: draft.bio,
    profile: draft.profile,
    image: draft.image,
    studio: {
      lat: Number.isFinite(lat) && lat !== 0 ? lat : village.lat,
      lng: Number.isFinite(lng) && lng !== 0 ? lng : village.lng,
      address: draft.studioName,
      query: draft.studioMapUrl || draft.studioName,
      visit: draft.studioVisit,
    },
    works: works.map((work) => ({
      src: String(work.image_path ?? ""),
      title: String(work.title ?? ""),
    })),
    instagram: draft.instagram || undefined,
    instagramPermalink: draft.instagramPermalink || undefined,
    facebook: draft.facebook || undefined,
    links: serializeArtistLinks(draft.links),
    i18nEnabled: draft.i18nEnabled,
    nameEn: draft.nameEn,
    areaEn: draft.areaEn,
    bioEn: draft.bioEn,
    profileEn: draft.profileEn,
    studioVisitEn: draft.studioVisitEn,
  };
}

const artistListColumns =
  "id, slug, name, genre, area, cover_path, status, studio_lat, studio_lng, studio_address, studio_query, i18n_enabled, name_en, area_en, bio_en";
const artistDetailColumns =
  "id, slug, name, reading, genre, area, bio, profile, cover_path, studio_address, studio_query, studio_visit, studio_lat, studio_lng, instagram, instagram_permalink, facebook, links, x_url, shop, status, i18n_enabled, name_en, area_en, bio_en, profile_en, studio_visit_en";
const artistWorkColumns = "artist_id, image_path, title, sort_order";

async function fetchPublicArtists(): Promise<Artist[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    let { data, error } = await supabase.from("artists").select(artistListColumns).eq("status", "approved");
    if (error) {
      const fallback =
        "id, slug, name, genre, area, cover_path, status, studio_lat, studio_lng, studio_address, studio_query";
      const retry = await supabase.from("artists").select(fallback).eq("status", "approved");
      data = retry.data as typeof data;
      error = retry.error;
    }
    if (error || !data) return [];
    return data.filter((row) => row.slug).map((row) => publicArtistFromRow(row, []));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export const loadPublicArtists = unstable_cache(fetchPublicArtists, ["public-artists"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-artists"],
});

export type PublicArtistName = { name: string; genre: string; i18nEnabled?: boolean; nameEn?: string };

async function fetchPublicArtistNames(): Promise<Record<string, PublicArtistName>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return {};
    let { data, error } = await supabase.from("artists").select("slug, name, genre, i18n_enabled, name_en").eq("status", "approved");
    if (error) {
      const retry = await supabase.from("artists").select("slug, name, genre").eq("status", "approved");
      data = retry.data as typeof data;
      error = retry.error;
    }
    if (error || !data) return {};
    return Object.fromEntries(
      data
        .filter((row) => row.slug)
        .map((row) => [
          String(row.slug),
          {
            name: String(row.name ?? ""),
            genre: String(row.genre ?? ""),
            i18nEnabled: Boolean(row.i18n_enabled),
            nameEn: String(row.name_en ?? ""),
          },
        ]),
    );
  } catch (error) {
    unstable_rethrow(error);
    return {};
  }
}

export const loadPublicArtistNames = unstable_cache(fetchPublicArtistNames, ["public-artist-names"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-artists"],
});

export async function loadPublicArtist(slug: string): Promise<Artist | undefined> {
  return loadPublicArtistBySlug(slug);
}

async function fetchPublicArtist(slug: string): Promise<Artist | undefined> {
  if (!isSupabaseConfigured() || !slug) return undefined;
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return undefined;
    let { data, error } = await supabase
      .from("artists")
      .select(artistDetailColumns)
      .eq("status", "approved")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      const fallback =
        "id, slug, name, reading, genre, area, bio, profile, cover_path, studio_address, studio_query, studio_visit, studio_lat, studio_lng, instagram, instagram_permalink, facebook, links, x_url, shop, status";
      ({ data, error } = await supabase
        .from("artists")
        .select(fallback)
        .eq("status", "approved")
        .eq("slug", slug)
        .maybeSingle());
    }
    if (error || !data) return undefined;
    const { data: works } = await supabase
      .from("artist_works")
      .select(artistWorkColumns)
      .eq("artist_id", data.id)
      .order("sort_order");
    return publicArtistFromRow(data, (works ?? []) as WorkRow[]);
  } catch (error) {
    unstable_rethrow(error);
    return undefined;
  }
}

const loadPublicArtistBySlug = unstable_cache(fetchPublicArtist, ["public-artist"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-artists"],
});
