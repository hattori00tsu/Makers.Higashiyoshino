"use client";

import { useEffect, useState } from "react";
import { EventArticle } from "@/components/events/event-article";
import { eventLineage, programsUnder, venueChildren } from "@/data/site";
import { eventsInSeries } from "@/lib/calendar";
import { findEventLive, publishedEventsLive } from "@/lib/content/live";
import { tokyoDateKey } from "@/lib/dates";
import type { EventItem } from "@/data/site";
import type { DailyWeather } from "@/lib/weather";

type Props = {
  slug: string;
  initial: EventItem | null;
  initialPrograms?: EventItem[];
  initialVenues?: EventItem[];
  initialParent?: EventItem | null;
  initialLineage?: EventItem[];
  initialNestedByParent?: Record<string, EventItem[]>;
  initialSeriesPeers?: EventItem[];
  forecast: Record<string, DailyWeather>;
};

export function EventDetailClient({
  slug,
  initial,
  initialPrograms = [],
  initialVenues = [],
  initialParent = null,
  initialLineage,
  initialNestedByParent = {},
  initialSeriesPeers = [],
  forecast,
}: Props) {
  const [event, setEvent] = useState<EventItem | null>(initial);
  const [programs, setPrograms] = useState<EventItem[]>(initialPrograms);
  const [venues, setVenues] = useState<EventItem[]>(initialVenues);
  const [nestedByParent, setNestedByParent] = useState<Record<string, EventItem[]>>(initialNestedByParent);
  const [seriesPeers, setSeriesPeers] = useState<EventItem[]>(initialSeriesPeers);
  const [lineage, setLineage] = useState<EventItem[]>(
    initialLineage ?? (initialParent ? [initialParent] : []),
  );
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const next = (await findEventLive(slug)) ?? initial;
        if (!active) return;
        setEvent(next);
        if (!next) {
          setPrograms([]);
          setVenues([]);
          setNestedByParent({});
          setLineage([]);
          setSeriesPeers([]);
          return;
        }
        const all = await publishedEventsLive();
        if (!active) return;
        if (all.length === 0) return;
        const nextVenues = venueChildren(next.slug, all);
        const nextPrograms = programsUnder(next.slug, all);
        setVenues(nextVenues);
        setPrograms(nextPrograms);
        setNestedByParent(
          Object.fromEntries(nextVenues.map((child) => [child.slug, programsUnder(child.slug, all)])),
        );
        setLineage(eventLineage(next, all));
        setSeriesPeers(eventsInSeries(next, all));
      } catch {
        /* 取得に失敗してもサーバー側の初期表示を残す */
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug, initial]);

  if (loading && !event) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-20">
        <p className="text-sm text-sumi-soft">読み込み中です。</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-28 pb-20">
        <p className="text-sm text-sumi-soft">催しが見つかりません。</p>
      </div>
    );
  }

  const start = event.sessions[0]?.startsAt;
  const weather = event.isOutdoor && start ? forecast[tokyoDateKey(start)] : undefined;
  return (
    <EventArticle
      event={event}
      weather={weather}
      venues={venues}
      programs={programs}
      nestedByParent={nestedByParent}
      lineage={lineage}
      seriesPeers={seriesPeers}
    />
  );
}
