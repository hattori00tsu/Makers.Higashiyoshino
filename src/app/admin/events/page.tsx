"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { useAdmin } from "@/components/admin/use-admin";
import { loadEventsLive } from "@/lib/content/live";
import { formatDateJa } from "@/lib/dates";
import { eventAncestorTitle, eventKindLabel, inferEventKind, type EventItem } from "@/data/site";

const statusLabel: Record<string, string> = {
  draft: "公開待ち",
  published: "公開",
  cancelled: "中止",
};

function byDate(a: EventItem, b: EventItem) {
  return (
    new Date(a.sessions[0]?.startsAt ?? 0).getTime() -
    new Date(b.sessions[0]?.startsAt ?? 0).getTime()
  );
}

function EventRow({
  event,
  kind,
  childCount,
  parentLabel,
}: {
  event: EventItem;
  kind: "festival" | "venue" | "program";
  childCount?: number;
  parentLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] tracking-[0.14em] text-tsuchi">
          {eventKindLabel(kind)}
          <span className="mx-2 text-line">/</span>
          {statusLabel[event.status ?? "published"]}
          <span className="mx-2 text-line">/</span>
          {event.sessions[0] ? formatDateJa(event.sessions[0].startsAt) : "日程未設定"}
          {parentLabel ? (
            <>
              <span className="mx-2 text-line">/</span>
              {parentLabel}
            </>
          ) : null}
          {childCount ? (
            <>
              <span className="mx-2 text-line">/</span>
              {kind === "festival" ? `会場 ${childCount}` : `催し ${childCount}`}
            </>
          ) : null}
        </p>
        <p className={`${kind === "festival" ? "mt-1 font-serif text-lg tracking-wide" : "text-sm text-sumi-soft"}`}>
          {event.title}
        </p>
      </div>
      <Link href={`/admin/events/${event.slug}`} className="text-[13px] tracking-[0.14em] text-sugi">
        編集
      </Link>
    </div>
  );
}

export default function AdminEventsPage() {
  const { ready, user } = useAdmin();
  const [items, setItems] = useState<EventItem[]>([]);

  const localOnly = user?.source === "preview";

  useEffect(() => {
    if (!ready) return;
    let active = true;
    loadEventsLive(localOnly).then((items) => {
      if (active) setItems(items);
    });
    return () => {
      active = false;
    };
  }, [ready, localOnly]);

  const grouped = useMemo(() => {
    const kindOf = (event: EventItem) => inferEventKind(event, items);
    const festivals = items.filter((event) => kindOf(event) === "festival").sort(byDate);
    const venues = items.filter((event) => kindOf(event) === "venue").sort(byDate);
    const programs = items
      .filter((event) => kindOf(event) === "program" && (event.status ?? "draft") !== "draft")
      .sort(byDate);
    const pending = items
      .filter((event) => kindOf(event) === "program" && (event.status ?? "draft") === "draft")
      .sort(byDate);
    const childCount = (slug: string, kind: "venue" | "program") =>
      items.filter((event) => event.parentSlug === slug && kindOf(event) === kind).length;
    return { festivals, venues, programs, pending, childCount };
  }, [items]);

  if (!ready) return <p className="px-5 pt-28 text-sm text-sumi-soft">読み込み中です。</p>;

  return (
    <div className="mx-auto max-w-3xl px-5 pt-24 pb-20 md:pt-28 md:pb-28">
      <p className="text-[11px] tracking-[0.28em] text-tsuchi">ADMIN</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide">催し</h1>
      <AdminNav />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/events/new?kind=festival"
          className="inline-flex items-center border border-line px-5 py-2.5 text-[13px] tracking-[0.16em] text-sumi"
        >
          総合開催を作る
        </Link>
        <Link
          href="/admin/events/new?kind=venue"
          className="inline-flex items-center border border-line px-5 py-2.5 text-[13px] tracking-[0.16em] text-sumi"
        >
          会場を作る
        </Link>
        <Link
          href="/admin/events/new?kind=program"
          className="inline-flex items-center border border-sumi bg-sumi px-5 py-2.5 text-[13px] tracking-[0.16em] text-kami"
        >
          個別の催しを作る
        </Link>
      </div>
      <p className="mt-6 text-sm leading-7 text-sumi-soft">
        個別の催しは、総合開催または会場の編集ページから入れると公開できます。作家が作った公開待ちも、同じページから承認します。
      </p>
      {grouped.pending.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-xl tracking-wide">公開待ち</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {grouped.pending.map((program) => {
              const parent = program.parentSlug
                ? items.find((item) => item.slug === program.parentSlug)
                : undefined;
              return (
                <li key={program.slug} className="py-4">
                  <EventRow event={program} kind="program" />
                  <p className="mt-2 text-sm text-sumi-soft">
                    {parent ? (
                      <>
                        {parent.title} のページから公開できます。
                        <Link href={`/admin/events/${parent.slug}`} className="ml-2 text-sugi">
                          開く
                        </Link>
                      </>
                    ) : (
                      "まだ総合開催・会場に入っていません。所属先のページから入れてください。"
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <div className={`${grouped.pending.length > 0 ? "mt-6" : "mt-10"} space-y-12`}>
        {grouped.festivals.length > 0 ? (
          <section>
            <h2 className="font-serif text-xl tracking-wide">総合開催</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {grouped.festivals.map((festival) => (
                <li key={festival.slug} className="py-4">
                  <EventRow event={festival} kind="festival" childCount={grouped.childCount(festival.slug, "venue")} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {grouped.venues.length > 0 ? (
          <section>
            <h2 className="font-serif text-xl tracking-wide">会場</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {grouped.venues.map((venue) => (
                <li key={venue.slug} className="py-4">
                  <EventRow
                    event={venue}
                    kind="venue"
                    parentLabel={eventAncestorTitle(venue, items)}
                    childCount={grouped.childCount(venue.slug, "program")}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {grouped.programs.length > 0 ? (
          <section>
            <h2 className="font-serif text-xl tracking-wide">個別の催し</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {grouped.programs.map((program) => (
                <li key={program.slug} className="py-4">
                  <EventRow event={program} kind="program" parentLabel={eventAncestorTitle(program, items)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
