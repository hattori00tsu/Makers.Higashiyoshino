"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { archiveBySeries, publicEventLists } from "@/lib/calendar";
import { localizedEvents } from "@/lib/i18n/content";
import { useCatalog, useLocale, useMessages, useSeriesLabel } from "@/lib/i18n/provider";
import type { EventItem } from "@/data/site";

export function ArchiveView({ all }: { all: EventItem[] }) {
  const locale = useLocale();
  const t = useMessages();
  const options = useCatalog();
  const series = (useSearchParams().get("series") ?? "").trim();
  const seriesLabel = useSeriesLabel(series);
  const items = localizedEvents(archiveBySeries(publicEventLists(all).archive, series), locale, options);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARCHIVE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{series ? seriesLabel : t.archive.title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-sumi-soft">
        {series ? t.archive.seriesLead : t.archive.lead}
      </p>
      <p className="mt-4 flex flex-wrap gap-6">
        <Link href="/events" className="text-[13px] tracking-[0.16em] text-sugi hover:opacity-70">
          {t.archive.back}
        </Link>
        {series ? (
          <Link href="/archive" className="text-[13px] tracking-[0.16em] text-sugi hover:opacity-70">
            {t.archive.all}
          </Link>
        ) : null}
      </p>

      <div className="mt-10 md:mt-12">
        {items.length === 0 ? (
          <p className="text-sm leading-7 text-sumi-soft">
            {series ? t.archive.emptySeries : t.archive.empty}
          </p>
        ) : (
          <EventList items={items} programs={localizedEvents(all, locale, options)} nestedPrograms={false} />
        )}
      </div>
    </div>
  );
}
