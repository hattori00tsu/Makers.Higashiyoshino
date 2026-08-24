"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventItem } from "@/data/site";
import { rangeWeekCells, slotsOnDate, timedSlots, weekdays, type TimedSlot } from "@/lib/calendar";
import { formatDateJa, formatMonthDay, formatTimeJa, parseDateKey, tokyoTodayKey } from "@/lib/dates";

type Props = {
  programs: EventItem[];
  catalog?: EventItem[];
  currentSlug?: string;
};

type Tone = {
  bar: string;
  fill: string;
  ink: string;
  dot: string;
};

const tones: Tone[] = [
  { bar: "bg-sugi", fill: "bg-sugi/10", ink: "text-sugi", dot: "bg-sugi" },
  { bar: "bg-tsuchi", fill: "bg-tsuchi/10", ink: "text-tsuchi", dot: "bg-tsuchi" },
  { bar: "bg-[#325c4a]", fill: "bg-[#325c4a]/10", ink: "text-[#325c4a]", dot: "bg-[#325c4a]" },
  { bar: "bg-[#7a4a32]", fill: "bg-[#7a4a32]/10", ink: "text-[#7a4a32]", dot: "bg-[#7a4a32]" },
  { bar: "bg-[#6b3a3a]", fill: "bg-[#6b3a3a]/10", ink: "text-[#6b3a3a]", dot: "bg-[#6b3a3a]" },
  { bar: "bg-sumi", fill: "bg-sumi/10", ink: "text-sumi", dot: "bg-sumi" },
];

const visibleChips = 3;

