import { eachDateKey } from "@/lib/dates";
import { isGoogleMapsUrl } from "@/lib/maps-url";

export const site = {
  name: "makers higashiyoshino",
  shortName: "makers higashiyoshino",
  description:
    "東吉野村には、およそ十年前から、工芸作家、写真家、物書きといったつくり手が少しずつ移り住んできました。",
};

export const nav = [
  { href: "/events", label: "催し" },
  { href: "/artists", label: "つくり手" },
  { href: "/map", label: "地図" },
  { href: "/news", label: "お知らせ" },
] as const;

export const defaultEventCategories = ["開放", "展示", "ワークショップ", "音楽"];
export const defaultArtistGenres = ["陶芸", "木工", "染色", "写真", "和紙", "絵画", "その他"];
export const defaultSpotCategories = ["食事", "宿", "駐車", "その他"];
export type EventCategory = string;
export type PublishStatus = "draft" | "published" | "cancelled";
export type EventKind = "festival" | "venue" | "program";

export type NamedLink = {
  title: string;
  url: string;
};

export type PlaceOption = {
  id: string;
  title: string;
  titleEn?: string;
  url: string;
};

export type EventSession = {
  startsAt: string;
  endsAt: string;
  capacity?: number | null;
};

export type EventItem = {
  slug: string;
  title: string;
  categories: string[];
  summary: string;
  description: string;
  venues: PlaceOption[];
  access: string;
  parkings: PlaceOption[];
  image: string;
  /** 個別ページ中央のギャラリー。最大4枚 */
  gallery?: string[];
  /** 料金。空欄なら公開ページには出さない */
  price?: string;
  isOutdoor: boolean;
  capacity: number | null;
  requiresReservation?: boolean;
  status?: PublishStatus;
  sessions: EventSession[];
  artistSlugs: string[];
  /** 総合開催／会場への任意の所属。個別の催しは別物 */
  parentSlug?: string;
  /** 総合開催。日付だけで、時刻は出さない */
  allDay?: boolean;
  /** festival=総合開催, venue=会場, program=個別の催し */
  kind?: EventKind;
  /** 年をまたぐ系統。年号は入れない */
  series?: string;
  /** つくり手が作った個別催しの主催者 */
  ownerArtistSlug?: string;
  /** 英語の文章を公開する */
  i18nEnabled?: boolean;
  titleEn?: string;
  summaryEn?: string;
  descriptionEn?: string;
  accessEn?: string;
  priceEn?: string;
};

export const defaultEventImage = "/images/event-fair.jpg";
export const defaultArtistImage = "/images/artist-pottery.jpg";

export function eventCover(src?: string | null) {
  const next = src?.trim() ?? "";
  if (!next || next === defaultEventImage) return "";
  return next;
}

export const maxEventGallery = 4;

export function eventGallery(event: Pick<EventItem, "gallery">) {
  return (event.gallery ?? []).map((src) => String(src ?? "").trim()).filter(Boolean).slice(0, maxEventGallery);
}

