"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { needsReservation, type EventItem } from "@/data/site";
import {
  layoutSlotsForDay,
  openProgramsByDate,
  slotsOnDate,
  timedSlots,
  timetableHourRange,
  weekdayOfDateKey,
  type LaidOutSlot,
  type OpenDayProgram,
  type TimedSlot,
} from "@/lib/calendar";
import { formatTimeJa, parseDateKey, tokyoTodayKey } from "@/lib/dates";
import { useLocale, useMessages } from "@/lib/i18n/provider";

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

const hourPx = 80;
const gutterRem = 3;

export function EventScheduleCalendar({ programs, catalog = [], currentSlug }: Props) {
  const locale = useLocale();
  const t = useMessages();
  const reserved = useMemo(() => programs.filter(needsReservation), [programs]);
  const slots = useMemo(() => timedSlots(reserved), [reserved]);
  const openByDate = useMemo(() => openProgramsByDate(programs), [programs]);
  const dateKeys = useMemo(() => {
    const keys = new Set(slots.map((slot) => slot.dateKey));
    for (const key of openByDate.keys()) keys.add(key);
    return [...keys].sort();
  }, [slots, openByDate]);
  const groups = useMemo(() => collectGroups(slots, catalog, currentSlug), [slots, catalog, currentSlug]);
  const legend = groups.filter((group) => group.key.startsWith("parent:"));
  const laidByDate = useMemo(() => {
    const map = new Map<string, LaidOutSlot[]>();
    for (const key of dateKeys) map.set(key, layoutSlotsForDay(slotsOnDate(slots, key)));
    return map;
  }, [slots, dateKeys]);
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    setTodayKey(tokyoTodayKey());
  }, []);

  if (dateKeys.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl tracking-wide">{t.events.schedule}</h2>
      <p className="mt-3 text-sm leading-7 text-sumi-soft">{t.events.scheduleDesc}</p>

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

      <div className="mt-8 space-y-10">
        {dateKeys.map((key) => {
          const daySlots = laidByDate.get(key) ?? [];
          const open = openByDate.get(key) ?? [];
          if (daySlots.length === 0 && open.length === 0) return null;
          return (
            <DaySection
              key={key}
              dateKey={key}
              slots={daySlots}
              open={open}
              catalog={catalog}
              currentSlug={currentSlug}
              today={Boolean(todayKey) && key === todayKey}
              locale={locale}
              weekdayLabel={t.events.weekdays[weekdayOfDateKey(key)] ?? ""}
              reserveLabel={t.events.reservationRequired}
              openHeading={t.events.scheduleOpen}
              openNote={t.events.scheduleOpenNote}
            />
          );
        })}
      </div>
    </section>
  );
}

