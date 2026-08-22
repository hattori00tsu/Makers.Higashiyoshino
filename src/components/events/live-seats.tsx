"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EventItem } from "@/data/site";
import { remainingSeatsMapLive } from "@/lib/content/live";

const LiveSeatsContext = createContext<Record<string, number | null> | null>(null);

export function LiveSeatsProvider({
  events,
  enabled = true,
  children,
}: {
  events: EventItem[];
  enabled?: boolean;
  children: ReactNode;
}) {
  const [seats, setSeats] = useState<Record<string, number | null>>({});
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const eventKey = useMemo(
    () =>
      [...events]
        .map((event) => `${event.slug}:${event.sessions.map((session) => session.startsAt).join(",")}`)
        .sort()
        .join("\0"),
    [events],
  );

  useEffect(() => {
    if (!enabled) {
      setSeats({});
      return;
    }
    let active = true;
    remainingSeatsMapLive(eventsRef.current).then((next) => {
      if (active) setSeats(next);
    });
    return () => {
      active = false;
    };
  }, [enabled, eventKey]);

  return <LiveSeatsContext.Provider value={seats}>{children}</LiveSeatsContext.Provider>;
}

export function useLiveSeats() {
  return useContext(LiveSeatsContext);
}
