export type ApplicationStatus = "pending" | "confirmed" | "cancelled";

export type Application = {
  id: string;
  eventSlug: string;
  sessionStartsAt: string;
  name: string;
  email: string;
  phone: string;
  partySize: number;
  note: string;
  status: ApplicationStatus;
  createdAt: string;
  userId?: string;
};

const KEY = "hy-applications-v3";

function readAll(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Application[];
  } catch {
    return [];
  }
  return [];
}

function writeAll(items: Application[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function loadApplications() {
  return readAll();
}

export function applicationsForUser(userId: string) {
  return readAll()
    .filter((item) => item.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function applicationsForEvent(eventSlug: string) {
  return readAll()
    .filter((item) => item.eventSlug === eventSlug)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function occupiedSeats(eventSlug: string, sessionStartsAt?: string) {
  return readAll()
    .filter(
      (item) =>
        item.eventSlug === eventSlug &&
        item.status !== "cancelled" &&
        (!sessionStartsAt || item.sessionStartsAt === sessionStartsAt),
    )
    .reduce((sum, item) => sum + item.partySize, 0);
}

export function remainingSeats(eventSlug: string, capacity: number | null, sessionStartsAt?: string) {
  if (!capacity) return null;
  return Math.max(0, capacity - occupiedSeats(eventSlug, sessionStartsAt));
}

export function addApplication(input: Omit<Application, "id" | "createdAt" | "status">) {
  const next: Application = {
    ...input,
    id: crypto.randomUUID(),
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  writeAll([next, ...readAll()]);
  return next;
}

export function cancelOwnApplication(id: string, userId: string) {
  const current = readAll().find((item) => item.id === id);
  if (!current || current.userId !== userId) throw new Error("forbidden");
  if (current.status === "cancelled") return;
  if (new Date(current.sessionStartsAt).getTime() <= Date.now()) throw new Error("started");
  writeAll(readAll().map((item) => (item.id === id ? { ...item, status: "cancelled" as const } : item)));
}