function DaySection({
  dateKey,
  slots,
  open,
  catalog,
  currentSlug,
  today,
  locale,
  weekdayLabel,
  reserveLabel,
  openHeading,
  openNote,
}: {
  dateKey: string;
  slots: LaidOutSlot[];
  open: OpenDayProgram[];
  catalog: EventItem[];
  currentSlug?: string;
  today: boolean;
  locale: string;
  weekdayLabel: string;
  reserveLabel: string;
  openHeading: string;
  openNote: string;
}) {
  const hours = timetableHourRange(slots);
  const hourCount = hours.endHour - hours.startHour;
  const hourLabels = Array.from({ length: hourCount }, (_, index) => hours.startHour + index);
  const height = hourCount * hourPx;
  const lanes = slots.length ? Math.max(1, ...slots.map((slot) => slot.lanes)) : 1;

  return (
    <section>
      <h3 className="font-serif text-lg tracking-wide">
        {formatDayHeader(dateKey, locale)}
        <span className={`ml-2 text-[12px] tracking-[0.14em] ${today ? "text-tsuchi" : "text-sumi-soft"}`}>
          {weekdayLabel}
        </span>
      </h3>
      {open.length > 0 ? (
        <div className="mt-4 border border-line bg-kami px-4 py-4">
          <p className="text-[11px] tracking-[0.16em] text-tsuchi">{openHeading}</p>
          <p className="mt-1 text-[12px] leading-5 text-sumi-soft">{openNote}</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {open.map((item) => {
              const group = groupOfEvent(item.event, catalog, currentSlug);
              const host = group.key.startsWith("parent:") ? group.label : "";
              return (
                <li key={item.event.slug} className="py-3">
                  <Link href={`/events/${item.event.slug}`} className="font-serif text-[15px] tracking-wide">
                    {item.event.title}
                  </Link>
                  {!item.allDay || host ? (
                    <p className="mt-1 text-[12px] leading-5 text-sumi-soft">
                      {item.allDay ? null : formatTimeRange(item.startsAt, item.endsAt)}
                      {!item.allDay && host ? " · " : null}
                      {host}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {slots.length > 0 ? (
        <div className={`-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0 ${open.length > 0 ? "mt-5" : "mt-4"}`}>
          <div
            className="grid border-t border-line"
            style={{
              gridTemplateColumns: `${gutterRem}rem minmax(${Math.max(10, lanes * 6.5)}rem, 1fr)`,
              minWidth: `${gutterRem + Math.max(10, lanes * 6.5)}rem`,
            }}
          >
            <div className="sticky left-0 z-10 border-b border-line bg-washi">
              <div className="relative" style={{ height }}>
                {hourLabels.map((hour, index) => (
                  <p
                    key={hour}
                    className="absolute right-2 pt-0.5 text-[10px] tracking-[0.08em] text-sumi-soft"
                    style={{ top: index * hourPx }}
                  >
                    {formatHourLabel(hour)}
                  </p>
                ))}
              </div>
            </div>
            <DayColumn
              slots={slots}
              catalog={catalog}
              currentSlug={currentSlug}
              startHour={hours.startHour}
              height={height}
              today={today}
              reserveLabel={reserveLabel}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DayColumn({
  slots,
  catalog,
  currentSlug,
  startHour,
  height,
  today,
  reserveLabel,
}: {
  slots: LaidOutSlot[];
  catalog: EventItem[];
  currentSlug?: string;
  startHour: number;
  height: number;
  today: boolean;
  reserveLabel: string;
}) {
  return (
    <div
      className={`relative border-b border-l border-line ${today ? "bg-kami/80" : ""}`}
      style={{
        height,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${hourPx - 1}px, var(--line) ${hourPx - 1}px, var(--line) ${hourPx}px)`,
      }}
    >
      {slots.map((slot) => (
        <EventBlock
          key={`${slot.event.slug}-${slot.startsAt}`}
          slot={slot}
          tone={groupOf(slot, catalog, currentSlug).tone}
          hostLabel={hostLabelOf(slot, catalog, currentSlug)}
          startHour={startHour}
          columnHeight={height}
          reserveLabel={needsReservation(slot.event) ? reserveLabel : ""}
        />
      ))}
    </div>
  );
}

function EventBlock({
  slot,
  tone,
  hostLabel,
  startHour,
  columnHeight,
  reserveLabel,
}: {
  slot: LaidOutSlot;
  tone: Tone;
  hostLabel: string;
  startHour: number;
  columnHeight: number;
  reserveLabel: string;
}) {
  const top = ((slot.startMin - startHour * 60) / 60) * hourPx;
  const rawHeight = Math.max(((slot.endMin - slot.startMin) / 60) * hourPx, 48);
  const height = Math.min(rawHeight, Math.max(columnHeight - top, 48));
  const width = `calc(${100 / slot.lanes}% - 4px)`;
  const left = `calc(${(slot.lane * 100) / slot.lanes}% + 2px)`;
  const title = reserveLabel
    ? `${formatTimeRange(slot.startsAt, slot.endsAt)} ${slot.event.title} ${reserveLabel}`
    : `${formatTimeRange(slot.startsAt, slot.endsAt)} ${slot.event.title}`;

  return (
    <Link
      href={`/events/${slot.event.slug}`}
      title={title}
      className={`absolute z-[1] overflow-hidden rounded-sm px-1.5 py-1 ${tone.fill}`}
      style={{ top, height, left, width }}
    >
      <span className="flex h-full min-h-0 gap-1">
        <span className={`w-[3px] shrink-0 self-stretch rounded-full ${tone.bar}`} />
        <span className="min-w-0">
          <span className={`block text-[10px] leading-3 md:text-[11px] md:leading-4 ${tone.ink}`}>
            <TimeRange startsAt={slot.startsAt} endsAt={slot.endsAt} />
          </span>
          <span className="mt-0.5 block break-words font-serif text-[12px] leading-4 tracking-wide text-sumi md:text-[13px] md:leading-5">
            {slot.event.title}
          </span>
          {reserveLabel ? (
            <span className="mt-0.5 block text-[10px] tracking-[0.12em] text-sumi-soft">{reserveLabel}</span>
          ) : null}
          {hostLabel ? (
            <span className="mt-0.5 block break-words text-[10px] leading-3 text-sumi-soft">{hostLabel}</span>
          ) : null}
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

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function toneOf(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash += key.charCodeAt(i) * (i + 1);
  return tones[Math.abs(hash) % tones.length];
}

function groupOfEvent(event: EventItem, catalog: EventItem[], currentSlug?: string) {
  const parent = catalog.find((item) => item.slug === event.parentSlug);
  if (parent && parent.slug !== currentSlug) {
    const key = `parent:${parent.slug}`;
    return { key, label: parent.title, tone: toneOf(key) };
  }
  const key = `event:${event.slug}`;
  return { key, label: event.title, tone: toneOf(key) };
}

function groupOf(slot: TimedSlot, catalog: EventItem[], currentSlug?: string) {
  return groupOfEvent(slot.event, catalog, currentSlug);
}

function hostLabelOf(slot: TimedSlot, catalog: EventItem[], currentSlug?: string) {
  const group = groupOf(slot, catalog, currentSlug);
  return group.key.startsWith("parent:") ? group.label : "";
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

function formatDayHeader(key: string, locale: string) {
  const { month, day } = parseDateKey(key);
  if (locale === "en") return `${month + 1}/${day}`;
  return `${month + 1}月${day}日`;
}
