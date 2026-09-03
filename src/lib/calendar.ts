import { inferEventKind, isPublished, isTopLevel, type EventItem, type EventKind } from "@/data/site";
import { addDaysToDateKey, eachDateKey, isAllDayRange, parseDateKey, tokyoDateKey, tokyoHour } from "@/lib/dates";

export const weekdays = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const categoryMarkPalette = [
  "bg-sugi",
  "bg-tsuchi",
  "bg-sumi",
  "bg-[#7a4a32]",
  "bg-[#325c4a]",
  "bg-[#6b3a3a]",
] as const;

const knownMarks: Record<string, string> = {
  開放: "bg-sugi",
  展示: "bg-tsuchi",
  ワークショップ: "bg-sumi",
  音楽: "bg-[#7a4a32]",
};

export function categoryMark(name: string) {
  if (knownMarks[name]) return knownMarks[name];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash += name.charCodeAt(i);
  return categoryMarkPalette[hash % categoryMarkPalette.length];
}

export type CalendarCell = {
  key: string;
  day: number;
  inMonth: boolean;
};

export function monthCells(year: number, monthIndex: number): CalendarCell[] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    const day = prevMonthDays - firstWeekday + 1 + i;
    const date = new Date(year, monthIndex - 1, day);
    cells.push({ key: tokyoDateKey(date), day, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({ key: tokyoDateKey(date), day, inMonth: true });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, nextDay);
    cells.push({ key: tokyoDateKey(date), day: nextDay, inMonth: false });
    nextDay += 1;
  }

  return cells;
}

function dateKeyWeekday(key: string) {
  const { year, month, day } = parseDateKey(key);
  return new Date(year, month, day).getDay();
}

/** 開始〜終了を含む週だけ。前後の空白は日曜始まり・土曜終わりまで。 */
export function rangeWeekCells(startKey: string, endKey: string): CalendarCell[] {
  if (!startKey && !endKey) return [];
  const start = !endKey || startKey <= endKey ? startKey : endKey;
  const end = !startKey || startKey <= endKey ? endKey || startKey : startKey;
  if (!start) return [];

  const from = addDaysToDateKey(start, -dateKeyWeekday(start));
  const to = addDaysToDateKey(end, 6 - dateKeyWeekday(end));
  const cells: CalendarCell[] = [];
  let current = from;
  for (let i = 0; i < 42; i += 1) {
    const { day } = parseDateKey(current);
    cells.push({
      key: current,
      day,
      inMonth: current >= start && current <= end,
    });
    if (current >= to) break;
    current = addDaysToDateKey(current, 1);
  }
  return cells;
}

export function eventsOnDate(items: EventItem[], dateKey: string) {
  return items.filter((event) =>
    event.sessions.some((session) => eachDateKey(session.startsAt, session.endsAt).includes(dateKey)),
  );
}

export function eventDateKeys(items: EventItem[]) {
  const keys = new Set<string>();
  for (const event of items) {
    for (const session of event.sessions) {
      for (const key of eachDateKey(session.startsAt, session.endsAt)) keys.add(key);
    }
  }
  return keys;
}

export type TimedSlot = {
  dateKey: string;
  startsAt: string;
  endsAt: string;
  event: EventItem;
};

/** 終日ではなく、開始時刻のある枠だけ。総合開催・会場の小カレンダー用。 */
export function timedSlots(items: EventItem[]): TimedSlot[] {
  const slots: TimedSlot[] = [];
  for (const event of items) {
    for (const session of event.sessions) {
      if (!session.startsAt || isAllDayRange(session.startsAt, session.endsAt)) continue;
      const dateKey = tokyoDateKey(session.startsAt);
      if (!dateKey) continue;
      slots.push({
        dateKey,
        startsAt: session.startsAt,
        endsAt: session.endsAt || session.startsAt,
        event,
      });
    }
  }
  return slots.sort((a, b) => {
    const byTime = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    if (byTime !== 0) return byTime;
    return a.event.title.localeCompare(b.event.title, "ja");
  });
}

export function slotsOnDate(slots: TimedSlot[], dateKey: string) {
  return slots.filter((slot) => slot.dateKey === dateKey);
}

export function isAfternoonSlot(slot: TimedSlot) {
  return tokyoHour(slot.startsAt) >= 12;
}

export function splitSlotsAmPm(slots: TimedSlot[]) {
  const morning: TimedSlot[] = [];
  const afternoon: TimedSlot[] = [];
  for (const slot of slots) {
    if (isAfternoonSlot(slot)) afternoon.push(slot);
    else morning.push(slot);
  }
  return { morning, afternoon };
}

export function groupSlotsByDate(slots: TimedSlot[]) {
  const groups: { dateKey: string; slots: TimedSlot[] }[] = [];
  const index = new Map<string, TimedSlot[]>();
  for (const slot of slots) {
    const existing = index.get(slot.dateKey);
    if (existing) {
      existing.push(slot);
    } else {
      const next = [slot];
      index.set(slot.dateKey, next);
      groups.push({ dateKey: slot.dateKey, slots: next });
    }
  }
  return groups;
}

export function defaultMonth(items: EventItem[]) {
  const now = new Date();
  const stamps = items.flatMap((event) =>
    event.sessions.map((session) => new Date(session.startsAt)),
  );
  const upcoming = stamps
    .filter((date) => Number.isFinite(date.getTime()) && date.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const past = stamps
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const target = upcoming ?? past ?? now;
  const key = tokyoDateKey(target);
  const [year, month] = key.split("-").map(Number);
  if (!year || !Number.isFinite(month)) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year, month: month - 1 };
}

