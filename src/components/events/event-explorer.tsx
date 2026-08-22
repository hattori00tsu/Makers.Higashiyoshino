"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventItem } from "@/data/site";
import { EventList } from "@/components/events/event-list";
import {
  categoryMark,
  defaultMonth,
  eventDateKeys,
  eventsOnDate,
  monthCells,
  weekdays,
} from "@/lib/calendar";
import { formatMonthTitle, shiftMonth, tokyoTodayKey } from "@/lib/dates";
import type { DailyWeather } from "@/lib/weather";

type View = "list" | "calendar";

type Props = {
  ongoing: EventItem[];
  upcoming: EventItem[];
  programs?: EventItem[];
  weather: Record<string, DailyWeather>;
};

export function EventExplorer({ ongoing, upcoming, programs = [], weather }: Props) {
  const events = useMemo(() => [...ongoing, ...upcoming], [ongoing, upcoming]);
  const initial = defaultMonth(events);
  const legend = useMemo(
    () => [...new Set(events.flatMap((event) => event.categories))],
    [events],
  );
  const [view, setView] = useState<View>("list");
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [todayKey, setTodayKey] = useState("");
  const [selected, setSelected] = useState<string>(() => {
    const keys = eventDateKeys(events);
    const prefix = `${initial.year}-${String(initial.month + 1).padStart(2, "0")}`;
    const inMonth = [...keys].filter((key) => key.startsWith(prefix)).sort()[0];
    return inMonth ?? [...keys].sort()[0] ?? "";
  });

  useEffect(() => {
    setTodayKey(tokyoTodayKey());
  }, []);

  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const dated = eventsOnDate(events, selected);
  const outdoor = dated.some((event) => event.isOutdoor);
  const dayWeather = outdoor ? weather[selected] : undefined;
  const empty = ongoing.length === 0 && upcoming.length === 0;

  function go(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    const prefix = `${next.year}-${String(next.month + 1).padStart(2, "0")}`;
    const firstInMonth = [...eventDateKeys(events)]
      .filter((key) => key.startsWith(prefix))
      .sort()[0];
    if (firstInMonth) setSelected(firstInMonth);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 text-[13px] tracking-[0.16em]">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-2 ${view === "list" ? "text-sumi" : "text-sumi-soft"}`}
          >
            リスト
          </button>
          <span className="self-center text-line">/</span>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`px-3 py-2 ${view === "calendar" ? "text-sumi" : "text-sumi-soft"}`}
          >
            カレンダー
          </button>
        </div>
        <ArchiveLink />
      </div>

      {empty ? (
        <p className="mt-10 text-sm leading-7 text-sumi-soft md:mt-12">
          いま開催中・開催予定の催しはありません。終了したものは
          <Link href="/archive" className="mx-1 underline decoration-line underline-offset-4">
            アーカイブ
          </Link>
          にあります。
        </p>
      ) : view === "list" ? (
        <div className="mt-10 space-y-16 md:mt-12 md:space-y-20">
          {ongoing.length > 0 ? (
            <section>
              <p className="text-[11px] tracking-[0.28em] text-tsuchi">NOW</p>
              <h2 className="mt-2 font-serif text-2xl tracking-wide">開催中</h2>
              <div className="mt-8">
                <EventList items={ongoing} programs={programs} />
              </div>
            </section>
          ) : null}
          {upcoming.length > 0 ? (
            <section>
              <p className="text-[11px] tracking-[0.28em] text-tsuchi">UPCOMING</p>
              <h2 className="mt-2 font-serif text-2xl tracking-wide">開催予定</h2>
              <div className="mt-8">
                <EventList items={upcoming} programs={programs} />
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 md:mt-10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => go(-1)}
              className="h-10 px-2 text-sumi-soft hover:text-sumi"
              aria-label="前の月"
            >
              ‹
            </button>
            <p className="font-serif text-xl tracking-wide">{formatMonthTitle(year, month)}</p>
            <button
              type="button"
              onClick={() => go(1)}
              className="h-10 px-2 text-sumi-soft hover:text-sumi"
              aria-label="次の月"
            >
              ›
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 border-t border-line">
            {weekdays.map((day) => (
              <p
                key={day}
                className="py-2 text-center text-[11px] tracking-[0.16em] text-sumi-soft"
              >
                {day}
              </p>
            ))}
            {cells.map((cell) => {
              const dayEvents = eventsOnDate(events, cell.key);
              const isSelected = selected === cell.key;
              const isToday = Boolean(todayKey) && cell.key === todayKey;
              const showWeather =
                dayEvents.some((event) => event.isOutdoor) && weather[cell.key];

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelected(cell.key)}
                  className={`min-h-[4.5rem] border-b border-line px-1 py-1.5 text-left md:min-h-[5.5rem] md:px-2 ${
                    isSelected ? "bg-kami" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center text-[13px] ${
                      !cell.inMonth ? "text-sumi-soft/40" : ""
                    } ${isToday ? "font-medium text-tsuchi" : ""}`}
                  >
                    {cell.day}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {dayEvents.flatMap((event) =>
                      event.categories.map((category) => (
                        <span
                          key={`${event.slug}-${category}`}
                          className={`h-1.5 w-1.5 rounded-full ${categoryMark(category)}`}
                          title={`${event.title}（${category}）`}
                        />
                      )),
                    )}
                  </span>
                  {showWeather ? (
                    <span className="mt-1 hidden text-[10px] tracking-wide text-sumi-soft md:block">
                      {weather[cell.key].label}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] tracking-[0.14em] text-sumi-soft">
            {legend.map((category) => (
              <li key={category} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${categoryMark(category)}`} />
                {category}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <p className="text-[11px] tracking-[0.2em] text-tsuchi">
              {selected.replaceAll("-", ".")}
              {dayWeather ? (
                <span className="ml-3 text-sumi-soft">
                  {dayWeather.label} {dayWeather.tempMax}° / {dayWeather.tempMin}°
                </span>
              ) : outdoor ? (
                <span className="ml-3 text-sumi-soft">屋外 · 予報は開催が近づくと表示</span>
              ) : null}
            </p>
            <div className="mt-5">
              <EventList items={dated} programs={programs} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArchiveLink() {
  return (
    <Link href="/archive" className="text-[13px] tracking-[0.16em] text-sugi hover:opacity-70">
      アーカイブ
    </Link>
  );
}
