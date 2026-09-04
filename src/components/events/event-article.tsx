import Link from "next/link";
import { CoverImage } from "@/components/media/cover-image";
import { EventAccessSection } from "@/components/events/event-access-section";
import { WeatherNote } from "@/components/events/weather-note";
import { EventApplyCta } from "@/components/events/event-apply-cta";
import { EventPeople } from "@/components/events/event-people";
import { EventPrograms } from "@/components/events/event-programs";
import { EventScheduleCalendar } from "@/components/events/event-schedule-calendar";
import { EventGallery } from "@/components/events/event-gallery";
import { EventSeriesNote } from "@/components/events/event-series-note";
import { LiveSeatsProvider } from "@/components/events/live-seats";
import {
  eventCover,
  eventPlaces,
  eventPriceLabel,
  eventVenueLabel,
  inferEventKind,
  needsReservation,
  sessionCapacity,
  type EventItem,
} from "@/data/site";
import { eventPhase } from "@/lib/calendar";
import type { PublicArtistName } from "@/lib/content/public-artists";
import { loadPublicEventOptions } from "@/lib/content/public-options";
import { formatSessionRange } from "@/lib/dates";
import { localizedCategoryLabel, localizedEvent, localizedEvents, localizedGenreLabel } from "@/lib/i18n/content";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { pickCopy } from "@/lib/i18n/locale";
import type { DailyWeather } from "@/lib/weather";

type Props = {
  event: EventItem;
  weather?: DailyWeather;
  venues?: EventItem[];
  programs?: EventItem[];
  nestedByParent?: Record<string, EventItem[]>;
  lineage?: EventItem[];
  seriesPeers?: EventItem[];
  artistNames?: Record<string, PublicArtistName>;
};

