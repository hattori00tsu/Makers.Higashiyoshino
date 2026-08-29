"use client";

import Link from "next/link";
import { inferEventKind, type EventItem } from "@/data/site";
import { eventPhase, eventSeriesName } from "@/lib/calendar";
import { formatMonthDaySpan } from "@/lib/dates";
import { useLocale, useMessages } from "@/lib/i18n/provider";

type Props = {
  event: EventItem;
  peers: EventItem[];
};

export function EventSeriesNote({ event, peers }: Props) {
  const locale = useLocale();
  const t = useMessages();
  const series = eventSeriesName(event);
  if (!series || peers.length === 0) return null;

  const current = peers.filter((item) => {
    const phase = eventPhase(item);
    return phase === "ongoing" || phase === "upcoming";
  });
  const past = peers
    .filter((item) => eventPhase(item) === "archive")
    .slice()
    .reverse();
  const kind = inferEventKind(event, [event, ...peers]);
  const showArchive = kind === "festival" || kind === "venue";

  return (
    <section className="mt-16 border-t border-line pt-8">
      <p className="text-[11px] tracking-[0.2em] text-tsuchi">SERIES</p>
      <h2 className="mt-2 font-serif text-lg tracking-wide">{series}</h2>
      {current.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-7">
          {current.map((item) => (
            <li key={item.slug}>
              <Link href={`/events/${item.slug}`} className="underline decoration-line underline-offset-4">
                {item.title}
              </Link>
              <span className="ml-2 text-[12px] tracking-[0.12em] text-sumi-soft">
                {eventPhase(item) === "ongoing" ? t.events.now : t.events.upcoming}
                {formatMonthDaySpan(item.sessions, locale) ? ` / ${formatMonthDaySpan(item.sessions, locale)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {past.length > 0 ? (
        <div className={current.length > 0 ? "mt-6" : "mt-4"}>
          <p className="text-[12px] tracking-[0.14em] text-sumi-soft">{t.events.seriesPast}</p>
          <ul className="mt-2 space-y-2 text-sm leading-7 text-sumi-soft">
            {past.map((item) => (
              <li key={item.slug}>
                <Link href={`/events/${item.slug}`} className="underline decoration-line underline-offset-4">
                  {item.title}
                </Link>
                {formatMonthDaySpan(item.sessions, locale) ? (
                  <span className="ml-2 text-[12px] tracking-[0.12em]">{formatMonthDaySpan(item.sessions, locale)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {showArchive ? (
        <p className="mt-5">
          <Link
            href={`/archive?series=${encodeURIComponent(series)}`}
            className="text-[13px] tracking-[0.16em] text-sugi hover:opacity-70"
          >
            {t.footer.archive}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
