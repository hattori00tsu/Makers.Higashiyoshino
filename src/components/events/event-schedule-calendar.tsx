"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  eventPlaces,
  eventVenueLabel,
  needsReservation,
  type EventItem,
} from "@/data/site";
import {
  groupSlotsByDate,
  rangeWeekCells,
  slotsOnDate,
  splitSlotsAmPm,
  timedSlots,
  weekdays,
  type TimedSlot,
} from "@/lib/calendar";
import { formatDateJa, formatMonthDay, formatTimeJa, parseDateKey, tokyoTodayKey } from "@/lib/dates";

type Props = {
  programs: EventItem[];
  catalog?: EventItem[];
  currentSlug?: string;
};

export function EventScheduleCalendar({ programs, catalog = [], currentSlug }: Props) {
  const slots = useMemo(() => timedSlots(programs), [programs]);
  const dateKeys = useMemo(() => [...new Set(slots.map((slot) => slot.dateKey))].sort(), [slots]);
  const spanStart = dateKeys[0] ?? "";
  const spanEnd = dateKeys[dateKeys.length - 1] ?? "";
  const initialSelected = pickInitialDate(dateKeys);
  const [selected, setSelected] = useState(initialSelected);

  const cells = useMemo(
    () => (spanStart ? rangeWeekCells(spanStart, spanEnd) : []),
    [spanStart, spanEnd],
  );
  const groups = useMemo(() => groupSlotsByDate(slots), [slots]);

  useEffect(() => {
    if (dateKeys.length === 0 || dateKeys.includes(selected)) return;
    setSelected(pickInitialDate(dateKeys));
  }, [dateKeys, selected]);

  if (slots.length === 0) return null;

  function selectDay(key: string) {
    setSelected(key);
    requestAnimationFrame(() => {
      document.getElementById(`schedule-${key}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl tracking-wide">日程</h2>
      <p className="mt-3 text-sm leading-7 text-sumi-soft">
        時刻のある催しです。カレンダーの日を押すと、下の一覧でその日の予定に移ります。
      </p>

      <div className="mt-6">
        <p className="font-serif text-lg tracking-wide">{formatSpanTitle(spanStart, spanEnd)}</p>

        <div className="mt-4 grid grid-cols-7 border-t border-line">
          {weekdays.map((day) => (
            <p key={day} className="py-1.5 text-center text-[10px] tracking-[0.16em] text-sumi-soft">
              {day}
            </p>
          ))}
          {cells.map((cell) => {
            const daySlots = slotsOnDate(slots, cell.key);
            const { morning, afternoon } = splitSlotsAmPm(daySlots);
            const isSelected = selected === cell.key;
            const isToday = cell.key === tokyoTodayKey();
            const hasEvents = daySlots.length > 0;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => selectDay(cell.key)}
                disabled={!hasEvents}
                className={`flex min-h-[11rem] flex-col items-stretch text-left disabled:cursor-default md:min-h-[20rem] ${
                  isSelected && hasEvents ? "bg-kami" : ""
                } ${hasEvents ? "hover:bg-kami/70" : ""}`}
                aria-label={
                  hasEvents
                    ? `${cell.day}日、催し${daySlots.length}件`
                    : `${cell.day}日`
                }
                aria-current={isSelected ? "date" : undefined}
              >
                <span
                  className={`mx-0.5 mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-[12px] md:mx-1.5 md:mt-2 md:h-6 md:w-6 md:text-[13px] ${
                    !cell.inMonth ? "text-sumi-soft/40" : ""
                  } ${isToday ? "font-medium text-tsuchi" : ""}`}
                >
                  {cell.day}
                </span>
                <div className="mt-1 flex min-h-0 flex-1 flex-col border-t border-line">
                  <PeriodCell label="午前" slots={morning} />
                  <PeriodCell label="午後" slots={afternoon} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <ol className="mt-8 space-y-6">
        {groups.map((group) => {
          const first = group.slots[0];
          const { morning, afternoon } = splitSlotsAmPm(group.slots);
          const isSelected = selected === group.dateKey;
          return (
            <li
              key={group.dateKey}
              id={`schedule-${group.dateKey}`}
              className={`scroll-mt-24 border-l-2 pl-4 ${isSelected ? "border-tsuchi" : "border-line"}`}
            >
              <p className="text-[11px] tracking-[0.16em] text-tsuchi">{formatDateJa(first.startsAt)}</p>
              <PeriodList label="午前" slots={morning} catalog={catalog} currentSlug={currentSlug} />
              <PeriodList label="午後" slots={afternoon} catalog={catalog} currentSlug={currentSlug} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PeriodCell({ label, slots }: { label: string; slots: TimedSlot[] }) {
  return (
    <div className="flex min-h-[4.25rem] flex-1 flex-col border-b border-line px-0.5 py-1 md:min-h-[8rem] md:px-1.5 md:py-1.5">
      <p className="text-[8px] tracking-[0.16em] text-sumi-soft md:text-[10px]">{label}</p>
      {slots.length > 0 ? (
        <ul className="mt-0.5 min-w-0 space-y-0.5 md:mt-1 md:space-y-1">
          {slots.map((slot) => (
            <li
              key={`${slot.event.slug}-${slot.startsAt}`}
              className="truncate text-[9px] leading-3 text-sumi-soft md:text-[11px] md:leading-4"
            >
              <span className="text-sumi">{formatTimeJa(slot.startsAt)}</span>
              <span className="ml-0.5">{slot.event.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PeriodList({
  label,
  slots,
  catalog,
  currentSlug,
}: {
  label: string;
  slots: TimedSlot[];
  catalog: EventItem[];
  currentSlug?: string;
}) {
  if (slots.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] tracking-[0.16em] text-sumi-soft">{label}</p>
      <ul className="mt-1 divide-y divide-line border-y border-line">
        {slots.map((slot) => {
          const parent = catalog.find((item) => item.slug === slot.event.parentSlug);
          const hostLabel = parent && parent.slug !== currentSlug ? parent.title : "";
          const venue = eventVenueLabel(eventPlaces(slot.event, catalog).venues);
          const apply = needsReservation(slot.event);
          return (
            <li key={`${slot.event.slug}-${slot.startsAt}`} className="py-3">
              <p className="text-[12px] tracking-[0.08em] text-sumi-soft">
                {formatTimeJa(slot.startsAt)}
                {slot.endsAt ? ` – ${formatTimeJa(slot.endsAt)}` : ""}
              </p>
              <Link href={`/events/${slot.event.slug}`} className="mt-0.5 inline-block font-serif tracking-wide">
                {slot.event.title}
              </Link>
              <p className="mt-1 text-[12px] tracking-[0.08em] text-sumi-soft">
                {hostLabel || venue ? `${hostLabel || venue}` : ""}
                {hostLabel || venue ? <span className="mx-2 text-line">/</span> : null}
                {apply ? "要申込み" : "申込み不要"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
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

function pickInitialDate(keys: string[]) {
  const sorted = [...keys].sort();
  const today = tokyoTodayKey();
  if (sorted.includes(today)) return today;
  return sorted.find((key) => key >= today) ?? sorted[0] ?? today;
}