export async function EventArticle({
  event,
  weather,
  venues = [],
  programs = [],
  nestedByParent = {},
  lineage = [],
  seriesPeers = [],
  artistNames = {},
}: Props) {
  const locale = await getLocale();
  const t = await getMessages();
  const options = await loadPublicEventOptions();
  const view = localizedEvent(event, locale, options);
  const localizedVenues = localizedEvents(venues, locale, options);
  const localizedPrograms = localizedEvents(programs, locale, options);
  const localizedLineage = localizedEvents(lineage, locale, options);
  const localizedPeers = localizedEvents(seriesPeers, locale, options);
  const localizedNested = Object.fromEntries(
    Object.entries(nestedByParent).map(([slug, items]) => [slug, localizedEvents(items, locale, options)]),
  );
  const catalog = [...localizedLineage, view, ...localizedVenues, ...localizedPrograms];
  const kind = inferEventKind(event, [...lineage, event, ...venues, ...programs]);
  const places = eventPlaces(view, catalog);
  const cover = eventCover(event.image);
  const archived = eventPhase(event) === "archive";
  const seatEvents = [event, ...venues, ...programs, ...Object.values(nestedByParent).flat()];
  const nameBySlug = Object.fromEntries(
    Object.entries(artistNames).map(([slug, artist]) => [
      slug,
      pickCopy(locale, artist.name, artist.i18nEnabled ? artist.nameEn : ""),
    ]),
  );
  const people = event.artistSlugs
    .map((slug) => {
      const artist = artistNames[slug];
      if (!artist) return null;
      return {
        slug,
        name: pickCopy(locale, artist.name, artist.i18nEnabled ? artist.nameEn : ""),
        genre: localizedGenreLabel(artist.genre, locale, options.genres) || artist.genre,
      };
    })
    .filter((item): item is { slug: string; name: string; genre: string } => Boolean(item));

  return (
    <article className="pb-20 md:pb-28">
      {cover ? (
        <div className="relative h-[46vh] min-h-[280px] md:h-[56vh]">
          <CoverImage src={cover} alt={view.title} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(44,36,22,0.55),transparent_45%)]" />
        </div>
      ) : null}

        <div className={`mx-auto max-w-3xl px-5 md:px-8 ${cover ? "pt-10 md:pt-14" : "pt-24 md:pt-28"}`}>
        <p className="text-[11px] tracking-[0.18em] text-tsuchi">{localizedCategoryLabel(event.categories, locale, options.categories)}</p>
        {lineage.length > 0 ? (
          <p className="mt-3 text-sm text-sumi-soft">
            {localizedLineage.map((item, index) => (
              <span key={item.slug}>
                {index > 0 ? <span className="mx-2 text-line">/</span> : null}
                <Link href={`/events/${item.slug}`} className="underline decoration-line underline-offset-4">
                  {item.title}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{view.title}</h1>

        <dl className="mt-8 space-y-3 border-y border-line py-6 text-sm leading-7">
          <div className="grid grid-cols-[5rem_1fr] gap-4">
            <dt className="text-sumi-soft">{t.events.datetime}</dt>
            <dd>
              {view.sessions.map((session) => {
                const cap = sessionCapacity(session, view);
                return (
                  <p key={session.startsAt}>
                    {formatSessionRange(session.startsAt, session.endsAt, locale)}
                    {needsReservation(event) && cap ? ` · ${t.common.capacity(cap)}` : ""}
                  </p>
                );
              })}
            </dd>
          </div>
          <div className="grid grid-cols-[5rem_1fr] gap-4">
            <dt className="text-sumi-soft">{t.events.venue}</dt>
            <dd>
              {places.venues.length
                ? places.venues.map((place) => (
                    <p key={place.id || place.title}>
                      {place.url ? (
                        <a
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-line underline-offset-4"
                        >
                          {place.title}
                        </a>
                      ) : (
                        place.title
                      )}
                    </p>
                  ))
                : eventVenueLabel(places.venues) || t.common.unset}
            </dd>
          </div>
          {eventPriceLabel(view) ? (
            <div className="grid grid-cols-[5rem_1fr] gap-4">
              <dt className="text-sumi-soft">{t.events.price}</dt>
              <dd>{eventPriceLabel(view)}</dd>
            </div>
          ) : null}
        </dl>

        <LiveSeatsProvider events={seatEvents} enabled={!archived}>
          {archived || (programs.length > 0 && !needsReservation(event)) ? null : (
            <EventApplyCta event={event} />
          )}

          {archived ? null : (
            <div className="mt-6">
              <WeatherNote outdoor={event.isOutdoor} weather={weather} />
            </div>
          )}

          <p className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-sumi-soft">{view.description}</p>

          <EventPrograms
            heading={t.events.venuesHeading}
            description={t.events.venuesDesc}
            programs={localizedVenues}
            nestedByParent={localizedNested}
            catalog={catalog}
            liveSeats={!archived}
            allowApply={!archived}
            artistNames={nameBySlug}
          />
          {kind === "festival" || kind === "venue" ? (
            <EventScheduleCalendar programs={localizedPrograms} catalog={catalog} currentSlug={event.slug} />
          ) : null}

          <EventGallery event={event} />

          <section className="mt-12">
            <h2 className="font-serif text-xl tracking-wide">{t.events.access}</h2>
            {places.access ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-sumi-soft">{places.access}</p>
            ) : null}

            <EventAccessSection archived={archived} venues={places.venues} parkings={places.parkings} />
          </section>

          <EventPeople people={people} />

          {kind === "festival" || kind === "venue" || programs.length > 0 ? (
            <EventPrograms
              kicker={
                kind === "program"
                  ? t.events.programsRelatedKicker
                  : kind === "venue"
                    ? t.events.programsVenueKicker
                    : t.events.programsHostKicker
              }
              heading={kind === "program" ? t.events.programsRelatedHeading : t.events.programsHeading}
              description={
                kind === "venue"
                  ? t.events.programsDescVenue
                  : kind === "festival"
                    ? t.events.programsDescFestival
                    : t.events.programsDescRelated
              }
              hideSessions={kind === "festival" || kind === "venue"}
              programs={localizedPrograms}
              catalog={catalog}
              currentSlug={event.slug}
              emptyMessage={
                kind === "festival" || kind === "venue"
                  ? archived
                    ? t.events.noProgramsArchived
                    : t.events.noPrograms
                  : undefined
              }
              liveSeats={!archived}
              allowApply={!archived}
              artistNames={nameBySlug}
              separated
            />
          ) : null}
        </LiveSeatsProvider>

        <EventSeriesNote event={view} peers={localizedPeers} />
      </div>
    </article>
  );
}
