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
  eventCategoryLabel,
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
import { formatSessionRange } from "@/lib/dates";
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

export function EventArticle({
  event,
  weather,
  venues = [],
  programs = [],
  nestedByParent = {},
  lineage = [],
  seriesPeers = [],
  artistNames = {},
}: Props) {
  const catalog = [...lineage, event, ...venues, ...programs];
  const kind = inferEventKind(event, catalog);
  const places = eventPlaces(event, catalog);
  const cover = eventCover(event.image);
  const archived = eventPhase(event) === "archive";
  const nested = Object.values(nestedByParent).flat();
  const seatEvents = [event, ...venues, ...programs, ...nested];
  const nameBySlug = Object.fromEntries(
    Object.entries(artistNames).map(([slug, artist]) => [slug, artist.name]),
  );
  const people = event.artistSlugs
    .map((slug) => {
      const artist = artistNames[slug];
      return artist ? { slug, name: artist.name, genre: artist.genre } : null;
    })
    .filter((item): item is { slug: string; name: string; genre: string } => Boolean(item));

  return (
    <article className="pb-20 md:pb-28">
      {cover ? (
        <div className="relative h-[46vh] min-h-[280px] md:h-[56vh]">
          <CoverImage src={cover} alt={event.title} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(44,36,22,0.55),transparent_45%)]" />
        </div>
      ) : null}

        <div className={`mx-auto max-w-3xl px-5 md:px-8 ${cover ? "pt-10 md:pt-14" : "pt-24 md:pt-28"}`}>
        <p className="text-[11px] tracking-[0.18em] text-tsuchi">{eventCategoryLabel(event.categories)}</p>
        {lineage.length > 0 ? (
          <p className="mt-3 text-sm text-sumi-soft">
            {lineage.map((item, index) => (
              <span key={item.slug}>
                {index > 0 ? <span className="mx-2 text-line">/</span> : null}
                <Link href={`/events/${item.slug}`} className="underline decoration-line underline-offset-4">
                  {item.title}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{event.title}</h1>

        <dl className="mt-8 space-y-3 border-y border-line py-6 text-sm leading-7">
          <div className="grid grid-cols-[5rem_1fr] gap-4">
            <dt className="text-sumi-soft">日時</dt>
            <dd>
              {event.sessions.map((session) => {
                const cap = sessionCapacity(session, event);
                return (
                  <p key={session.startsAt}>
                    {formatSessionRange(session.startsAt, session.endsAt)}
                    {needsReservation(event) && cap ? ` · 定員${cap}名` : ""}
                  </p>
                );
              })}
            </dd>
          </div>
          <div className="grid grid-cols-[5rem_1fr] gap-4">
            <dt className="text-sumi-soft">会場</dt>
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
                : eventVenueLabel(places.venues) || "未設定"}
            </dd>
          </div>
          {eventPriceLabel(event) ? (
            <div className="grid grid-cols-[5rem_1fr] gap-4">
              <dt className="text-sumi-soft">料金</dt>
              <dd>{eventPriceLabel(event)}</dd>
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

          <p className="mt-8 text-[15px] leading-8 text-sumi-soft">{event.description}</p>

          <EventPrograms
            heading="会場"
            description="会場ごとの案内です。各会場のページから、そこで開く催しを見られます。"
            programs={venues}
            nestedByParent={nestedByParent}
            catalog={catalog}
            liveSeats={!archived}
            allowApply={!archived}
            artistNames={nameBySlug}
          />
          {kind === "festival" || kind === "venue" ? (
            <EventScheduleCalendar programs={programs} catalog={catalog} currentSlug={event.slug} />
          ) : null}
          {kind === "festival" || kind === "venue" || programs.length > 0 ? (
            <EventPrograms
              heading="催し"
              description={
                kind === "venue"
                  ? "この会場で開くワークショップや催しです。申込みと定員は各催しからどうぞ。"
                  : "この総合開催で開くワークショップや催しです。申込みと定員は各催しからどうぞ。"
              }
              hideSessions={kind === "festival" || kind === "venue"}
              programs={programs}
              catalog={catalog}
              currentSlug={event.slug}
              emptyMessage={
                kind === "festival" || kind === "venue"
                  ? archived
                    ? "この開催の個別の催しはありません。"
                    : "いま掲載中の個別の催しはありません。"
                  : undefined
              }
              liveSeats={!archived}
              allowApply={!archived}
              artistNames={nameBySlug}
            />
          ) : null}
        </LiveSeatsProvider>

        <section className="mt-12">
          <h2 className="font-serif text-xl tracking-wide">会場とアクセス</h2>
          {places.access ? (
            <p className="mt-3 text-sm leading-7 text-sumi-soft">{places.access}</p>
          ) : null}

          <EventAccessSection archived={archived} venues={places.venues} parkings={places.parkings} />
        </section>

        <EventPeople people={people} />

        <EventGallery event={event} />

        <EventSeriesNote event={event} peers={seriesPeers} />
      </div>
    </article>
  );
}
