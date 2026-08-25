const KEY = "hy-application-notify-v1";

function readAll(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
  return {};
}

function writeAll(value: Record<string, boolean>) {
  window.localStorage.setItem(KEY, JSON.stringify(value));
}

function storageKey(artistSlug: string, eventSlug: string) {
  return `${artistSlug}:${eventSlug}`;
}

export function notifyMapFromRows(rows: { event_slug?: string; notify?: boolean }[] | null | undefined) {
  const next: Record<string, boolean> = {};
  for (const row of rows ?? []) {
    const slug = String(row.event_slug ?? "").trim();
    if (!slug) continue;
    next[slug] = row.notify !== false;
  }
  return next;
}

export function localApplicationNotifyMap(artistSlug: string): Record<string, boolean> {
  if (!artistSlug) return {};
  const prefix = `${artistSlug}:`;
  const next: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(readAll())) {
    if (!key.startsWith(prefix)) continue;
    next[key.slice(prefix.length)] = value !== false;
  }
  return next;
}

export function setLocalApplicationNotify(artistSlug: string, eventSlug: string, notify: boolean) {
  const all = readAll();
  all[storageKey(artistSlug, eventSlug)] = notify;
  writeAll(all);
}
