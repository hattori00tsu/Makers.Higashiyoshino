"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { eventAncestorTitle, eventCategoryLabel, eventsForArtist } from "@/data/site";
import { partitionArtistEvents } from "@/lib/calendar";
import { publishedEventsLive } from "@/lib/content/live";
import { formatDateJa } from "@/lib/dates";
import type { EventItem } from "@/data/site";

type Props = {
  slug: string;
  initial?: EventItem[];
};

export function ArtistEvents({ slug, initial = [] }: Props) {
  const [catalog, setCatalog] = useState<EventItem[]>(initial);

  useEffect(() => {
    setCatalog(initial);
  }, [initial]);

  useEffect(() => {
    if (initial.length > 0) return;
    let active = true;
    publishedEventsLive()
      .then((items) => {
        if (active) setCatalog(items);
      })
      .catch(() => {
        /* keep server data */
      });
    return () => {
      active = false;
    };
  }, [initial.length]);

  const joined = useMemo(() => eventsForArtist(slug, catalog), [slug, catalog]);
  const { upcoming, past } = useMemo(() => partitionArtistEvents(joined), [joined]);

  if (upcoming.length === 0 && past.length === 0) return null;

  return (
    <div className="mt-16 space-y-16">
      <EventGroup heading="参加予定の催し" items={upcoming} catalog={catalog} />
      <EventGroup heading="過去の参加" items={past} catalog={catalog} />
    </div>
  );
}

function EventGroup({
  heading,
  items,
  catalog,
}: {
  heading: string;
  items: EventItem[];
  catalog: EventItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-line pt-10">
      <h2 className="font-serif text-xl tracking-wide">{heading}</h2>
      <ul className="mt-6 space-y-4">
        {items.map((event) => {
          const parentTitle = eventAncestorTitle(event, catalog);
          return (
            <li key={event.slug}>
              <Link href={`/events/${event.slug}`} className="group block">
                <p className="text-[11px] tracking-[0.16em] text-tsuchi">
                  {parentTitle ? parentTitle : eventCategoryLabel(event.categories)}
                  <span className="mx-2 text-line">/</span>
                  {formatDateJa(event.sessions[0]?.startsAt ?? "")}
                </p>
                <p className="mt-1 font-serif text-lg tracking-wide group-hover:text-sugi">
                  {event.title}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
