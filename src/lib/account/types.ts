import { defaultArtistGenres } from "@/data/site";

export const PREVIEW_COOKIE = "hy_preview";

export function previewSession(id: string): SessionUser | null {
  if (id === "preview-admin") {
    return {
      id,
      email: "admin@preview.local",
      name: "運営",
      role: "admin",
      artistStatus: "none",
      source: "preview",
    };
  }
  if (id === "preview-artist") {
    return {
      id,
      email: "artist@preview.local",
      name: "プレビュー作家",
      role: "artist",
      artistStatus: "approved",
      artistSlug: id,
      source: "preview",
    };
  }
  if (id === "preview-visitor") {
    return {
      id,
      email: "visitor@preview.local",
      name: "プレビュー来訪者",
      role: "visitor",
      artistStatus: "none",
      source: "preview",
    };
  }
  return null;
}

export type UserRole = "visitor" | "artist" | "admin";
export type ArtistStatus = "none" | "pending" | "approved" | "rejected";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  artistStatus: ArtistStatus;
  artistSlug?: string;
  source: "supabase" | "preview";
};

export type ArtistLink = {
  id: string;
  name: string;
  url: string;
};

export type ArtistDraft = {
  slug: string;
  name: string;
  reading: string;
  genre: string;
  area: string;
  bio: string;
  profile: string;
  studioName: string;
  studioMapUrl: string;
  studioVisit: string;
  studioLat: string;
  studioLng: string;
  instagram: string;
  instagramPermalink: string;
  facebook: string;
  links: ArtistLink[];
  image: string;
  status: Exclude<ArtistStatus, "none">;
  i18nEnabled: boolean;
  nameEn: string;
  areaEn: string;
  bioEn: string;
  profileEn: string;
  studioVisitEn: string;
};

export type WorkDraft = {
  id: string;
  src: string;
  title: string;
};

export const genres = defaultArtistGenres;

export function parseArtistGenres(value: unknown): string[] {
  const rows: string[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = String(item ?? "").trim();
      if (name) rows.push(name);
    }
  } else {
    const text = String(value ?? "").trim();
    if (text.startsWith("[")) {
      try {
        return parseArtistGenres(JSON.parse(text));
      } catch {
        /* fall through */
      }
    }
    if (text) {
      for (const item of text.split(/\s*(?:、|,|／|\/)\s*/)) {
        const name = item.trim();
        if (name) rows.push(name);
      }
    }
  }
  const seen = new Set<string>();
  return rows.filter((name) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

export function formatArtistGenres(value: unknown): string {
  return parseArtistGenres(value).join("、");
}

export const emptyDraft = (): ArtistDraft => ({
  slug: "",
  name: "",
  reading: "",
  genre: "",
  area: "",
  bio: "",
  profile: "",
  studioName: "",
  studioMapUrl: "",
  studioVisit: "",
  studioLat: "",
  studioLng: "",
  instagram: "",
  instagramPermalink: "",
  facebook: "",
  links: [],
  image: "",
  status: "approved",
  i18nEnabled: false,
  nameEn: "",
  areaEn: "",
  bioEn: "",
  profileEn: "",
  studioVisitEn: "",
});

export function newArtistLink(): ArtistLink {
  return {
    id: `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    url: "",
  };
}

function linkKey(name: string, url: string) {
  return `${name.trim()}|${url.trim()}`;
}

export function parseArtistLinks(value: unknown, extras: { name: string; url: string }[] = []): ArtistLink[] {
  const rows: { name: string; url: string }[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const name = String(record.name ?? record.title ?? "");
      const url = String(record.url ?? record.href ?? "");
      if (name.trim() || url.trim()) rows.push({ name, url });
    }
  }
  const seen = new Set(rows.map((row) => linkKey(row.name, row.url)));
  for (const extra of extras) {
    if (!extra.url.trim() || seen.has(linkKey(extra.name, extra.url))) continue;
    rows.push(extra);
    seen.add(linkKey(extra.name, extra.url));
  }
  return rows.map((row) => ({ ...newArtistLink(), name: row.name, url: row.url }));
}

export function serializeArtistLinks(links: ArtistLink[]) {
  return links
    .map((link) => ({ name: link.name.trim(), url: link.url.trim() }))
    .filter((link) => link.name || link.url);
}

function parseShopField(value: unknown): { links: unknown; shopUrl: string } {
  if (Array.isArray(value)) return { links: value, shopUrl: "" };
  const text = String(value ?? "").trim();
  if (text.startsWith("[")) {
    try {
      return { links: JSON.parse(text), shopUrl: "" };
    } catch {
      return { links: [], shopUrl: text };
    }
  }
  return { links: [], shopUrl: text };
}

export function normalizeArtistDraft(raw: Record<string, unknown>): ArtistDraft {
  const base = emptyDraft();
  const shop = parseShopField(raw.shop);
  return {
    ...base,
    slug: String(raw.slug ?? base.slug),
    name: String(raw.name ?? base.name),
    reading: String(raw.reading ?? base.reading),
    genre: formatArtistGenres(raw.genre ?? raw.genres ?? ""),
    area: String(raw.area ?? base.area),
    bio: String(raw.bio ?? base.bio),
    profile: String(raw.profile ?? base.profile),
    studioName: String(raw.studioName ?? raw.studioAddress ?? base.studioName),
    studioMapUrl: String(raw.studioMapUrl ?? raw.studioQuery ?? base.studioMapUrl),
    studioVisit: String(raw.studioVisit ?? base.studioVisit),
    studioLat: String(raw.studioLat ?? base.studioLat),
    studioLng: String(raw.studioLng ?? base.studioLng),
    instagram: String(raw.instagram ?? base.instagram),
    instagramPermalink: String(raw.instagramPermalink ?? base.instagramPermalink),
    facebook: String(raw.facebook ?? base.facebook),
    image: String(raw.image ?? raw.cover_path ?? base.image),
    links: parseArtistLinks(
      Array.isArray(raw.links) && raw.links.length ? raw.links : shop.links,
      [
        { name: "X", url: String(raw.x ?? "") },
        { name: "Shop", url: shop.shopUrl },
      ],
    ),
    status: (raw.status as ArtistDraft["status"]) ?? base.status,
    i18nEnabled: Boolean(raw.i18nEnabled ?? raw.i18n_enabled),
    nameEn: String(raw.nameEn ?? raw.name_en ?? ""),
    areaEn: String(raw.areaEn ?? raw.area_en ?? ""),
    bioEn: String(raw.bioEn ?? raw.bio_en ?? ""),
    profileEn: String(raw.profileEn ?? raw.profile_en ?? ""),
    studioVisitEn: String(raw.studioVisitEn ?? raw.studio_visit_en ?? ""),
  };
}