export function parseImageList(value: unknown, limit = maxEventGallery): string[] {
  const raw: string[] = [];
  if (Array.isArray(value)) {
    raw.push(...value.map(String));
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) raw.push(...parsed.map(String));
      } catch {
        raw.push(trimmed);
      }
    } else {
      raw.push(trimmed);
    }
  }
  return [...new Set(raw.map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

export function eventCategoryLabel(categories?: string[]) {
  return categories?.length ? categories.join(" · ") : "催し";
}

export function eventVenueLabel(venues?: PlaceOption[]) {
  return (venues ?? []).map((item) => item.title).filter(Boolean).join("、");
}

export function eventPriceLabel(event: Pick<EventItem, "price">) {
  return event.price?.trim() ?? "";
}

/** 個別の催しの会場・駐車場は、所属する会場（なければ総合開催）のものを使う */
export function eventPlaces(event: EventItem, items: EventItem[] = []) {
  if (inferEventKind(event, items) !== "program") {
    return {
      venues: event.venues ?? [],
      parkings: event.parkings ?? [],
      access: event.access ?? "",
    };
  }
  const host = [...eventLineage(event, items)].reverse().find(
    (item) => item.venues?.length || item.parkings?.length,
  );
  return {
    venues: host?.venues?.length ? host.venues : event.venues ?? [],
    parkings: host?.parkings?.length ? host.parkings : event.parkings ?? [],
    access: event.access?.trim() || host?.access || "",
  };
}

export function emptyNamedLink(): NamedLink {
  return { title: "", url: "" };
}

export function emptyPlace(title = ""): PlaceOption {
  return { id: "", title, titleEn: "", url: "" };
}

export function newPlaceId() {
  return `place-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function placeOption(id: string, title: string, query: string): PlaceOption {
  return { id, title, url: googleMapsSearchUrl(query) };
}

export function parseEventCategories(value: unknown): string[] {
  const raw: string[] = [];
  if (Array.isArray(value)) {
    raw.push(...value.map(String));
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) raw.push(...parsed.map(String));
      } catch {
        raw.push(trimmed);
      }
    } else if (trimmed) {
      raw.push(...trimmed.split(/[,、]/).map((item) => item.trim()).filter(Boolean));
    }
  }
  return [...new Set(raw.map((item) => item.trim()).filter(Boolean))];
}

export function parseNamedLink(value: unknown, fallbackTitle = ""): NamedLink {
  if (value && typeof value === "object") {
    const item = value as { title?: unknown; url?: unknown };
    if (typeof item.title === "string" || typeof item.url === "string") {
      return { title: String(item.title ?? fallbackTitle), url: String(item.url ?? "") };
    }
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return { title: fallbackTitle, url: "" };
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return parseNamedLink(JSON.parse(trimmed) as unknown, fallbackTitle);
      } catch {
        return { title: trimmed, url: "" };
      }
    }
    return { title: trimmed, url: "" };
  }
  return { title: fallbackTitle, url: "" };
}

export function parsePlace(value: unknown, fallbackUrl = ""): PlaceOption | null {
  if (value && typeof value === "object") {
    const item = value as {
      id?: unknown;
      title?: unknown;
      titleEn?: unknown;
      title_en?: unknown;
      url?: unknown;
      name?: unknown;
      query?: unknown;
    };
    const title = String(item.title || item.name || item.query || "").trim();
    const titleEn = String(item.titleEn ?? item.title_en ?? "").trim();
    const url = String(item.url || fallbackUrl);
    if (!title && !url) return null;
    return {
      id: String(item.id || title),
      title: title || "場所",
      titleEn,
      url,
    };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsePlace(parsed[0], fallbackUrl);
        return parsePlace(parsed, fallbackUrl);
      } catch {
        return { id: trimmed, title: trimmed, url: fallbackUrl };
      }
    }
    return { id: trimmed, title: trimmed, url: fallbackUrl };
  }
  return null;
}

export function parsePlaceList(value: unknown, fallbackUrl = ""): PlaceOption[] {
  if (Array.isArray(value)) {
    return value.map((item) => parsePlace(item, fallbackUrl)).filter((item): item is PlaceOption => Boolean(item));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsePlaceList(parsed, fallbackUrl);
      } catch {
        /* fall through */
      }
    }
  }
  const single = parsePlace(value, fallbackUrl);
  return single ? [single] : [];
}

/** 東吉野村役場付近。天候APIと地図の基準点 */
export const village = {
  lat: 34.4036,
  lng: 135.9685,
  name: "東吉野村",
  mapsUrl: "https://maps.app.goo.gl/yzYgyptexkrQUKtB6",
};

/** 村内マップ（/map）。maps.app.goo.gl は iframe にできないので、同じ場所の埋め込みURLを使う */
export const villageMapPlace = {
  name: "OKUYAMA HOUSE",
  mapsUrl: "https://maps.app.goo.gl/yzYgyptexkrQUKtB6",
  embedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d400!2d136.0156155!3d34.3794352!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f18!3m3!1m2!1s0x6006b9783c1815e1%3A0x5a07633e1fa5ee91!2z44GK44GP5bGx44OP44Km44K544O744Go6Zm25pq_44K544K_44K444KqLeODquODneOCug!5e0!3m2!1sja!2sjp",
};

export type ArtistWork = {
  src: string;
  title: string;
};

export type Artist = {
  slug: string;
  name: string;
  reading: string;
  genre: string;
  area: string;
  bio: string;
  profile: string;
  image: string;
  studio: {
    lat: number;
    lng: number;
    address: string;
    query: string;
    visit: string;
  };
  works: ArtistWork[];
  instagram?: string;
  instagramPermalink?: string;
  facebook?: string;
  links?: { name: string; url: string }[];
  x?: string;
  shop?: string;
  i18nEnabled?: boolean;
  nameEn?: string;
  areaEn?: string;
  bioEn?: string;
  profileEn?: string;
  studioVisitEn?: string;
};

export const artists: Artist[] = [];

export const events: EventItem[] = [];

export type SpotItem = {
  category: string;
  name: string;
  note: string;
  place: string;
  mapsUrl: string;
};

export const spots: SpotItem[] = [];

export function emptySpot(): SpotItem {
  return {
    category: defaultSpotCategories[0],
    name: "",
    note: "",
    place: "",
    mapsUrl: "",
  };
}

export function normalizeSpot(raw: unknown): SpotItem {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = String(item.name ?? "").trim();
  const query = String(item.query ?? "").trim();
  const place = String(item.place ?? "").trim();
  const mapsUrl = String(item.mapsUrl ?? item.maps_url ?? "").trim();
  const queryIsUrl = isGoogleMapsUrl(query);
  return {
    category: String(item.category ?? "その他") || "その他",
    name,
    note: String(item.note ?? ""),
    place: place || (queryIsUrl ? "" : query),
    mapsUrl: mapsUrl || (queryIsUrl ? query : ""),
  };
}

export function spotMapsUrl(spot: SpotItem) {
  if (isGoogleMapsUrl(spot.mapsUrl)) return spot.mapsUrl;
  const q = spot.place.trim() || spot.name.trim();
  return q ? googleMapsSearchUrl(q) : village.mapsUrl;
}

export function isPublished(event: EventItem) {
  return (event.status ?? "published") === "published";
}

export function normalizeEvent(raw: object): EventItem {
  const data = raw as Record<string, unknown>;
  const mapFallback = parseNamedLink(data.map);
  const venues = parsePlaceList(data.venues ?? data.venue, mapFallback.url);
  const parkings = parsePlaceList(data.parkings ?? data.parking);
  const owner = data.ownerArtistSlug || data.owner_artist_slug;
  return {
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    categories: parseEventCategories(data.categories ?? data.category),
    summary: String(data.summary ?? ""),
    description: String(data.description ?? ""),
    venues: venues.length ? venues : parsePlaceList(mapFallback.title ? mapFallback : "", mapFallback.url),
    access: String(data.access ?? ""),
    parkings,
    image: String(data.image ?? data.image_path ?? ""),
    gallery: parseImageList(data.gallery ?? data.gallery_paths),
    price: String(data.price ?? ""),
    isOutdoor: Boolean(data.isOutdoor),
    capacity: typeof data.capacity === "number" ? data.capacity : null,
    requiresReservation: Boolean(data.requiresReservation),
    status: (data.status as EventItem["status"]) ?? "published",
    sessions: parseEventSessions(
      data.sessions,
      typeof data.capacity === "number" ? data.capacity : null,
    ),
    artistSlugs: Array.isArray(data.artistSlugs) ? (data.artistSlugs as string[]) : [],
    parentSlug: data.parentSlug || data.parent_slug ? String(data.parentSlug || data.parent_slug) : undefined,
    allDay: Boolean(data.allDay ?? data.all_day),
    kind: parseEventKind(data.kind),
    series: parseEventSeries(data.series),
    ownerArtistSlug: owner ? String(owner) : undefined,
    i18nEnabled: Boolean(data.i18nEnabled ?? data.i18n_enabled),
    titleEn: String(data.titleEn ?? data.title_en ?? ""),
    summaryEn: String(data.summaryEn ?? data.summary_en ?? ""),
    descriptionEn: String(data.descriptionEn ?? data.description_en ?? ""),
    accessEn: String(data.accessEn ?? data.access_en ?? ""),
    priceEn: String(data.priceEn ?? data.price_en ?? ""),
  };
}

export function parseEventSeries(value: unknown) {
  const next = String(value ?? "").trim();
  return next || undefined;
}

export function parseEventKind(value: unknown): EventKind | undefined {
  if (value === "festival" || value === "venue" || value === "program") return value;
  return undefined;
}

export function parseEventSessions(value: unknown, fallbackCapacity: number | null = null): EventSession[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ startsAt: "", endsAt: "", capacity: fallbackCapacity }];
  }
  const parsed = value.map((item) => {
    if (!item || typeof item !== "object") {
      return { startsAt: "", endsAt: "", capacity: null as number | null };
    }
    const row = item as Record<string, unknown>;
    const rawCapacity = row.capacity;
    return {
      startsAt: String(row.startsAt ?? row.starts_at ?? ""),
      endsAt: String(row.endsAt ?? row.ends_at ?? ""),
      capacity: typeof rawCapacity === "number" && rawCapacity > 0 ? rawCapacity : null,
    };
  });
  if (parsed.some((session) => session.capacity != null)) return parsed;
  return parsed.map((session) => ({ ...session, capacity: fallbackCapacity }));
}

export function sessionCapacity(session: EventSession, event?: Pick<EventItem, "capacity">) {
  if (typeof session.capacity === "number" && session.capacity > 0) return session.capacity;
  if (typeof event?.capacity === "number" && event.capacity > 0) return event.capacity;
  return null;
}

export function eventHasSessionCapacity(event: EventItem) {
  return event.sessions.some((session) => sessionCapacity(session, event) != null);
}

export function needsReservation(event: EventItem) {
  if (event.kind === "festival" || event.kind === "venue") return false;
  return Boolean(event.requiresReservation || eventHasSessionCapacity(event));
}

export function isTopLevel(event: EventItem) {
  return !event.parentSlug;
}

export function childEventsOf(parentSlug: string, items: EventItem[] = events) {
  return items
    .filter((event) => event.parentSlug === parentSlug && isPublished(event))
    .sort(
      (a, b) =>
        new Date(a.sessions[0]?.startsAt ?? 0).getTime() -
        new Date(b.sessions[0]?.startsAt ?? 0).getTime(),
    );
}

export function eventDepth(event: EventItem, items: EventItem[]): number {
  let depth = 0;
  let current = event;
  const seen = new Set<string>();
  while (current.parentSlug) {
    if (seen.has(current.slug)) break;
    seen.add(current.slug);
    const parent = items.find((item) => item.slug === current.parentSlug);
    if (!parent) break;
    depth += 1;
    current = parent;
    if (depth > 8) break;
  }
  return depth;
}

export function eventLineage(event: EventItem, items: EventItem[]): EventItem[] {
  const chain: EventItem[] = [];
  let current = event;
  const seen = new Set<string>();
  while (current.parentSlug) {
    if (seen.has(current.slug)) break;
    seen.add(current.slug);
    const parent = items.find((item) => item.slug === current.parentSlug);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
    if (chain.length > 8) break;
  }
  return chain;
}

export function descendantSlugs(slug: string, items: EventItem[]) {
  const out = new Set<string>();
  const walk = (parent: string) => {
    for (const item of items) {
      if (item.parentSlug === parent && !out.has(item.slug)) {
        out.add(item.slug);
        walk(item.slug);
      }
    }
  };
  walk(slug);
  return out;
}

export function subtreeHeight(slug: string, items: EventItem[]): number {
  const children = items.filter((item) => item.parentSlug === slug);
  if (children.length === 0) return 0;
  return 1 + Math.max(...children.map((child) => subtreeHeight(child.slug, items)));
}

export type NestRole = "root" | "venue" | "program";

export function inferEventKind(event: EventItem, items: EventItem[]): EventKind {
  if (event.kind === "festival" || event.kind === "venue" || event.kind === "program") {
    return event.kind;
  }
  const depth = eventDepth(event, items);
  if (depth >= 2) return "program";
  if (depth === 1) {
    const hasChildren = items.some((item) => item.parentSlug === event.slug);
    if (hasChildren || event.allDay) return "venue";
    return "program";
  }
  if (event.parentSlug) {
    const hasChildren = items.some((item) => item.parentSlug === event.slug);
    return hasChildren || event.allDay ? "venue" : "program";
  }
  const hasChildren = items.some((item) => item.parentSlug === event.slug);
  if (event.allDay || hasChildren) return "festival";
  return "program";
}

export function nestRole(event: EventItem, items: EventItem[]): NestRole {
  const kind = inferEventKind(event, items);
  if (kind === "program") return "program";
  if (kind === "venue") return "venue";
  return "root";
}

export function eventKindLabel(kind: EventKind) {
  if (kind === "festival") return "総合開催";
  if (kind === "venue") return "会場";
  return "個別の催し";
}

export function nestRoleLabel(role: NestRole, hasChildren = false) {
  if (role === "program") return "個別の催し";
  if (role === "venue") return "会場";
  return hasChildren ? "総合開催" : "個別の催し";
}

export function withInferredKind(event: EventItem, items: EventItem[]): EventItem {
  return { ...event, kind: inferEventKind(event, items) };
}

export function childrenOfKind(parentSlug: string, kind: EventKind, items: EventItem[]) {
  return items
    .filter((event) => event.parentSlug === parentSlug && inferEventKind(event, items) === kind && isPublished(event))
    .sort(bySessionDate);
}

function bySessionDate(a: EventItem, b: EventItem) {
  return (
    new Date(a.sessions[0]?.startsAt ?? 0).getTime() -
    new Date(b.sessions[0]?.startsAt ?? 0).getTime()
  );
}

function hasPublishedChildren(slug: string, items: EventItem[]) {
  return items.some((item) => item.parentSlug === slug && isPublished(item));
}

function looksLikeWorkshop(event: EventItem) {
  return Boolean(
    event.kind === "program" ||
      event.ownerArtistSlug ||
      event.requiresReservation ||
      event.artistSlugs.length > 0 ||
      eventHasSessionCapacity(event),
  );
}

function sessionsOverlap(a: EventItem, b: EventItem) {
  const keys = new Set(
    a.sessions.flatMap((session) => eachDateKey(session.startsAt, session.endsAt)),
  );
  if (keys.size === 0) return false;
  return b.sessions.some((session) =>
    eachDateKey(session.startsAt, session.endsAt).some((key) => keys.has(key)),
  );
}

function sharesPlace(a: EventItem, b: EventItem) {
  const keys = new Set(
    a.venues.flatMap((place) => [place.id, place.title, place.url].filter(Boolean).map(String)),
  );
  if (keys.size === 0) return false;
  return b.venues.some(
    (place) => keys.has(place.id) || keys.has(place.title) || (place.url && keys.has(place.url)),
  );
}

function isContainerKind(event: EventItem) {
  return event.kind === "festival" || event.kind === "venue";
}

/** 会場として扱う直下の子。子どもを持つもの、または空の会場枠。 */
export function venueChildren(parentSlug: string, items: EventItem[]) {
  return items
    .filter((event) => {
      if (event.parentSlug !== parentSlug || !isPublished(event)) return false;
      if (event.kind === "program" || looksLikeWorkshop(event)) return false;
      if (hasPublishedChildren(event.slug, items)) return true;
      return event.kind === "venue";
    })
    .sort(bySessionDate);
}

/** 総合開催なら配下会場の個別催しも含め、会場ならその会場の個別催し。親子関係を優先する。 */
export function programsUnder(hostSlug: string, items: EventItem[]) {
  const published = items.filter(isPublished);
  const host = published.find((item) => item.slug === hostSlug);
  const venues = new Set(venueChildren(hostSlug, published).map((item) => item.slug));
  const fromTree = published.filter((item) => {
    if (item.slug === hostSlug || venues.has(item.slug)) return false;
    if (isContainerKind(item) && hasPublishedChildren(item.slug, published)) return false;
    if (item.parentSlug === hostSlug) return true;
    if (item.parentSlug && venues.has(item.parentSlug)) return true;
    return eventLineage(item, published).some((ancestor) => ancestor.slug === hostSlug);
  });
  const seen = new Set(fromTree.map((item) => item.slug));
  const extras = host
    ? published.filter((item) => {
        if (seen.has(item.slug) || item.slug === hostSlug || venues.has(item.slug)) return false;
        if (isContainerKind(item) && (hasPublishedChildren(item.slug, published) || item.kind === "festival")) {
          return false;
        }
        const lineage = eventLineage(item, published);
        if (lineage.some((ancestor) => ancestor.slug === hostSlug)) return false;
        if (item.parentSlug && item.parentSlug !== hostSlug && !venues.has(item.parentSlug)) {
          const root = lineage[0];
          if (root && root.slug !== hostSlug && inferEventKind(root, published) === "festival") return false;
        }
        if (host.kind === "venue" || inferEventKind(host, published) === "venue") {
          return sessionsOverlap(host, item) && (sharesPlace(host, item) || !item.parentSlug);
        }
        return sessionsOverlap(host, item);
      })
    : [];
  return [...fromTree, ...extras].sort(bySessionDate);
}

export function canEditArtistEvent(event: EventItem, artistSlug?: string | null, isAdmin = false) {
  if (isAdmin) return true;
  if (!artistSlug) return false;
  if (event.kind === "festival" || event.kind === "venue") return false;
  return event.artistSlugs.includes(artistSlug) || event.ownerArtistSlug === artistSlug;
}

export function eventsManagedByArtist(slug: string, items: EventItem[]) {
  return items.filter(
    (event) => event.ownerArtistSlug === slug || event.artistSlugs.includes(slug),
  );
}

export function eventAncestorTitle(event: EventItem, items: EventItem[]) {
  return eventLineage(event, items)
    .map((item) => item.title)
    .join(" / ");
}

export function eventPathTitle(event: EventItem, items: EventItem[]) {
  const ancestor = eventAncestorTitle(event, items);
  return ancestor ? `${ancestor} / ${event.title}` : event.title;
}

export function validParentCandidates(event: EventItem, items: EventItem[]) {
  const kind = inferEventKind(event, items);
  if (kind === "festival") return [];
  const blocked = descendantSlugs(event.slug, items);
  return items.filter((item) => {
    if (item.slug === event.slug || blocked.has(item.slug)) return false;
    const parentKind = inferEventKind(item, items);
    if (kind === "venue") return parentKind === "festival";
    return parentKind === "festival" || parentKind === "venue";
  });
}

export function getArtist(slug: string) {
  return artists.find((artist) => artist.slug === slug);
}

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function artistsForEvent(event: EventItem) {
  return event.artistSlugs
    .map((slug) => getArtist(slug))
    .filter((artist): artist is Artist => Boolean(artist));
}

export function eventsForArtist(slug: string, items: EventItem[] = events) {
  const joined = items.filter(
    (event) => (event.artistSlugs.includes(slug) || event.ownerArtistSlug === slug) && isPublished(event),
  );
  const coveredParents = new Set(
    joined.map((event) => event.parentSlug).filter((value): value is string => Boolean(value)),
  );
  return joined
    .filter((event) => !coveredParents.has(event.slug))
    .sort(
      (a, b) =>
        new Date(a.sessions[0]?.startsAt ?? 0).getTime() -
        new Date(b.sessions[0]?.startsAt ?? 0).getTime(),
    );
}
