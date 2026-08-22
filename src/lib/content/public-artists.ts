import { village, type Artist } from "@/data/site";
import { normalizeArtistDraft, serializeArtistLinks } from "@/lib/account/types";
import { createServerSupabase } from "@/lib/supabase/server";
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
      src: work.image_path,
      title: work.title ?? "",
    })),
    instagram: draft.instagram || undefined,
    instagramPermalink: draft.instagramPermalink || undefined,
    facebook: draft.facebook || undefined,
    links: serializeArtistLinks(draft.links),
  };
}

export async function loadPublicArtists(): Promise<Artist[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
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
  } catch {
    return [];
  }
}

export async function loadPublicArtist(slug: string): Promise<Artist | undefined> {
  const items = await loadPublicArtists();
  return items.find((artist) => artist.slug === slug);
}