export function EventScheduleCalendar({ programs, catalog = [], currentSlug }: Props) {
  const slots = useMemo(() => timedSlots(programs), [programs]);
  const dateKeys = useMemo(() => [...new Set(slots.map((slot) => slot.dateKey))].sort(), [slots]);
  const spanStart = dateKeys[0] ?? "";
  const spanEnd = dateKeys[dateKeys.length - 1] ?? "";
  const cells = useMemo(
    () => (spanStart ? rangeWeekCells(spanStart, spanEnd) : []),
    [spanStart, spanEnd],
  );
  const groups = useMemo(() => collectGroups(slots, catalog, currentSlug), [slots, catalog, currentSlug]);
  const legend = groups.filter((group) => group.key.startsWith("parent:"));
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    setTodayKey(tokyoTodayKey());
  }, []);

  if (slots.length === 0) return null;

  const openSlots = openDay ? slotsOnDate(slots, openDay) : [];

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl tracking-wide">日程</h2>
      <p className="mt-3 text-sm leading-7 text-sumi-soft">
        同じ色は同じ会場、または同じ催しの繰り返しです。名前で各ページへ、日を押すとその日だけ開きます。
      </p>

      {legend.length > 1 ? (
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
          {legend.map((group) => (
            <li key={group.key} className="flex items-center gap-1.5 text-[12px] leading-4 text-sumi-soft">
              <span className={`h-2 w-2 shrink-0 rounded-full ${group.tone.dot}`} />
              <span className="break-words">{group.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6">
        <p className="font-serif text-lg tracking-wide">{formatSpanTitle(spanStart, spanEnd)}</p>

        <div className="-mx-5 mt-4 overflow-x-auto px-5 md:mx-0 md:px-0">
          <div className="min-w-[56rem] md:min-w-0">
            <div className="grid grid-cols-7 border-t border-line">
              {weekdays.map((day) => (
                <p key={day} className="py-1.5 text-center text-[10px] tracking-[0.16em] text-sumi-soft">
                  {day}
                </p>
              ))}
              {cells.map((cell) => {
                const daySlots = slotsOnDate(slots, cell.key);
                const isToday = Boolean(todayKey) && cell.key === todayKey;
                const isOpen = openDay === cell.key;
                const hidden = Math.max(0, daySlots.length - visibleChips);
                const shown = hidden > 0 ? daySlots.slice(0, visibleChips - 1) : daySlots;

                return (
                  <div
                    key={cell.key}
                    className={`flex min-h-[5.5rem] flex-col border-b border-line ${
                      daySlots.length ? "min-h-[11rem] md:min-h-[13rem]" : ""
                    } ${isOpen ? "bg-kami" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDay((current) => (current === cell.key ? null : cell.key))}
                      disabled={daySlots.length === 0}
                      className="flex items-center justify-start px-1 pt-1.5 disabled:cursor-default md:px-1.5 md:pt-2"
                      aria-label={
                        daySlots.length
                          ? `${cell.day}日、催し${daySlots.length}件`
                          : `${cell.day}日`
                      }
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center text-[12px] md:h-7 md:w-7 md:text-[13px] ${
                          isToday ? "rounded-full bg-tsuchi font-medium text-kami" : ""
                        } ${!cell.inMonth && !isToday ? "text-sumi-soft/40" : ""}`}
                      >
                        {cell.day}
                      </span>
                    </button>
                    {daySlots.length ? (
                      <ul className="mt-1 flex min-w-0 flex-1 flex-col gap-1 px-0.5 pb-1.5 md:px-1">
                        {shown.map((slot) => {
                          const group = groupOf(slot, catalog, currentSlug);
                          return (
                            <li key={`${slot.event.slug}-${slot.startsAt}`}>
                              <EventChip slot={slot} tone={group.tone} />
                            </li>
                          );
                        })}
                        {hidden > 0 ? (
                          <li>
                            <button
                              type="button"
                              onClick={() => setOpenDay(cell.key)}
                              className="w-full px-1 py-0.5 text-left text-[11px] leading-4 text-sumi-soft hover:text-sumi"
                            >
                              +{daySlots.length - shown.length} 件
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {openDay && openSlots.length > 0 ? (
        <div className="mt-6 border border-line bg-kami px-4 py-4">
          <p className="text-[11px] tracking-[0.16em] text-tsuchi">{formatDateJa(dateKeyIso(openDay))}</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {openSlots.map((slot) => {
              const group = groupOf(slot, catalog, currentSlug);
              const sameTitle = group.key.startsWith("event:");
              return (
                <li key={`${slot.event.slug}-${slot.startsAt}`} className="flex gap-3 py-3">
                  <span className={`mt-1 h-8 w-1 shrink-0 rounded-full ${group.tone.bar}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] leading-5 text-sumi-soft">
                      <TimeRange startsAt={slot.startsAt} endsAt={slot.endsAt} />
                    </p>
                    <Link
                      href={`/events/${slot.event.slug}`}
                      className="mt-0.5 block break-words font-serif text-[15px] leading-6 tracking-wide"
                    >
                      {slot.event.title}
                    </Link>
                    {!sameTitle ? (
                      <p className="mt-1 text-[12px] leading-5 text-sumi-soft">{group.label}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function EventChip({ slot, tone }: { slot: TimedSlot; tone: Tone }) {
  return (
    <Link
      href={`/events/${slot.event.slug}`}
      title={`${formatTimeRange(slot.startsAt, slot.endsAt)} ${slot.event.title}`}
      className={`flex min-w-0 gap-1 rounded-sm px-1 py-1 ${tone.fill}`}
    >
      <span className={`mt-0.5 h-auto w-[3px] shrink-0 self-stretch rounded-full ${tone.bar}`} />
      <span className="min-w-0">
        <span className={`block text-[10px] leading-3 md:text-[11px] md:leading-4 ${tone.ink}`}>
          <TimeRange startsAt={slot.startsAt} endsAt={slot.endsAt} />
        </span>
        <span className="mt-0.5 block break-words text-[11px] leading-4 text-sumi md:text-[12px] md:leading-[1.35] line-clamp-2">
          {slot.event.title}
        </span>
      </span>
    </Link>
  );
}

function TimeRange({ startsAt, endsAt }: { startsAt: string; endsAt: string }) {
  const start = formatTimeJa(startsAt);
  const end = formatTimeJa(endsAt);
  if (!start) return null;
  if (!end || end === start) return <span>{start}</span>;
  return (
    <span className="break-words">
      <span>{start}</span>
      <span>–</span>
      <wbr />
      <span>{end}</span>
    </span>
  );
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const start = formatTimeJa(startsAt);
  const end = formatTimeJa(endsAt);
  if (!start) return "";
  if (!end || end === start) return start;
  return `${start}–${end}`;
}

function toneOf(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash += key.charCodeAt(i) * (i + 1);
  return tones[Math.abs(hash) % tones.length];
}

function groupOf(slot: TimedSlot, catalog: EventItem[], currentSlug?: string) {
  const parent = catalog.find((item) => item.slug === slot.event.parentSlug);
  if (parent && parent.slug !== currentSlug) {
    const key = `parent:${parent.slug}`;
    return { key, label: parent.title, tone: toneOf(key) };
  }
  const key = `event:${slot.event.slug}`;
  return { key, label: slot.event.title, tone: toneOf(key) };
}

function collectGroups(slots: TimedSlot[], catalog: EventItem[], currentSlug?: string) {
  const groups: { key: string; label: string; tone: Tone }[] = [];
  const seen = new Set<string>();
  for (const slot of slots) {
    const group = groupOf(slot, catalog, currentSlug);
    if (seen.has(group.key)) continue;
    seen.add(group.key);
    groups.push(group);
  }
  return groups;
}

function dateKeyIso(key: string) {
  return `${key}T12:00:00+09:00`;
}

function formatSpanTitle(startKey: string, endKey: string) {
  if (!startKey) return "";
  const start = parseDateKey(startKey);
  const startLabel = formatMonthDay(dateKeyIso(startKey));
  if (!endKey || startKey === endKey) return `${start.year}年${startLabel}`;
  const end = parseDateKey(endKey);
  const endLabel = formatMonthDay(dateKeyIso(endKey));
  if (start.year === end.year && start.month === end.month) {
    return `${start.year}年${startLabel} – ${end.day}日`;
  }
  if (start.year === end.year) return `${start.year}年${startLabel} – ${endLabel}`;
  return `${start.year}年${startLabel} – ${end.year}年${endLabel}`;
}
