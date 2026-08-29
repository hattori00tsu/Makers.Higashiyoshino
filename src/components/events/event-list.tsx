"use client";

import { CoverImage } from "@/components/media/cover-image";
import Link from "next/link";
import {
  eventCover,
  eventPlaces,
  eventVenueLabel,
  needsReservation,
  programsUnder,
  venueChildren,
  type EventItem,
} from "@/data/site";
import { formatDateJa } from "@/lib/dates";
import { localizedCategoryLabel } from "@/lib/i18n/content";
import { useCatalog, useLocale, useMessages } from "@/lib/i18n/provider";

type Props = {
  items: EventItem[];
  programs?: EventItem[];
  compact?: boolean;
  /** false なら会場だけ入れ子にし、個別の催しは出さない（アーカイブ用） */
  nestedPrograms?: boolean;
  emptyLabel?: string;
};

export function EventList({
  items,
  programs = [],
  compact = false,
  nestedPrograms: showPrograms = true,
  emptyLabel,
}: Props) {
  const locale = useLocale();
  const t = useMessages();
  const options = useCatalog();
  const empty = emptyLabel ?? t.events.noPlans;
  if (items.length === 0) {
    return <p className="text-sm leading-7 text-sumi-soft">{empty}</p>;
  }

  return (
    <ul className={compact ? "space-y-8" : "space-y-10 md:space-y-12"}>
      {items.map((event) => {
        const first = event.sessions[0];
        const catalog = [...items, ...programs];
        const nestedVenues = venueChildren(event.slug, catalog);
        const venueSlugs = new Set(nestedVenues.map((venue) => venue.slug));
        const nestedPrograms = showPrograms
          ? programsUnder(event.slug, catalog).filter(
              (program) => !program.parentSlug || !venueSlugs.has(program.parentSlug),
            )
          : [];
        const cover = eventCover(event.image);

        return (
          <li key={event.slug}>
            <Link
              href={`/events/${event.slug}`}
              className="group grid gap-5 md:grid-cols-12 md:items-center"
            >
              {cover ? (
                <div
                  className={`relative overflow-hidden ${
                    compact
                      ? "aspect-[16/10] md:col-span-4 md:aspect-[5/3]"
                      : "aspect-[16/10] md:col-span-5 md:aspect-[5/3]"
                  }`}
                >
                  <CoverImage
                    src={cover}
                    alt={event.title}
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover transition-opacity duration-500 group-hover:opacity-85"
                  />
                </div>
              ) : null}
              <div
                className={
                  cover
                    ? compact
                      ? "md:col-span-8 md:pl-2"
                      : "md:col-span-7 md:pl-4"
                    : "md:col-span-12"
                }
              >
                <p className="text-[11px] tracking-[0.18em] text-tsuchi">
                  {localizedCategoryLabel(event.categories, locale, options.categories)}
                  <span className="mx-2 text-line">/</span>
                  {formatDateJa(first?.startsAt ?? "", locale)}
                  {nestedVenues.length > 0 ? (
                    <>
                      <span className="mx-2 text-line">/</span>
                      {t.events.venuesCount(nestedVenues.length)}
                    </>
                  ) : nestedPrograms.length > 0 ? (
                    <>
                      <span className="mx-2 text-line">/</span>
                      {t.events.programsCount(nestedPrograms.length)}
                    </>
                  ) : null}
                </p>
                <h2 className="mt-2 font-serif text-2xl tracking-wide">{event.title}</h2>
                <p className="mt-3 text-sm leading-7 text-sumi-soft">{event.summary}</p>
                <p className="mt-2 text-sm text-sumi-soft">{eventVenueLabel(eventPlaces(event, catalog).venues)}</p>
              </div>
            </Link>
            {nestedVenues.length > 0 || nestedPrograms.length > 0 ? (
              <ul
                className={`mt-4 space-y-3 ${
                  cover
                    ? compact
                      ? "md:pl-[calc(33.3%+0.5rem)]"
                      : "md:pl-[calc(41.6%+1rem)]"
                    : ""
                }`}
              >
                {nestedVenues.map((venue) => {
                  const leaves = showPrograms ? programsUnder(venue.slug, catalog) : [];
                  return (
                    <li key={venue.slug}>
                      <Link href={`/events/${venue.slug}`} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                        <span className="font-serif tracking-wide">{venue.title}</span>
                        <span className="text-[12px] tracking-[0.12em] text-sumi-soft">
                          {leaves.length > 0
                            ? t.events.programsCount(leaves.length)
                            : needsReservation(venue)
                              ? t.events.reservationRequired
                              : t.events.noReservation}
                        </span>
                      </Link>
                      {leaves.length > 0 ? (
                        <ul className="mt-2 space-y-1 border-l border-line pl-3">
                          {leaves.map((leaf) => (
                            <li key={leaf.slug}>
                              <Link href={`/events/${leaf.slug}`} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                                <span>{leaf.title}</span>
                                <span className="text-[12px] tracking-[0.12em] text-sumi-soft">
                                  {needsReservation(leaf) ? t.events.reservationRequired : t.events.noReservation}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
                {nestedPrograms.map((program) => (
                  <li key={program.slug}>
                    <Link href={`/events/${program.slug}`} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                      <span className="font-serif tracking-wide">{program.title}</span>
                      <span className="text-[12px] tracking-[0.12em] text-sumi-soft">
                        {needsReservation(program) ? t.events.reservationRequired : t.events.noReservation}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
