import type { Artist, EventItem, PlaceOption } from "@/data/site";
import { parseArtistGenres } from "@/lib/account/types";
import type {
  AboutConcept,
  HomeDisplay,
  HomeHero,
  HomeVillage,
} from "@/lib/content/home-display";
import type { EventOptions, NamedOption } from "@/lib/content/options";
import { pickCopy, type Locale } from "@/lib/i18n/locale";

export function localizedHero(hero: HomeHero, locale: Locale): HomeHero {
  return {
    ...hero,
    sideLabel: pickCopy(locale, hero.sideLabel, hero.sideLabelEn),
    title: pickCopy(locale, hero.title, hero.titleEn),
    lead: pickCopy(locale, hero.lead, hero.leadEn),
  };
}

export function localizedVillage(village: HomeVillage, locale: Locale): HomeVillage {
  return {
    ...village,
    title: pickCopy(locale, village.title, village.titleEn),
    schedule: pickCopy(locale, village.schedule, village.scheduleEn),
    summary: pickCopy(locale, village.summary, village.summaryEn),
  };
}

export function localizedAbout(about: AboutConcept, locale: Locale): AboutConcept {
  return {
    ...about,
    heading: pickCopy(locale, about.heading, about.headingEn),
    title: pickCopy(locale, about.title, about.titleEn),
    body: pickCopy(locale, about.body, about.bodyEn),
  };
}

export function localizedHomeDisplay(display: HomeDisplay, locale: Locale): HomeDisplay {
  if (locale !== "en") return display;
  return {
    ...display,
    hero: localizedHero(display.hero, locale),
    villages: display.villages.map((item) => localizedVillage(item, locale)),
    about: localizedAbout(display.about, locale),
  };
}

export function namedLabel(name: string, items: NamedOption[] | undefined, locale: Locale) {
  if (!name) return "";
  const found = items?.find((item) => item.name === name);
  return pickCopy(locale, name, found?.nameEn);
}

export function localizedCategoryLabel(
  categories: string[] | undefined,
  locale: Locale,
  catalog?: NamedOption[],
) {
  const names = (categories ?? []).map((name) => namedLabel(name, catalog, locale)).filter(Boolean);
  return names.length ? names.join(" · ") : locale === "en" ? "Event" : "催し";
}

export function localizedGenreLabel(genre: string, locale: Locale, catalog?: NamedOption[]) {
  const names = parseArtistGenres(genre).map((name) => namedLabel(name, catalog, locale));
  if (!names.length) return "";
  return locale === "en" ? names.join(" · ") : names.join("、");
}

export function localizePlace(place: PlaceOption, locale: Locale, catalog?: PlaceOption[]): PlaceOption {
  const fromCatalog = catalog?.find(
    (item) => item.id === place.id || (!!place.title && item.title === place.title),
  );
  const titleEn = place.titleEn || fromCatalog?.titleEn;
  return {
    ...place,
    title: pickCopy(locale, place.title, titleEn),
    titleEn: titleEn || place.titleEn,
  };
}

export function localizePlaces(places: PlaceOption[] | undefined, locale: Locale, catalog?: PlaceOption[]) {
  return (places ?? []).map((place) => localizePlace(place, locale, catalog));
}

export function localizedEvent(event: EventItem, locale: Locale, options?: EventOptions): EventItem {
  if (locale !== "en") return event;
  const places = {
    venues: localizePlaces(event.venues, locale, options?.venues),
    parkings: localizePlaces(event.parkings, locale, options?.parkings),
  };
  if (!event.i18nEnabled) {
    return { ...event, ...places };
  }
  return {
    ...event,
    ...places,
    title: pickCopy(locale, event.title, event.titleEn),
    summary: pickCopy(locale, event.summary, event.summaryEn),
    description: pickCopy(locale, event.description, event.descriptionEn),
    access: pickCopy(locale, event.access, event.accessEn),
    price: pickCopy(locale, event.price ?? "", event.priceEn),
  };
}

export function localizedEvents(items: EventItem[], locale: Locale, options?: EventOptions) {
  return locale === "en" ? items.map((item) => localizedEvent(item, locale, options)) : items;
}

export function localizedArtist(artist: Artist, locale: Locale, options?: EventOptions): Artist {
  if (locale !== "en") return artist;
  const genre = localizedGenreLabel(artist.genre, locale, options?.genres) || artist.genre;
  if (!artist.i18nEnabled) {
    return genre === artist.genre ? artist : { ...artist, genre };
  }
  return {
    ...artist,
    genre,
    name: pickCopy(locale, artist.name, artist.nameEn),
    area: pickCopy(locale, artist.area, artist.areaEn),
    bio: pickCopy(locale, artist.bio, artist.bioEn),
    profile: pickCopy(locale, artist.profile, artist.profileEn),
    studio: {
      ...artist.studio,
      visit: pickCopy(locale, artist.studio.visit, artist.studioVisitEn),
    },
    links: (artist.links ?? []).map((link) => ({
      ...link,
      name: pickCopy(locale, link.name, link.nameEn),
    })),
  };
}

export function localizedArtists(items: Artist[], locale: Locale, options?: EventOptions) {
  return locale === "en" ? items.map((item) => localizedArtist(item, locale, options)) : items;
}
