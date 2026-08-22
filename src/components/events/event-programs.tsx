"use client";

import Link from "next/link";
import { ApplyButton } from "@/components/events/event-apply-cta";
import { CoverImage } from "@/components/media/cover-image";
import { useLiveSeats } from "@/components/events/live-seats";
import { liveSeatKey } from "@/lib/content/live";
import {
  eventCategoryLabel,
  eventCover,
  eventPlaces,
  eventPriceLabel,
  eventVenueLabel,
  needsReservation,
  sessionCapacity,
  type EventItem,
} from "@/data/site";
import { formatSessionRange, isAllDayRange } from "@/lib/dates";

type Props = {
  heading: string;
  description: string;
  programs: EventItem[];
  nestedByParent?: Record<string, EventItem[]>;
  catalog?: EventItem[];
  currentSlug?: string;
  emptyMessage?: string;
  liveSeats?: boolean;
  allowApply?: boolean;
  artistNames?: Record<string, string>;
  hideSessions?: boolean;
};

export function EventPrograms({
  heading,
  description,
  programs,
  nestedByParent = {},
  catalog = [],
  currentSlug,
  emptyMessage,
  liveSeats = true,
  allowApply = true,
  artistNames = {},
  hideSessions = false,
}: Props) {
  const seats = useLiveSeats() ?? {};

  if (programs.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section className="mt-12">
        <h2 className="font-serif text-xl tracking-wide">{heading}</h2>
        <p className="mt-3 text-sm leading-7 text-sumi-soft">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl tracking-wide">{heading}</h2>
      <p className="mt-3 text-sm leading-7 text-sumi-soft">{description}</p>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {programs.map((program) => (
          <ProgramRow
            key={program.slug}
            program={program}
            nested={nestedByParent[program.slug] ?? []}
            seats={liveSeats ? seats : {}}
            names={artistNames}
            catalog={catalog}
            currentSlug={currentSlug}
            allowApply={allowApply}
            hideSessions={hideSessions}
          />
        ))}
      </ul>
    </section>
  );
}

function ProgramRow({
  program,
  nested,
  seats,
  names,
  catalog,
  currentSlug,
  allowApply,
  hideSessions,
}: {
  program: EventItem;
  nested: EventItem[];
  seats: Record<string, number | null>;
  names: Record<string, string>;
  catalog: EventItem[];
  currentSlug?: string;
  allowApply: boolean;
  hideSessions: boolean;
}) {
  const people = program.artistSlugs
    .map((slug) => names[slug])
    .filter(Boolean)
    .join("、");
  const apply = needsReservation(program);
  const full =
    apply &&
    program.sessions.length > 0 &&
    program.sessions.every((session) => {
      const cap = sessionCapacity(session, program);
      if (cap == null) return false;
      return seats[liveSeatKey(program.slug, session.startsAt)] === 0;
    });
  const parent = catalog.find((item) => item.slug === program.parentSlug);
  const hostLabel = parent && parent.slug !== currentSlug ? parent.title : "";
  const cover = eventCover(program.image);
  const sessions = hideSessions
    ? program.sessions.filter((session) => isAllDayRange(session.startsAt, session.endsAt))
    : program.sessions;

  return (
    <li className="py-5">
      <div className="grid gap-5 md:grid-cols-12 md:items-start">
        {cover ? (
          <Link
            href={`/events/${program.slug}`}
            className="relative aspect-[16/10] overflow-hidden md:col-span-4 md:aspect-[5/3]"
          >
            <CoverImage
              src={cover}
              alt={program.title}
              sizes="(max-width: 768px) 100vw, 220px"
              className="object-cover"
            />
          </Link>
        ) : null}
        <div className={cover ? "md:col-span-8" : "md:col-span-12"}>
          <p className="text-[11px] tracking-[0.16em] text-tsuchi">
            {hostLabel ? (
              <>
                {hostLabel}
                <span className="mx-2 text-line">/</span>
              </>
            ) : null}
            {eventCategoryLabel(program.categories)}
            <span className="mx-2 text-line">/</span>
            {apply ? (allowApply && full ? "満席" : "要申込み") : "申込み不要"}
          </p>
          <p className="mt-1 font-serif text-lg tracking-wide">{program.title}</p>
          {program.summary ? <p className="mt-2 text-sm leading-7 text-sumi-soft">{program.summary}</p> : null}
          <p className="mt-1 text-sm text-sumi-soft">
            {people ? `${people} · ` : ""}
            {eventVenueLabel(eventPlaces(program, catalog).venues)}
            {eventPriceLabel(program) ? ` · ${eventPriceLabel(program)}` : ""}
          </p>
          {sessions.length > 0 ? (
            <div className="mt-1 space-y-1 text-sm text-sumi-soft">
              {sessions.map((session) => {
                const cap = sessionCapacity(session, program);
                const left = seats[liveSeatKey(program.slug, session.startsAt)];
                return (
                  <p key={session.startsAt}>
                    {formatSessionRange(session.startsAt, session.endsAt)}
                    {apply && cap ? ` · 定員${cap}名${left != null ? `（残${left}）` : ""}` : ""}
                  </p>
                );
              })}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link href={`/events/${program.slug}`} className="text-[13px] tracking-[0.14em] text-sugi">
              詳しく
            </Link>
            {allowApply && apply && !full ? <ApplyButton href={`/events/${program.slug}/apply`} /> : null}
          </div>
        </div>
      </div>
      {nested.length > 0 ? (
        <ul className={`mt-4 space-y-2 border-l border-line pl-4 ${cover ? "md:ml-[calc(33.3%+1.25rem)]" : ""}`}>
          {nested.map((item) => {
            const childApply = needsReservation(item);
            return (
              <li key={item.slug} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <Link href={`/events/${item.slug}`} className="font-serif tracking-wide">
                  {item.title}
                </Link>
                <span className="text-[12px] tracking-[0.12em] text-sumi-soft">
                  {childApply ? "要申込み" : "申込み不要"}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}
