"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { archiveBySeries, publicEventLists } from "@/lib/calendar";
import type { EventItem } from "@/data/site";

export function ArchiveView({ all }: { all: EventItem[] }) {
  const series = (useSearchParams().get("series") ?? "").trim();
  const items = archiveBySeries(publicEventLists(all).archive, series);

  return (
    <div className="mx-auto max-w-6xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ARCHIVE</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide md:text-4xl">{series || "アーカイブ"}</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-sumi-soft">
        {series
          ? "このシリーズの、終了した総合開催と会場です。"
          : "終了した総合開催と会場です。個別の催しは、それぞれのページからご覧ください。"}
      </p>
      <p className="mt-4 flex flex-wrap gap-6">
        <Link href="/events" className="text-[13px] tracking-[0.16em] text-sugi hover:opacity-70">
          催しへ戻る
        </Link>
        {series ? (
          <Link href="/archive" className="text-[13px] tracking-[0.16em] text-sugi hover:opacity-70">
            アーカイブ一覧
          </Link>
        ) : null}
      </p>

      <div className="mt-10 md:mt-12">
        {items.length === 0 ? (
          <p className="text-sm leading-7 text-sumi-soft">
            {series ? "このシリーズの過去の催しはまだありません。" : "過去の催しはまだありません。"}
          </p>
        ) : (
          <EventList items={items} programs={all} nestedPrograms={false} />
        )}
      </div>
    </div>
  );
}
