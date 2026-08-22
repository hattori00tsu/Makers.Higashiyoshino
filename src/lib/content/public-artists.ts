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
  };
}

async function fetchPublicArtists(): Promise<Artist[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.from("artists").select("*").eq("status", "approved");
    if (error || !data) return [];
    const ids = data.map((row) => row.id as string);
    const { data: works } = ids.length
      ? await supabase.from("artist_works").select("*").in("artist_id", ids).order("sort_order")
      : { data: [] as WorkRow[] };
    const byArtist = new Map<string, WorkRow[]>();
    for (const work of works ?? []) {
      const id = String((work as WorkRow).artist_id ?? "");
      const list = byArtist.get(id) ?? [];
      list.push(work as WorkRow);
      byArtist.set(id, list);
    }
    return data
      .filter((row) => row.slug)
      .map((row) => publicArtistFromRow(row, byArtist.get(String(row.id)) ?? []));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export const loadPublicArtists = unstable_cache(fetchPublicArtists, ["public-artists"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-artists"],
});

export type PublicArtistName = { name: string; genre: string };

async function fetchPublicArtistNames(): Promise<Record<string, PublicArtistName>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return {};
    const { data, error } = await supabase.from("artists").select("slug, name, genre").eq("status", "approved");
    if (error || !data) return {};
    return Object.fromEntries(
      data
        .filter((row) => row.slug)
        .map((row) => [
          String(row.slug),
          { name: String(row.name ?? ""), genre: String(row.genre ?? "") },
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
  const items = await loadPublicArtists();
  return items.find((artist) => artist.slug === slug);
}