export function upcomingEvents(items: EventItem[], limit = 3) {
  const now = Date.now();
  return items
    .slice()
    .sort(
      (a, b) =>
        new Date(a.sessions[0].startsAt).getTime() -
        new Date(b.sessions[0].startsAt).getTime(),
    )
    .filter((event) => {
      const last = event.sessions[event.sessions.length - 1];
      return new Date(last.endsAt).getTime() >= now;
    })
    .slice(0, limit);
}

function sessionStamp(value?: string) {
  if (!value) return Number.NaN;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

export function eventStartTime(event: EventItem) {
  for (const session of event.sessions) {
    const start = sessionStamp(session.startsAt);
    if (Number.isFinite(start)) return start;
  }
  return 0;
}

export function eventEndTime(event: EventItem) {
  let last = 0;
  for (const session of event.sessions) {
    const end = sessionStamp(session.endsAt) || sessionStamp(session.startsAt);
    if (Number.isFinite(end) && end > last) last = end;
  }
  return last;
}

export type EventPhase = "ongoing" | "upcoming" | "archive";

/** 公開済みの日程がある催しを、開催中 / 開催予定 / アーカイブに分ける。日程がないものは対象外。 */
export function eventPhase(event: EventItem, now = Date.now()): EventPhase | null {
  if (!event.sessions.some((session) => session.startsAt)) return null;
  const start = eventStartTime(event);
  const end = eventEndTime(event);
  if (!start && !end) return null;
  if (end && end < now) return "archive";
  if (start && start > now) return "upcoming";
  return "ongoing";
}

export function partitionEventPhases(items: EventItem[], now = Date.now()) {
  const ongoing: EventItem[] = [];
  const upcoming: EventItem[] = [];
  const archive: EventItem[] = [];
  for (const event of items) {
    const phase = eventPhase(event, now);
    if (phase === "ongoing") ongoing.push(event);
    else if (phase === "upcoming") upcoming.push(event);
    else if (phase === "archive") archive.push(event);
  }
  return { ongoing, upcoming, archive };
}

export function isFestivalOrVenue(event: EventItem, catalog: EventItem[]) {
  const kind = inferEventKind(event, catalog);
  return kind === "festival" || kind === "venue";
}

const kindRank: Record<EventKind, number> = { festival: 0, venue: 1, program: 2 };

export function sortEventsByKind(items: EventItem[], catalog: EventItem[]) {
  return items.slice().sort((a, b) => {
    const rank = kindRank[inferEventKind(a, catalog)] - kindRank[inferEventKind(b, catalog)];
    if (rank) return rank;
    return eventStartTime(a) - eventStartTime(b);
  });
}

export function groupEventsByKind(items: EventItem[], catalog: EventItem[]) {
  const groups: Record<EventKind, EventItem[]> = { festival: [], venue: [], program: [] };
  for (const event of sortEventsByKind(items, catalog)) {
    groups[inferEventKind(event, catalog)].push(event);
  }
  return (["festival", "venue", "program"] as const)
    .map((kind) => ({ kind, items: groups[kind] }))
    .filter((group) => group.items.length > 0);
}

/** 公開ページ用。開催中・開催予定・アーカイブとも、総合開催→会場→個別の催しの順で全部出す。 */
export function publicEventLists(items: EventItem[], now = Date.now()) {
  const published = items.filter(isPublished);
  const { ongoing, upcoming, archive } = partitionEventPhases(published, now);
  return {
    ongoing: sortEventsByKind(ongoing, published),
    upcoming: sortEventsByKind(upcoming, published),
    archive: archive
      .slice()
      .sort((a, b) => {
        const rank = kindRank[inferEventKind(a, published)] - kindRank[inferEventKind(b, published)];
        if (rank) return rank;
        return eventEndTime(b) - eventEndTime(a);
      }),
  };
}

/** LP用。親のない催しに加え、総合開催・会場の配下の個別催しも候補にする。会場枠は親がある限り出さない。 */
export function homeEventLists(items: EventItem[], now = Date.now()) {
  const published = items.filter(isPublished);
  const candidates = published.filter(
    (event) => isTopLevel(event) || inferEventKind(event, published) === "program",
  );
  return partitionEventPhases(candidates, now);
}

export function eventSeriesName(event: Pick<EventItem, "series">) {
  return event.series?.trim() ?? "";
}

/** 同じシリーズ・同じ種別の公開催し。自分は除く。開始が早い順。 */
export function eventsInSeries(event: EventItem, items: EventItem[]) {
  const series = eventSeriesName(event);
  if (!series) return [];
  const kind = inferEventKind(event, items);
  return items
    .filter(isPublished)
    .filter(
      (item) =>
        item.slug !== event.slug &&
        eventSeriesName(item) === series &&
        inferEventKind(item, items) === kind,
    )
    .sort((a, b) => eventStartTime(a) - eventStartTime(b));
}

export function archiveBySeries(items: EventItem[], series: string) {
  const name = series.trim();
  if (!name) return items;
  return items.filter((item) => eventSeriesName(item) === name);
}

export function isUpcomingEvent(event: EventItem, now = Date.now()) {
  const end = eventEndTime(event);
  return !end || end >= now;
}

export function partitionArtistEvents(items: EventItem[], now = Date.now()) {
  const upcoming: EventItem[] = [];
  const past: EventItem[] = [];
  for (const event of items) {
    if (isUpcomingEvent(event, now)) upcoming.push(event);
    else past.push(event);
  }
  upcoming.sort((a, b) => eventStartTime(a) - eventStartTime(b));
  past.sort((a, b) => eventStartTime(b) - eventStartTime(a));
  return { upcoming, past };
}
