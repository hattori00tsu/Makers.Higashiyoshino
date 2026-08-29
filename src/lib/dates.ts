import type { Locale } from "@/lib/i18n/locale";

const dateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

const dateFmtEn = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

const timeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
  timeZone: "Asia/Tokyo",
});

const monthDayFmt = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Tokyo",
});

const monthTitleFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  timeZone: "Asia/Tokyo",
});

const monthTitleFmtEn = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  timeZone: "Asia/Tokyo",
});

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateJa(iso: string, locale: Locale = "ja") {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return (locale === "en" ? dateFmtEn : dateFmt).format(date);
}

export function formatTimeJa(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return timeFmt.format(date);
}

export function tokyoHour(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return Number.NaN;
  const hour = timeFmt.formatToParts(date).find((part) => part.type === "hour")?.value;
  return Number(hour);
}

export function formatMonthDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return monthDayFmt.format(date);
}

export function formatMonthDaySlash(iso: string) {
  const key = tokyoDateKey(iso);
  if (!key) return "";
  const [, month, day] = key.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export function formatMonthDaySpan(sessions: { startsAt: string; endsAt: string }[], locale: Locale = "ja") {
  const dated = sessions.filter((session) => session.startsAt);
  if (dated.length === 0) return "";
  const start = dated[0].startsAt;
  const last = dated[dated.length - 1];
  const end = last.endsAt || last.startsAt;
  const startLabel = formatMonthDaySlash(start);
  const endLabel = formatMonthDaySlash(end);
  if (!startLabel) return "";
  const sep = locale === "en" ? "–" : "～";
  if (!endLabel || tokyoDateKey(start) === tokyoDateKey(end)) return startLabel;
  return `${startLabel}${sep}${endLabel}`;
}

export function formatSessionRange(startsAt: string, endsAt: string, locale: Locale = "ja") {
  if (!startsAt) return "";
  if (isAllDayRange(startsAt, endsAt)) {
    const startDate = formatDateJa(startsAt, locale);
    const endDate = formatDateJa(endsAt, locale);
    if (tokyoDateKey(startsAt) === tokyoDateKey(endsAt)) return startDate;
    return `${startDate} – ${endDate}`;
  }
  return `${formatDateJa(startsAt, locale)} ${formatTimeJa(startsAt)} – ${formatTimeJa(endsAt)}`;
}

export function tokyoDateKey(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return ymdFmt.format(date);
}

export function tokyoTodayKey() {
  return tokyoDateKey(new Date());
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function formatMonthTitle(year: number, monthIndex: number, locale: Locale = "ja") {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  if (Number.isNaN(date.getTime())) return "";
  return (locale === "en" ? monthTitleFmtEn : monthTitleFmt).format(date);
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date(iso));
  return formatted.replace(" ", "T");
}

export function fromDatetimeLocal(value: string) {
  if (!value) return "";
  return `${value}:00+09:00`;
}

export type SessionClock = {
  year: string;
  month: string;
  day: string;
  endYear: string;
  endMonth: string;
  endDay: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  capacity: string;
  allDay?: boolean;
};

export const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
export const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

export function emptySessionClock(allDay = false): SessionClock {
  return {
    year: "",
    month: "",
    day: "",
    endYear: "",
    endMonth: "",
    endDay: "",
    startHour: "10",
    startMinute: "00",
    endHour: "16",
    endMinute: "00",
    capacity: "",
    allDay,
  };
}

export function sessionClockFromIso(startsAt: string, endsAt: string, capacity?: number | null): SessionClock {
  const start = toDatetimeLocal(startsAt);
  const end = toDatetimeLocal(endsAt);
  const allDay = Boolean(startsAt && endsAt && isAllDayRange(startsAt, endsAt));
  if (!start || !end) {
    return { ...emptySessionClock(allDay), capacity: capacity ? String(capacity) : "" };
  }
  const [date, startTime] = start.split("T");
  const [endDate, endTime] = end.split("T");
  const [year = "", month = "", day = ""] = (date ?? "").split("-");
  const [endYear = "", endMonth = "", endDay = ""] = (endDate ?? date ?? "").split("-");
  const [startHour, startMinute] = (startTime ?? "10:00").split(":");
  const [endHour, endMinute] = (endTime ?? "16:00").split(":");
  return {
    year,
    month,
    day,
    endYear,
    endMonth,
    endDay,
    startHour,
    startMinute,
    endHour,
    endMinute,
    capacity: capacity ? String(capacity) : "",
    allDay,
  };
}

export function isCompleteYmd(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isAllDayRange(startsAt: string, endsAt: string) {
  const start = toDatetimeLocal(startsAt);
  const end = toDatetimeLocal(endsAt);
  if (!start || !end) return false;
  return start.endsWith("T00:00") && end.endsWith("T23:59");
}

export function eventIsAllDay(event: { allDay?: boolean; sessions: { startsAt: string; endsAt: string }[] }) {
  if (event.allDay) return true;
  const dated = event.sessions.filter((session) => session.startsAt);
  return dated.length > 0 && dated.every((session) => isAllDayRange(session.startsAt, session.endsAt));
}

export function sessionClockToIso(session: SessionClock, allDay = false) {
  const startDate = joinYmd(session.year, session.month, session.day);
  if (!isCompleteYmd(startDate)) return null;
  if (allDay) {
    const endDate =
      joinYmd(session.endYear, session.endMonth, session.endDay) || startDate;
    if (!isCompleteYmd(endDate) || endDate < startDate) return null;
    return {
      startsAt: fromDatetimeLocal(`${startDate}T00:00`),
      endsAt: fromDatetimeLocal(`${endDate}T23:59`),
      capacity: parseSessionCapacity(session.capacity),
    };
  }
  if (!session.startHour || !session.endHour) return null;
  const startMinute = session.startMinute || "00";
  const endMinute = session.endMinute || "00";
  return {
    startsAt: fromDatetimeLocal(`${startDate}T${session.startHour}:${startMinute}`),
    endsAt: fromDatetimeLocal(`${startDate}T${session.endHour}:${endMinute}`),
    capacity: parseSessionCapacity(session.capacity),
  };
}

function parseSessionCapacity(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function eachDateKey(startsAt: string, endsAt: string) {
  if (!startsAt) return [];
  const startKey = tokyoDateKey(startsAt);
  const endKey = endsAt ? tokyoDateKey(endsAt) : startKey;
  if (!startKey || !endKey) return [];
  const keys: string[] = [];
  let current = startKey;
  for (let i = 0; i < 400; i += 1) {
    keys.push(current);
    if (current >= endKey) break;
    current = addDaysToDateKey(current, 1);
  }
  return keys;
}

export function addDaysToDateKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function withMinute(value: string) {
  return minuteOptions.includes(value) ? minuteOptions : [...minuteOptions, value].sort();
}

export function minutesFor(value: string) {
  return withMinute(value || "00");
}

export function splitYmd(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

export function joinYmd(year: string, month: string, day: string) {
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function daysInMonth(year: string, month: string) {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

export const yearOptions = Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() - 1 + index));
export const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
export function dayOptions(year: string, month: string) {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => String(index + 1).padStart(2, "0"));
}
